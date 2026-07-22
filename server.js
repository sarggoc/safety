const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const prequalRoutes = require('./routes/prequal');
const certificateRoutes = require('./routes/certificates');
const courseRoutes = require('./routes/courses');
const employeeRoutes = require('./routes/employees');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use(
  session({
    secret: 'maxx-vms-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  })
);

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/prequal', prequalRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/ai', aiRoutes);

// General Admin metric overview endpoint
app.get('/api/admin/overview', (req, res) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const db = require('./database');
  const vendors = db.getAllVendors();
  const prequals = db.getAllPrequals();
  const certs = db.getAllCertificates();

  const totalVendors = vendors.length;
  const approvedCount = prequals.filter(p => p.status === 'approved').length;
  const pendingCount = prequals.filter(p => p.status === 'pending_review').length;
  const draftCount = prequals.filter(p => p.status === 'draft').length;
  const expiringCertsCount = certs.filter(c => c.computedStatus === 'expiring_soon' || c.computedStatus === 'expired').length;

  res.json({
    metrics: {
      totalVendors,
      approvedCount,
      pendingCount,
      draftCount,
      expiringCertsCount
    },
    vendors,
    prequals,
    certificates: certs
  });
});

// Fallback index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` MAXX Industries VMS Server is running!`);
  console.log(` Access URL: http://localhost:${PORT}`);
  console.log(` Default Admin: admin / adminpassword123`);
  console.log(`====================================================`);
});
