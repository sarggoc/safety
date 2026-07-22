const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.getUserByUsernameOrEmail(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    let vendor = null;
    if (user.vendorId) {
      vendor = db.getVendorById(user.vendorId);
    } else if (user.role === 'vendor') {
      vendor = db.getVendorByUserId(user.id);
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.vendorId = vendor ? vendor.id : (user.vendorId || null);
    req.session.employeeId = user.employeeId || null;

    let employee = null;
    if (user.employeeId) {
      const allEmps = db.getAllEmployees();
      employee = allEmps.find(e => e.id === user.employeeId) || null;
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        vendorId: req.session.vendorId,
        employeeId: req.session.employeeId
      },
      vendor,
      employee
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Register new vendor user
router.post('/register', async (req, res) => {
  try {
    const { username, password, companyName, primaryContact, phone, email, isnetworldId, gstNumber } = req.body;

    if (!username || !password || !companyName || !email) {
      return res.status(400).json({ error: 'Please provide username, password, company name, and email.' });
    }

    const existingUser = db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const vendorId = 'ven-' + Date.now();
    const newUser = await db.createUser({
      username,
      password,
      role: 'vendor',
      vendorId
    });

    const newVendor = {
      id: vendorId,
      userId: newUser.id,
      companyName,
      primaryContact: primaryContact || '',
      isnetworldId: isnetworldId || '',
      gstNumber: gstNumber || '',
      phone: phone || '',
      email,
      address: '',
      city: '',
      state: '',
      zip: '',
      fax: ''
    };

    db.saveVendor(newVendor);

    // Initialize blank pre-qualification form
    const blankPrequal = {
      id: 'pq-' + Date.now(),
      vendorId: newVendor.id,
      status: 'draft',
      partA: {
        contractorName: companyName,
        primaryContact: primaryContact || '',
        isnetworldId: isnetworldId || '',
        gstNumber: gstNumber || '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: phone || '',
        fax: '',
        email
      },
      partB: {
        healthSafetyManual: null,
        antiDrugPlan: null,
        liabilityCert: null,
        workersCompCert: null,
        workersCompExplanation: null,
        emrStatement: null,
        emrExplanation: null,
        cargoTransport: 'No',
        cargoCert: null
      },
      partC: {
        records: [
          { year: 2024, hoursWorked: 0, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0, citationSummary: '' },
          { year: 2023, hoursWorked: 0, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0, citationSummary: '' },
          { year: 2022, hoursWorked: 0, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0, citationSummary: '' }
        ],
        osha300aFiles: []
      },
      partD: {
        d1: {},
        d2: {},
        d3: {}
      },
      partE: {
        companyName,
        phone: phone || '',
        fax: '',
        email,
        representativeName: '',
        signature: '',
        date: ''
      },
      partF: {
        operationsManager: '',
        operationsDate: '',
        hseOfficer: '',
        hseDate: '',
        status: 'draft',
        comments: ''
      }
    };
    db.savePrequal(blankPrequal);

    req.session.userId = newUser.id;
    req.session.role = newUser.role;
    req.session.vendorId = vendorId;

    res.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        vendorId
      },
      vendor: newVendor
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// Current user session check
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.getUserById(req.session.userId);
  if (!user) {
    req.session.destroy();
    return res.status(401).json({ error: 'User not found' });
  }
  const vendor = req.session.vendorId ? db.getVendorById(req.session.vendorId) : null;
  let employee = null;
  if (user.employeeId) {
    const allEmps = db.getAllEmployees();
    employee = allEmps.find(e => e.id === user.employeeId) || null;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      vendorId: req.session.vendorId,
      employeeId: user.employeeId || null
    },
    vendor,
    employee
  });
});

// Update Company Organization & Jurisdiction Settings
router.post('/update-vendor', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { vendorId, companyName, country, primaryContact, isnetworldId, gstNumber, taxWcbNumber, corNumber, phone, email } = req.body;
    const targetVendorId = req.session.role === 'admin' ? (vendorId || req.session.vendorId) : req.session.vendorId;

    if (!targetVendorId) {
      return res.status(400).json({ error: 'Vendor ID missing' });
    }

    let vendor = db.getVendorById(targetVendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor company not found' });
    }

    if (companyName) vendor.companyName = companyName;
    if (country) vendor.country = country;
    if (primaryContact) vendor.primaryContact = primaryContact;
    if (isnetworldId) vendor.isnetworldId = isnetworldId;
    if (gstNumber !== undefined) vendor.gstNumber = gstNumber;
    if (taxWcbNumber !== undefined) vendor.taxWcbNumber = taxWcbNumber;
    if (corNumber !== undefined) vendor.corNumber = corNumber;
    if (phone) vendor.phone = phone;
    if (email) vendor.email = email;

    db.saveVendor(vendor);

    // Also update prequal partA if exists
    let prequal = db.getPrequalByVendorId(targetVendorId);
    if (prequal) {
      prequal.partA = {
        ...prequal.partA,
        contractorName: vendor.companyName,
        country: vendor.country || 'Canada',
        primaryContact: vendor.primaryContact,
        isnetworldId: vendor.isnetworldId,
        gstNumber: vendor.gstNumber,
        taxWcbNumber: vendor.taxWcbNumber,
        corNumber: vendor.corNumber,
        phone: vendor.phone,
        email: vendor.email
      };
      db.savePrequal(prequal);
    }

    res.json({ message: 'Company organization updated successfully', vendor });
  } catch (err) {
    console.error('Error updating vendor:', err);
    res.status(500).json({ error: 'Failed to update company organization settings' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
