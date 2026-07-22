const express = require('express');
const router = express.Router();
const db = require('../database');

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }
  next();
}

// Get all safety courses & completions
router.get('/', requireAuth, (req, res) => {
  try {
    const courses = db.getAllCourses();
    let completions = [];

    if (req.session.role === 'admin') {
      const vendorId = req.query.vendorId;
      if (vendorId) {
        completions = db.getCompletionsByVendorId(vendorId);
      } else {
        const allVendors = db.getAllVendors();
        allVendors.forEach(v => {
          completions.push(...db.getCompletionsByVendorId(v.id));
        });
      }
    } else {
      completions = db.getCompletionsByVendorId(req.session.vendorId);
    }

    if (req.session.role === 'employee' && req.session.employeeId) {
      const currentEmp = db.getAllEmployees().find(e => e.id === req.session.employeeId);
      const empName = currentEmp ? currentEmp.employeeName : '';
      completions = completions.filter(c => c.employeeId === req.session.employeeId || (empName && c.employeeName === empName));
    }

    const vendorsMap = new Map(db.getAllVendors().map(v => [v.id, v.companyName]));
    completions = completions.map(c => ({
      ...c,
      companyName: vendorsMap.get(c.vendorId) || 'Vendor'
    }));

    res.json({ courses, completions });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch course data' });
  }
});

// Admin endpoint: Create or update course
router.post('/manage', requireAdmin, (req, res) => {
  try {
    const { id, courseCode, title, category, durationHours, description, requiredByMaxx } = req.body;

    if (!courseCode || !title) {
      return res.status(400).json({ error: 'Course code and title are required.' });
    }

    const updated = db.saveCourse({
      id: id || null,
      courseCode,
      title,
      category: category || 'General Safety',
      durationHours: parseFloat(durationHours) || 1.0,
      description: description || '',
      requiredByMaxx: Boolean(requiredByMaxx)
    });

    res.json({ message: 'Safety course updated successfully!', course: updated });
  } catch (err) {
    console.error('Error managing course:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Admin endpoint: Toggle course required status
router.post('/toggle-required/:id', requireAdmin, (req, res) => {
  try {
    const courses = db.getAllCourses();
    const course = courses.find(c => c.id === req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.requiredByMaxx = !course.requiredByMaxx;
    db.saveCourse(course);

    res.json({
      message: `Course ${course.title} is now ${course.requiredByMaxx ? 'MANDATORY' : 'OPTIONAL'}`,
      course
    });
  } catch (err) {
    console.error('Error toggling course requirement:', err);
    res.status(500).json({ error: 'Failed to toggle course requirement' });
  }
});

// Admin endpoint: Delete course
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    db.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Record a completed safety course
router.post('/record', requireAuth, (req, res) => {
  try {
    const { employeeName, courseId, completionDate, expiryDate, certNumber, vendorId } = req.body;
    const targetVendorId = req.session.role === 'admin' ? (vendorId || req.session.vendorId) : req.session.vendorId;

    if (!employeeName || !courseId || !completionDate) {
      return res.status(400).json({ error: 'Employee Name, Course, and Completion Date are required.' });
    }

    const courses = db.getAllCourses();
    const courseObj = courses.find(c => c.id === courseId);
    const courseTitle = courseObj ? courseObj.title : 'MAXX Safety Training';

    let expDate = expiryDate;
    if (!expDate) {
      const d = new Date(completionDate);
      d.setFullYear(d.getFullYear() + 1);
      expDate = d.toISOString().split('T')[0];
    }

    const newComp = db.addCourseCompletion({
      vendorId: targetVendorId,
      employeeName,
      courseId,
      courseTitle,
      completionDate,
      expiryDate: expDate,
      certNumber: certNumber || 'MXC-' + Math.floor(100000 + Math.random() * 900000)
    });

    // Auto-complete any matching assigned training tasks for this contractor/worker
    const tasks = db.getAssignedTasksByVendorId(targetVendorId);
    tasks.forEach(t => {
      if (t.status !== 'completed') {
        const matchTitle = (courseTitle || '').toLowerCase();
        if (t.itemId === courseId || (t.title && t.title.toLowerCase().includes(matchTitle))) {
          db.updateTaskStatus(t.id, 'completed');
        }
      }
    });

    res.json({ message: 'Safety course completion recorded successfully!', completion: newComp });
  } catch (err) {
    console.error('Error recording course:', err);
    res.status(500).json({ error: 'Failed to record safety course' });
  }
});

// Admin endpoint: Assign safety training course
router.post('/assign', requireAdmin, (req, res) => {
  try {
    const { vendorId, employeeId, courseId, dueDate, notes } = req.body;

    if (!vendorId || !courseId) {
      return res.status(400).json({ error: 'Vendor company and course selection are required.' });
    }

    const courses = db.getAllCourses();
    const courseObj = courses.find(c => c.id === courseId);
    if (!courseObj) {
      return res.status(404).json({ error: 'Selected course not found' });
    }

    let empName = null;
    if (employeeId) {
      const allEmps = db.getAllEmployees();
      const emp = allEmps.find(e => e.id === employeeId);
      if (emp) empName = emp.employeeName;
    }

    const newTask = db.addAssignedTask({
      taskType: 'training_course',
      vendorId,
      employeeId: employeeId || null,
      employeeName: empName || 'Company Workers',
      itemId: courseObj.id,
      title: `Assigned Training: ${courseObj.courseCode} - ${courseObj.title}`,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: notes || 'Assigned by MAXX HSE Admin',
      status: 'pending'
    });

    res.json({ message: 'Safety course assigned successfully!', task: newTask });
  } catch (err) {
    console.error('Error assigning course:', err);
    res.status(500).json({ error: 'Failed to assign course' });
  }
});

// Fetch assigned tasks for logged in vendor
router.get('/assigned-tasks', requireAuth, (req, res) => {
  try {
    let tasks = [];
    if (req.session.role === 'admin') {
      const vendorId = req.query.vendorId;
      if (vendorId && vendorId !== 'all') {
        tasks = db.getAssignedTasksByVendorId(vendorId);
      } else {
        tasks = db.getAllAssignedTasks();
      }
    } else {
      if (req.session.vendorId) {
        tasks = db.getAssignedTasksByVendorId(req.session.vendorId);
      }
    }

    if (req.session.role === 'employee' && req.session.employeeId) {
      const currentEmp = db.getAllEmployees().find(e => e.id === req.session.employeeId);
      const empName = currentEmp ? currentEmp.employeeName : '';
      tasks = tasks.filter(t => t.employeeId === req.session.employeeId || (empName && t.employeeName === empName));
    }

    const vendorsMap = new Map(db.getAllVendors().map(v => [v.id, v.companyName]));
    tasks = tasks.map(t => ({
      ...t,
      companyName: vendorsMap.get(t.vendorId) || 'Contractor'
    }));

    res.json({ tasks });
  } catch (err) {
    console.error('Error fetching assigned tasks:', err);
    res.status(500).json({ error: 'Failed to fetch assigned tasks' });
  }
});

// Admin endpoint: Confirm completion of assigned task
router.post('/tasks/confirm/:id', requireAdmin, (req, res) => {
  try {
    db.updateTaskStatus(req.params.id, 'confirmed');
    res.json({ message: 'Task completion confirmed successfully!' });
  } catch (err) {
    console.error('Error confirming task completion:', err);
    res.status(500).json({ error: 'Failed to confirm task completion' });
  }
});

// GET all Job Role Presets
router.get('/role-presets', requireAuth, (req, res) => {
  try {
    const presets = db.getJobRolePresets();
    res.json({ presets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job role presets' });
  }
});

// Admin endpoint: Create or update Job Role Preset
router.post('/role-presets', requireAdmin, (req, res) => {
  try {
    const { id, roleTitle, description, requiredCourseIds, requiredCertTitles } = req.body;
    if (!roleTitle) {
      return res.status(400).json({ error: 'Job Role Title is required' });
    }

    const updated = db.saveJobRolePreset({
      id: id || null,
      roleTitle,
      description: description || '',
      requiredCourseIds: Array.isArray(requiredCourseIds) ? requiredCourseIds : [],
      requiredCertTitles: Array.isArray(requiredCertTitles) ? requiredCertTitles : []
    });

    res.json({ message: 'Job Role requirement preset saved successfully!', preset: updated });
  } catch (err) {
    console.error('Error saving role preset:', err);
    res.status(500).json({ error: 'Failed to save job role preset' });
  }
});

// Admin endpoint: Delete Job Role Preset
router.delete('/role-presets/:id', requireAdmin, (req, res) => {
  try {
    db.deleteJobRolePreset(req.params.id);
    res.json({ message: 'Job Role requirement preset deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job role preset' });
  }
});

module.exports = router;
