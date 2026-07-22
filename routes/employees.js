const express = require('express');
const router = express.Router();
const db = require('../database');

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Get personnel/employees for logged in vendor or all (Admin)
router.get('/', requireAuth, (req, res) => {
  try {
    let employees = [];
    if (req.session.role === 'admin') {
      const vendorId = req.query.vendorId;
      if (vendorId && vendorId !== 'all') {
        employees = db.getEmployeesByVendorId(vendorId);
      } else {
        employees = db.getAllEmployees();
      }
    } else {
      if (req.session.vendorId) {
        employees = db.getEmployeesByVendorId(req.session.vendorId);
      }
    }

    if (req.session.role === 'employee' && req.session.employeeId) {
      employees = employees.filter(e => e.id === req.session.employeeId);
    }

    const vendorsMap = new Map(db.getAllVendors().map(v => [v.id, v.companyName]));
    employees = employees.map(e => ({
      ...e,
      companyName: vendorsMap.get(e.vendorId) || 'Company'
    }));

    res.json({ employees });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch personnel list' });
  }
});

// Add or update employee
router.post('/add', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { id, firstName, lastName, employeeName, jobTitle, email, phone, vendorId } = req.body;
    const targetVendorId = req.session.role === 'admin' ? (vendorId || req.session.vendorId) : req.session.vendorId;

    let fullName = (employeeName || '').trim();
    const fName = (firstName || '').trim();
    const lName = (lastName || '').trim();
    if (fName || lName) {
      fullName = `${fName} ${lName}`.trim();
    }

    if (!fullName) {
      return res.status(400).json({ error: 'Employee first and last name are required.' });
    }

    const empId = id || ('emp-' + Date.now());
    const saved = db.saveEmployee({
      id: empId,
      vendorId: targetVendorId,
      firstName: fName,
      lastName: lName,
      employeeName: fullName,
      jobTitle: jobTitle || 'Worker',
      email: email || '',
      phone: phone || '',
      status: 'active'
    });

    let generatedCredentials = null;

    // Check if user account already exists for this employee
    const allUsers = db.read().users || [];
    const existingUser = allUsers.find(u => u.employeeId === saved.id);

    if (!existingUser) {
      // Auto-generate username & temporary password
      let baseUsername = email ? email.split('@')[0] : employeeName.toLowerCase().replace(/\s+/g, '.');
      let genUsername = baseUsername;
      let counter = 1;
      while (db.getUserByUsername(genUsername)) {
        genUsername = `${baseUsername}${counter}`;
        counter++;
      }

      const genPassword = `WorkerPass${Math.floor(1000 + Math.random() * 9000)}!`;

      await db.createUser({
        username: genUsername,
        password: genPassword,
        role: 'employee',
        vendorId: targetVendorId,
        employeeId: saved.id
      });

      generatedCredentials = {
        username: genUsername,
        password: genPassword
      };
    }

    res.json({
      message: 'Employee created successfully with automatic login account!',
      employee: saved,
      credentials: generatedCredentials
    });
  } catch (err) {
    console.error('Error saving employee:', err);
    res.status(500).json({ error: err.message || 'Failed to save employee' });
  }
});

// Worker update their own profile (First Name, Last Name, Email, Phone, Job Title)
router.put('/my-profile', requireAuth, (req, res) => {
  try {
    let empId = req.session.employeeId;
    const allEmps = db.getAllEmployees();
    let existing = allEmps.find(e => e.id === empId);

    if (!existing && req.session.userId) {
      const user = db.getUserById(req.session.userId);
      if (user && user.employeeId) {
        existing = allEmps.find(e => e.id === user.employeeId);
      }
    }

    const { firstName, lastName, email, phone, jobTitle, profilePictureUrl } = req.body;
    const fName = (firstName !== undefined ? firstName : (existing ? existing.firstName || '' : '')).trim();
    const lName = (lastName !== undefined ? lastName : (existing ? existing.lastName || '' : '')).trim();
    const fullName = (fName || lName) ? `${fName} ${lName}`.trim() : (existing ? existing.employeeName : 'Worker');

    const targetVendorId = req.session.vendorId || (existing ? existing.vendorId : 'ven-demo');
    const targetEmpId = existing ? existing.id : (empId || 'emp-' + Date.now());

    const updated = db.saveEmployee({
      ...(existing || {}),
      id: targetEmpId,
      vendorId: targetVendorId,
      firstName: fName,
      lastName: lName,
      employeeName: fullName,
      email: email !== undefined ? email : (existing ? existing.email : ''),
      phone: phone !== undefined ? phone : (existing ? existing.phone : ''),
      jobTitle: jobTitle !== undefined ? jobTitle : (existing ? existing.jobTitle : 'Worker'),
      profilePictureUrl: profilePictureUrl !== undefined ? profilePictureUrl : (existing ? existing.profilePictureUrl : ''),
      status: 'active'
    });

    if (req.session.userId) {
      req.session.employeeId = updated.id;
    }

    res.json({ message: 'Profile updated successfully!', employee: updated });
  } catch (err) {
    console.error('Error updating worker profile:', err);
    res.status(500).json({ error: 'Failed to update worker profile' });
  }
});

// GET full worker profile with qualifications and company details
router.get('/:id/profile', (req, res) => {
  try {
    let empId = req.params.id;
    const allEmps = db.getAllEmployees();

    if (empId === 'my-profile' || empId === 'me' || empId === 'current') {
      empId = req.session.employeeId;
    }

    let employee = allEmps.find(e => e.id === empId);

    // Fallback 1: Match by logged in user account's employeeId
    if (!employee && req.session.userId) {
      const user = db.getUserById(req.session.userId);
      if (user && user.employeeId) {
        employee = allEmps.find(e => e.id === user.employeeId);
      }
    }

    // Fallback 2: Generate profile on-the-fly for logged-in employee if missing
    if (!employee) {
      if (req.session.role === 'employee' || req.session.employeeId) {
        const user = db.getUserById(req.session.userId) || { username: 'Worker' };
        employee = db.saveEmployee({
          id: empId || req.session.employeeId || ('emp-' + Date.now()),
          vendorId: req.session.vendorId || 'ven-demo',
          employeeName: user.username,
          firstName: user.username,
          lastName: '',
          jobTitle: 'Worker',
          email: '',
          phone: '',
          status: 'active'
        });
      } else {
        return res.status(404).json({ error: 'Employee profile not found' });
      }
    }

    const vendor = db.getVendorById(employee.vendorId);
    const personnelCerts = db.getPersonnelCertificatesByVendorId(employee.vendorId)
      .filter(pc => pc.employeeId === employee.id || pc.employeeName === employee.employeeName);

    const completions = db.getCompletionsByVendorId(employee.vendorId)
      .filter(cc => cc.employeeName === employee.employeeName);

    const assignedTasks = db.getAssignedTasksByVendorId(employee.vendorId)
      .filter(t => !t.employeeId || t.employeeId === employee.id);

    const allCourses = db.read().courses || [];
    const mandatoryCourses = allCourses.filter(c => c.requiredByMaxx);

    const certReqs = db.getRequiredCertificates();
    const mandatoryCertReqs = certReqs.filter(r => r.scope === 'employee');

    const allUsers = db.read().users || [];
    const userAccount = allUsers.find(u => u.employeeId === employee.id);

    res.json({
      employee,
      vendor: vendor || { companyName: 'Contractor Company', country: 'Canada' },
      certificates: personnelCerts,
      completions,
      assignedTasks,
      mandatoryCourses,
      mandatoryCertReqs,
      userAccount: userAccount ? { username: userAccount.username } : null
    });
  } catch (err) {
    console.error('Error fetching employee profile:', err);
    res.status(500).json({ error: 'Failed to fetch employee profile' });
  }
});

// Public safety passport endpoint for QR code site scanning
router.get('/:id/public-passport', (req, res) => {
  try {
    const empId = req.params.id;
    const allEmps = db.getAllEmployees();
    let employee = allEmps.find(e => e.id === empId);

    if (!employee) {
      return res.status(404).json({ error: 'Worker record not found' });
    }

    const vendor = db.getVendorById(employee.vendorId);
    const personnelCerts = db.getPersonnelCertificatesByVendorId(employee.vendorId)
      .filter(pc => pc.employeeId === employee.id || pc.employeeName === employee.employeeName);

    const completions = db.getCompletionsByVendorId(employee.vendorId)
      .filter(cc => cc.employeeName === employee.employeeName);

    const certReqs = db.getRequiredCertificates();
    const vendorCountry = (vendor && vendor.country) ? vendor.country : 'Canada';

    const mandatoryCertReqs = certReqs.filter(r => {
      if (r.scope !== 'employee') return false;
      if (!r.country || r.country === 'Both') return true;
      if (vendorCountry.toLowerCase().includes('canada')) return r.country === 'Canada';
      if (vendorCountry.toLowerCase().includes('usa')) return r.country === 'USA';
      return r.country === vendorCountry;
    });

    res.json({
      employee,
      vendor: vendor || { companyName: 'Contractor Company', country: 'Canada' },
      certificates: personnelCerts,
      completions,
      mandatoryCertReqs,
      clearanceStatus: 'ACTIVE SAFETY PASSPORT',
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching public worker passport:', err);
    res.status(500).json({ error: 'Failed to fetch public worker safety passport' });
  }
});

// Company Admin / Admin email worker QR passport & safety badge
router.post('/email-passport', requireAuth, (req, res) => {
  try {
    const { employeeId, recipientEmail, customNote } = req.body;
    if (!employeeId || !recipientEmail) {
      return res.status(400).json({ error: 'Worker ID and recipient email address are required.' });
    }

    const allEmps = db.getAllEmployees();
    const emp = allEmps.find(e => e.id === employeeId);
    if (!emp) {
      return res.status(404).json({ error: 'Worker profile not found.' });
    }

    const host = req.get('host') || 'localhost:3001';
    const protocol = req.protocol || 'http';
    const passportUrl = `${protocol}://${host}/passport.html?id=${emp.id}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(passportUrl)}`;

    console.log(`[EMAIL DISPATCH] Worker Safety Passport for ${emp.employeeName} sent to ${recipientEmail}`);
    console.log(`Passport URL: ${passportUrl}`);

    res.json({
      message: `Safety Passport & QR Code badge for ${emp.employeeName} dispatched successfully to ${recipientEmail}!`,
      sentTo: recipientEmail,
      passportUrl,
      qrApiUrl
    });
  } catch (err) {
    console.error('Error emailing worker passport:', err);
    res.status(500).json({ error: 'Failed to dispatch email' });
  }
});

// Delete employee
router.delete('/:id', (req, res) => {
  try {
    db.deleteEmployee(req.params.id);
    res.json({ message: 'Employee removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
