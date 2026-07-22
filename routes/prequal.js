const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

// Configure Multer for File Uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size
});

// Middleware: Require Auth
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware: Require Admin
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permissions required' });
  }
  next();
}

// GET all registered contractor companies (accessible to all authenticated users)
router.get('/all-vendors', requireAuth, (req, res) => {
  try {
    const vendors = db.getAllVendors();
    const prequals = db.read().prequalifications || [];
    const prequalMap = new Map(prequals.map(p => [p.vendorId, p.status]));

    const enriched = vendors.map(v => ({
      ...v,
      prequalStatus: prequalMap.get(v.id) || 'draft'
    }));

    res.json({ vendors: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor list' });
  }
});

// Helper: Calculate TRIR, LTI, DART
function calculateStats(hours, lostTimeCases, totalRecordableCases, dartCases = 0) {
  const h = parseFloat(hours) || 0;
  const lt = parseFloat(lostTimeCases) || 0;
  const tr = parseFloat(totalRecordableCases) || 0;
  const dt = parseFloat(dartCases) || 0;

  if (h <= 0) {
    return { trir: 0, ltir: 0, dart: 0 };
  }

  const trir = Number(((tr * 200000) / h).toFixed(2));
  const ltir = Number(((lt * 200000) / h).toFixed(2));
  const dart = Number(((dt * 200000) / h).toFixed(2));

  return { trir, ltir, dart };
}

// Get Pre-Qualification Form for logged-in vendor or specific vendor (if Admin)
router.get('/:vendorId?', requireAuth, (req, res) => {
  try {
    let targetVendorId = req.params.vendorId;

    if (req.session.role !== 'admin') {
      targetVendorId = req.session.vendorId;
    } else if (!targetVendorId) {
      targetVendorId = req.session.vendorId;
      if (!targetVendorId) {
        const allVendors = db.getAllVendors();
        if (allVendors.length > 0) {
          targetVendorId = allVendors[0].id;
        }
      }
    }

    if (!targetVendorId) {
      return res.json({ prequal: null, vendor: null });
    }

    let prequal = db.getPrequalByVendorId(targetVendorId);
    let vendor = db.getVendorById(targetVendorId);

    if (!prequal && vendor) {
      // Create if missing
      prequal = db.savePrequal({
        id: 'pq-' + Date.now(),
        vendorId: targetVendorId,
        status: 'draft',
        partA: {
          contractorName: vendor.companyName || '',
          primaryContact: vendor.primaryContact || '',
          isnetworldId: vendor.isnetworldId || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          zip: vendor.zip || '',
          phone: vendor.phone || '',
          fax: vendor.fax || '',
          email: vendor.email || ''
        },
        partB: {},
        partC: {
          records: [
            { year: 2024, hoursWorked: 0, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0, citationSummary: '' },
            { year: 2023, hoursWorked: 0, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0, citationSummary: '' },
            { year: 2022, hoursWorked: 0, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0, citationSummary: '' }
          ],
          osha300aFiles: []
        },
        partD: { d1: {}, d2: {}, d3: {} },
        partE: {},
        partF: {}
      });
    }

    res.json({ prequal, vendor });
  } catch (err) {
    console.error('Error fetching prequal:', err);
    res.status(500).json({ error: 'Failed to fetch prequalification data' });
  }
});

// Update Pre-Qualification Data (Vendor or Admin)
router.post('/save', requireAuth, (req, res) => {
  try {
    const { vendorId, partA, partB, partC, partD, partE, submitForReview } = req.body;
    const targetVendorId = req.session.role === 'admin' ? (vendorId || req.session.vendorId) : req.session.vendorId;

    if (!targetVendorId) {
      return res.status(400).json({ error: 'Vendor ID missing' });
    }

    let existing = db.getPrequalByVendorId(targetVendorId) || {};
    let vendorObj = db.getVendorById(targetVendorId) || {};

    // Process Part C computations
    let processedPartC = partC || existing.partC || {};
    if (processedPartC.records && Array.isArray(processedPartC.records)) {
      processedPartC.records = processedPartC.records.map(rec => {
        const stats = calculateStats(
          rec.hoursWorked,
          rec.lostTimeCases,
          rec.totalRecordableCases,
          rec.dartCases || rec.lostTimeCases
        );
        return {
          ...rec,
          hoursWorked: parseFloat(rec.hoursWorked) || 0,
          lostTimeCases: parseInt(rec.lostTimeCases) || 0,
          totalRecordableCases: parseInt(rec.totalRecordableCases) || 0,
          trir: stats.trir,
          ltir: stats.ltir,
          dart: stats.dart,
          emr: parseFloat(rec.emr) || 1.0,
          fatalities: parseInt(rec.fatalities) || 0,
          citations: parseInt(rec.citations) || 0,
          citationSummary: rec.citationSummary || ''
        };
      });
    }

    const newStatus = submitForReview ? 'pending_review' : (existing.status || 'draft');

    const updatedPrequal = {
      ...existing,
      id: existing.id || 'pq-' + Date.now(),
      vendorId: targetVendorId,
      status: newStatus,
      partA: partA || existing.partA || {},
      partB: partB || existing.partB || {},
      partC: processedPartC,
      partD: partD || existing.partD || {},
      partE: partE || existing.partE || {},
      partF: existing.partF || { status: newStatus }
    };

    if (updatedPrequal.partF) {
      updatedPrequal.partF.status = newStatus;
    }

    db.savePrequal(updatedPrequal);

    // Sync Part A details to Vendor Record
    if (partA && vendorObj.id) {
      if (partA.contractorName) vendorObj.companyName = partA.contractorName;
      if (partA.primaryContact) vendorObj.primaryContact = partA.primaryContact;
      if (partA.isnetworldId) vendorObj.isnetworldId = partA.isnetworldId;
      if (partA.gstNumber !== undefined) vendorObj.gstNumber = partA.gstNumber;
      if (partA.country) vendorObj.country = partA.country;
      if (partA.taxWcbNumber) vendorObj.taxWcbNumber = partA.taxWcbNumber;
      if (partA.corNumber) vendorObj.corNumber = partA.corNumber;
      if (partA.address) vendorObj.address = partA.address;
      if (partA.city) vendorObj.city = partA.city;
      if (partA.state) vendorObj.state = partA.state;
      if (partA.zip) vendorObj.zip = partA.zip;
      if (partA.phone) vendorObj.phone = partA.phone;
      if (partA.fax) vendorObj.fax = partA.fax;
      if (partA.email) vendorObj.email = partA.email;
      db.saveVendor(vendorObj);
    }

    // Auto-create/sync certificates from Part B if dates are provided
    if (partB) {
      const certFields = [
        { type: 'Safety Program Manual', file: partB.healthSafetyManual, date: partB.healthSafetyManualExpiry },
        { type: 'Anti-Drug & Alcohol Plan', file: partB.antiDrugPlan, date: partB.antiDrugPlanExpiry },
        { type: 'Commercial Liability Insurance ($5M)', file: partB.liabilityCert, date: partB.liabilityCertExpiry },
        { type: 'Workers Compensation Insurance', file: partB.workersCompCert, date: partB.workersCompCertExpiry },
        { type: 'EMR Statement', file: partB.emrStatement, date: partB.emrStatementExpiry },
        { type: 'Cargo Transport Insurance ($1M)', file: partB.cargoCert, date: partB.cargoCertExpiry }
      ];

      certFields.forEach(c => {
        if (c.file || c.date) {
          const existingCerts = db.getCertificatesByVendorId(targetVendorId);
          const match = existingCerts.find(x => x.type === c.type);
          if (!match && (c.file || c.date)) {
            db.addCertificate({
              vendorId: targetVendorId,
              type: c.type,
              title: c.type,
              documentUrl: c.file ? c.file.url : '',
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: c.date || '',
              notes: 'Uploaded during Pre-Qualification'
            });
          }
        }
      });
    }

    res.json({
      message: submitForReview ? 'Pre-Qualification submitted for MAXX Industries review!' : 'Draft saved successfully.',
      prequal: updatedPrequal
    });
  } catch (err) {
    console.error('Error saving prequal:', err);
    res.status(500).json({ error: 'Failed to save prequalification data' });
  }
});

// File Upload endpoint for Document Submittals
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = '/uploads/' + req.file.filename;
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Admin Part F Sign-Off (Approve, Reject, Request Revision)
router.post(['/admin-signoff', '/signoff'], requireAdmin, (req, res) => {
  try {
    const { prequalId, vendorId, status, operationsManager, operationsDate, hseOfficer, hseDate, comments, partF } = req.body;

    const targetVendorId = vendorId || (partF ? partF.vendorId : null);
    let prequal = prequalId ? db.getPrequalById(prequalId) : (targetVendorId ? db.getPrequalByVendorId(targetVendorId) : null);
    
    if (!prequal && targetVendorId) {
      prequal = db.savePrequal({
        vendorId: targetVendorId,
        status: status || 'approved',
        partA: {}, partB: {}, partC: {}, partD: {}, partE: {}
      });
    }

    if (!prequal) {
      return res.status(404).json({ error: 'Pre-qualification record not found.' });
    }

    const decisionStatus = status || (partF ? partF.status : 'approved');

    prequal.status = decisionStatus;
    prequal.partF = {
      operationsManager: operationsManager || (partF ? partF.operationsManager : '') || '',
      operationsDate: operationsDate || (partF ? partF.operationsDate : '') || new Date().toISOString().split('T')[0],
      hseOfficer: hseOfficer || (partF ? partF.hseOfficer : '') || '',
      hseDate: hseDate || (partF ? partF.hseDate : '') || new Date().toISOString().split('T')[0],
      status: decisionStatus,
      comments: comments || (partF ? partF.comments : '') || '',
      reviewedAt: new Date().toISOString()
    };

    db.savePrequal(prequal);

    // Also update vendor prequalStatus in db.vendors
    if (prequal.vendorId) {
      const vendor = db.getVendorById(prequal.vendorId);
      if (vendor) {
        vendor.prequalStatus = decisionStatus;
        db.saveVendor(vendor);
      }
    }

    res.json({
      message: `Pre-qualification successfully updated to ${decisionStatus.toUpperCase()}`,
      prequal
    });
  } catch (err) {
    console.error('Sign-off error:', err);
    res.status(500).json({ error: 'Failed to process admin sign-off' });
  }
});

// Admin endpoint: Delete Vendor Company
router.delete('/vendor/:id', requireAdmin, (req, res) => {
  try {
    db.deleteVendor(req.params.id);
    res.json({ message: 'Contractor company deleted successfully' });
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ error: 'Failed to delete vendor company' });
  }
});

module.exports = router;
