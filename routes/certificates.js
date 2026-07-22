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

// Get company certificates & summary
router.get('/', requireAuth, (req, res) => {
  try {
    let certs = [];
    let personnelCerts = [];
    if (req.session.role === 'admin') {
      const vendorId = req.query.vendorId;
      if (vendorId) {
        certs = db.getCertificatesByVendorId(vendorId);
        personnelCerts = db.getPersonnelCertificatesByVendorId(vendorId);
      } else {
        certs = db.getAllCertificates();
        personnelCerts = db.getAllPersonnelCertificates();
      }
    } else {
      certs = db.getCertificatesByVendorId(req.session.vendorId);
      personnelCerts = db.getPersonnelCertificatesByVendorId(req.session.vendorId);
    }

    if (req.session.role === 'employee' && req.session.employeeId) {
      certs = []; // Hide company-wide policy certificates from employee view
      const currentEmp = db.getAllEmployees().find(e => e.id === req.session.employeeId);
      const empName = currentEmp ? currentEmp.employeeName : '';
      personnelCerts = personnelCerts.filter(c => c.employeeId === req.session.employeeId || (empName && c.employeeName === empName));
    }

    const vendorsMap = new Map(db.getAllVendors().map(v => [v.id, v.companyName]));
    certs = certs.map(c => ({
      ...c,
      companyName: vendorsMap.get(c.vendorId) || 'Unknown Vendor'
    }));

    personnelCerts = personnelCerts.map(c => ({
      ...c,
      companyName: vendorsMap.get(c.vendorId) || 'Unknown Vendor'
    }));

    const summary = {
      total: certs.length + personnelCerts.length,
      active: certs.filter(c => c.computedStatus === 'active').length + personnelCerts.filter(c => c.computedStatus === 'active').length,
      expiringSoon: certs.filter(c => c.computedStatus === 'expiring_soon').length + personnelCerts.filter(c => c.computedStatus === 'expiring_soon').length,
      expired: certs.filter(c => c.computedStatus === 'expired').length + personnelCerts.filter(c => c.computedStatus === 'expired').length
    };

    let vendor = null;
    if (req.session.vendorId) {
      vendor = db.getVendorById(req.session.vendorId);
    }
    const vendorCountry = (vendor && vendor.country) ? vendor.country : 'Canada';

    let requiredDefinitions = db.getRequiredCertificates();
    if (req.session.role !== 'admin' || req.query.vendorId) {
      const targetCountry = req.query.vendorId ? ((db.getVendorById(req.query.vendorId) || {}).country || 'Canada') : vendorCountry;
      requiredDefinitions = requiredDefinitions.filter(r => {
        if (!r.country || r.country === 'Both') return true;
        if (targetCountry.toLowerCase().includes('canada')) return r.country === 'Canada';
        if (targetCountry.toLowerCase().includes('usa')) return r.country === 'USA';
        return r.country === targetCountry;
      });
    }

    res.json({ certificates: certs, personnelCertificates: personnelCerts, summary, requiredDefinitions });
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Fetch Required Certificate Definitions
router.get('/required', requireAuth, (req, res) => {
  try {
    const scope = req.query.scope;
    let list = db.getRequiredCertificates(scope);

    let vendor = null;
    if (req.session.vendorId) {
      vendor = db.getVendorById(req.session.vendorId);
    }
    const vendorCountry = (vendor && vendor.country) ? vendor.country : 'Canada';
    if (req.session.role !== 'admin') {
      list = list.filter(r => {
        if (!r.country || r.country === 'Both') return true;
        if (vendorCountry.toLowerCase().includes('canada')) return r.country === 'Canada';
        if (vendorCountry.toLowerCase().includes('usa')) return r.country === 'USA';
        return r.country === vendorCountry;
      });
    }

    res.json({ requiredCertificates: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch required certificate definitions' });
  }
});

// Admin endpoint: Create or update required certificate definition
router.post('/required', requireAdmin, (req, res) => {
  try {
    const { id, title, category, scope, isMandatory, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Certificate requirement title is required.' });
    }

    const updated = db.saveRequiredCertificate({
      id: id || null,
      title,
      category: category || 'Insurance',
      scope: scope || 'company',
      isMandatory: Boolean(isMandatory),
      description: description || ''
    });

    res.json({ message: 'Certificate requirement saved successfully!', requiredCertificate: updated });
  } catch (err) {
    console.error('Error saving required certificate definition:', err);
    res.status(500).json({ error: 'Failed to save certificate requirement' });
  }
});

// Admin endpoint: Toggle mandatory/optional status of required certificate definition
router.post('/required/toggle/:id', requireAdmin, (req, res) => {
  try {
    const list = db.getRequiredCertificates();
    const item = list.find(rc => rc.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Requirement definition not found' });
    }

    item.isMandatory = !item.isMandatory;
    db.saveRequiredCertificate(item);

    res.json({
      message: `Requirement '${item.title}' is now ${item.isMandatory ? 'MANDATORY' : 'OPTIONAL'}`,
      requiredCertificate: item
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle requirement status' });
  }
});

// Admin endpoint: PUT update required certificate definition
router.put('/required/:id', requireAdmin, (req, res) => {
  try {
    const list = db.getRequiredCertificates();
    const item = list.find(rc => rc.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Requirement definition not found' });
    }

    if (req.body.isMandatory !== undefined) {
      item.isMandatory = Boolean(req.body.isMandatory);
    }
    if (req.body.title) item.title = req.body.title;
    if (req.body.category) item.category = req.body.category;
    if (req.body.scope) item.scope = req.body.scope;
    if (req.body.description) item.description = req.body.description;

    db.saveRequiredCertificate(item);
    res.json({ message: 'Requirement updated successfully', requiredCertificate: item });
  } catch (err) {
    console.error('Error updating requirement:', err);
    res.status(500).json({ error: 'Failed to update requirement' });
  }
});

// Admin endpoint: Delete required certificate definition
router.delete('/required/:id', requireAdmin, (req, res) => {
  try {
    db.deleteRequiredCertificate(req.params.id);
    res.json({ message: 'Requirement definition deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete requirement definition' });
  }
});

function autoCompleteMatchingTasks(vendorId, certTitle) {
  if (!vendorId || !certTitle) return;
  const tasks = db.getAssignedTasksByVendorId(vendorId);
  const searchKey = certTitle.toLowerCase().trim();

  tasks.forEach(t => {
    if (t.status !== 'completed' && t.status !== 'confirmed') {
      const taskTitle = (t.title || '').toLowerCase();
      const itemId = (t.itemId || '').toLowerCase();

      if (
        itemId === searchKey ||
        taskTitle.includes(searchKey) ||
        searchKey.includes(itemId) ||
        (t.itemId && searchKey.includes(t.itemId.toLowerCase())) ||
        (searchKey.length >= 2 && taskTitle.includes(searchKey))
      ) {
        db.updateTaskStatus(t.id, 'completed');
      }
    }
  });
}

// Add Company Certificate
router.post('/add', requireAuth, (req, res) => {
  try {
    const { title, type, issueDate, expiryDate, documentUrl, notes, vendorId } = req.body;
    const targetVendorId = req.session.role === 'admin' ? (vendorId || req.session.vendorId) : req.session.vendorId;

    if (!title || !expiryDate) {
      return res.status(400).json({ error: 'Certificate title and expiry date are required.' });
    }

    const newCert = db.addCertificate({
      vendorId: targetVendorId,
      type: type || 'General Certificate',
      title,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate,
      documentUrl: documentUrl || '',
      notes: notes || ''
    });

    autoCompleteMatchingTasks(targetVendorId, title);

    res.json({ message: 'Certificate added successfully', certificate: newCert });
  } catch (err) {
    console.error('Error adding certificate:', err);
    res.status(500).json({ error: 'Failed to add certificate' });
  }
});

// Delete Company Certificate
router.delete('/:id', requireAuth, (req, res) => {
  try {
    db.deleteCertificate(req.params.id);
    res.json({ message: 'Certificate removed successfully' });
  } catch (err) {
    console.error('Error deleting certificate:', err);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

// Add Personnel Certificate (For Employee)
router.post('/personnel/add', requireAuth, (req, res) => {
  try {
    const { employeeId, employeeName, requirementTitle, issueDate, expiryDate, documentUrl, vendorId } = req.body;
    const targetVendorId = req.session.role === 'admin' ? (vendorId || req.session.vendorId) : req.session.vendorId;

    if (!employeeName || !requirementTitle || !expiryDate) {
      return res.status(400).json({ error: 'Employee Name, Certificate Title, and Expiry Date are required.' });
    }

    const newPersonnelCert = db.addPersonnelCertificate({
      vendorId: targetVendorId,
      employeeId: employeeId || null,
      employeeName,
      title: requirementTitle,
      type: 'Personnel Certificate',
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate,
      documentUrl: documentUrl || '',
      notes: 'Submitted for MAXX delegated employee requirement'
    });

    autoCompleteMatchingTasks(targetVendorId, requirementTitle);

    res.json({ message: 'Personnel certificate submitted successfully', certificate: newPersonnelCert });
  } catch (err) {
    console.error('Error adding personnel certificate:', err);
    res.status(500).json({ error: 'Failed to submit personnel certificate' });
  }
});

// Delete Personnel Certificate
router.delete('/personnel/:id', requireAuth, (req, res) => {
  try {
    db.deletePersonnelCertificate(req.params.id);
    res.json({ message: 'Personnel certificate removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete personnel certificate' });
  }
});

// Admin endpoint: Request certificate / document from contractor or worker
router.post('/request', requireAdmin, (req, res) => {
  try {
    const { vendorId, employeeId, requirementTitle, dueDate, notes } = req.body;

    if (!vendorId || !requirementTitle) {
      return res.status(400).json({ error: 'Vendor company and requirement title are required.' });
    }

    let empName = null;
    if (employeeId) {
      const allEmps = db.getAllEmployees();
      const emp = allEmps.find(e => e.id === employeeId);
      if (emp) empName = emp.employeeName;
    }

    const newTask = db.addAssignedTask({
      taskType: 'certificate_request',
      vendorId,
      employeeId: employeeId || null,
      employeeName: empName || 'Company Requirement',
      itemId: requirementTitle,
      title: `Certificate Requested: ${requirementTitle}`,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: notes || 'Requested by MAXX Compliance Admin',
      status: 'pending'
    });

    res.json({ message: 'Certificate request sent successfully!', task: newTask });
  } catch (err) {
    console.error('Error requesting certificate:', err);
    res.status(500).json({ error: 'Failed to create certificate request' });
  }
});

// Admin endpoint: Approve or Reject a company or worker certificate
router.post('/review', requireAdmin, (req, res) => {
  try {
    const { certId, isPersonnel, decision, notes } = req.body;
    if (!certId || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Valid cert ID and decision (approved/rejected) are required.' });
    }

    if (isPersonnel) {
      const certs = db.read().personnel_certificates || [];
      const cert = certs.find(c => c.id === certId);
      if (!cert) return res.status(404).json({ error: 'Worker certificate not found' });

      cert.approvalStatus = decision;
      cert.reviewNotes = notes || (decision === 'approved' ? 'Approved by MAXX Admin' : 'Rejected by MAXX Admin');
      cert.reviewedAt = new Date().toISOString();
      db.savePersonnelCertificate(cert);
    } else {
      const certs = db.read().certificates || [];
      const cert = certs.find(c => c.id === certId);
      if (!cert) return res.status(404).json({ error: 'Company certificate not found' });

      cert.approvalStatus = decision;
      cert.reviewNotes = notes || (decision === 'approved' ? 'Approved by MAXX Admin' : 'Rejected by MAXX Admin');
      cert.reviewedAt = new Date().toISOString();
      db.saveCertificate(cert);
    }

    res.json({ message: `Certificate ${decision.toUpperCase()} successfully!` });
  } catch (err) {
    console.error('Error reviewing certificate:', err);
    res.status(500).json({ error: 'Failed to review certificate' });
  }
});

// Update / Resubmit Company Certificate
router.put('/update/:id', requireAuth, (req, res) => {
  try {
    const certs = db.read().certificates || [];
    const cert = certs.find(c => c.id === req.params.id);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    const { issueDate, expiryDate, documentUrl, notes } = req.body;
    if (issueDate) cert.issueDate = issueDate;
    if (expiryDate) cert.expiryDate = expiryDate;
    if (documentUrl) cert.documentUrl = documentUrl;
    if (notes) cert.notes = notes;

    // Reset approval status to pending_approval for admin re-review
    cert.approvalStatus = 'pending_approval';
    cert.resubmittedAt = new Date().toISOString();
    db.saveCertificate(cert);

    autoCompleteMatchingTasks(cert.vendorId, cert.title);

    res.json({ message: 'Certificate resubmitted successfully!', certificate: cert });
  } catch (err) {
    console.error('Error updating certificate:', err);
    res.status(500).json({ error: 'Failed to resubmit certificate' });
  }
});

// Update / Resubmit Personnel Certificate
router.put('/personnel/update/:id', requireAuth, (req, res) => {
  try {
    const certs = db.read().personnel_certificates || [];
    const cert = certs.find(c => c.id === req.params.id);
    if (!cert) return res.status(404).json({ error: 'Worker certificate not found' });

    const { issueDate, expiryDate, documentUrl, notes } = req.body;
    if (issueDate) cert.issueDate = issueDate;
    if (expiryDate) cert.expiryDate = expiryDate;
    if (documentUrl) cert.documentUrl = documentUrl;
    if (notes) cert.notes = notes;

    // Reset approval status to pending_approval for admin re-review
    cert.approvalStatus = 'pending_approval';
    cert.resubmittedAt = new Date().toISOString();
    db.savePersonnelCertificate(cert);

    autoCompleteMatchingTasks(cert.vendorId, cert.title);

    res.json({ message: 'Worker certificate resubmitted successfully!', certificate: cert });
  } catch (err) {
    console.error('Error updating worker certificate:', err);
    res.status(500).json({ error: 'Failed to resubmit worker certificate' });
  }
});

module.exports = router;
