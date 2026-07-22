const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'vms_db.json');

const defaultData = {
  users: [],
  vendors: [],
  prequalifications: [],
  certificates: [],
  required_certificates: [
    // Company Level Requirements (Canada & USA)
    { id: 'req-1', scope: 'company', country: 'Both', title: 'Commercial General Liability ($5M)', category: 'Insurance', isMandatory: true, validityYears: 1, description: 'No less than $5,000,000 CGL limit naming MAXX Industries Ltd as additional insured.' },
    { id: 'req-2', scope: 'company', country: 'Both', title: 'Automobile Liability ($2M)', category: 'Insurance', isMandatory: true, validityYears: 1, description: 'No less than $2,000,000 Automobile Liability.' },
    { id: 'req-3', scope: 'company', country: 'Canada', title: 'WCB / WSIB Clearance Letter & Rate Statement', category: 'Workers Comp (Canada)', isMandatory: true, validityYears: 1, description: 'Provincial WCB / WSIB Clearance Certificate with Waiver of Subrogation.' },
    { id: 'req-3b', scope: 'company', country: 'USA', title: 'Workers Compensation Certificate & Waiver', category: 'Workers Comp (USA)', isMandatory: true, validityYears: 1, description: 'US Statutory coverage with Waiver of Subrogation in favor of MAXX Industries Ltd.' },
    { id: 'req-4', scope: 'company', country: 'Both', title: 'Health & Safety Program Manual', category: 'Safety Policy', isMandatory: true, validityYears: 3, description: 'Complete written company H&S manual.' },
    { id: 'req-4b', scope: 'company', country: 'Canada', title: 'COR / SECOR Certificate of Recognition', category: 'Safety Audit (Canada)', isMandatory: true, validityYears: 3, description: 'Valid Certificate of Recognition (COR/SECOR) issued by Energy Safety Canada or provincial safety association.' },
    { id: 'req-5', scope: 'company', country: 'Both', title: 'Anti-Drug & Alcohol Plan', category: 'DOT / PHMSA / Canadian Standard', isMandatory: true, validityYears: 1, description: 'Compliance with 49 CFR Part 199 / Part 40 or Canadian Model for Providing a Safe Workplace.' },
    { id: 'req-6', scope: 'company', country: 'Both', title: 'Experience Modification Rate (EMR) / WCB Premium Statement', category: 'Safety Stats', isMandatory: true, validityYears: 1, description: '3-year insurance provider statement of EMR or WCB premium experience rate.' },
    { id: 'req-7', scope: 'company', country: 'Both', title: 'Cargo Transport Insurance ($1M)', category: 'Transport', isMandatory: false, validityYears: 1, description: 'Required for vendors providing Cargo Transport Services (NSC / DOT).' },
    
    // Personnel / Employee Level Requirements delegated by MAXX
    { id: 'req-emp-1', scope: 'employee', country: 'Canada', title: 'H2S Alive Certification (Energy Safety Canada)', category: 'High Hazard (Canada)', isMandatory: true, validityYears: 3, description: 'Valid H2S Alive certificate for oilfield / industrial sites.' },
    { id: 'req-emp-1b', scope: 'employee', country: 'Canada', title: 'CSTS-2020 / OSSA Construction Safety Training', category: 'Safety Card (Canada)', isMandatory: true, validityYears: 3, description: 'Construction Safety Training System certificate.' },
    { id: 'req-emp-2', scope: 'employee', country: 'USA', title: 'OSHA 10/30-Hour Safety Card', category: 'Personnel Safety (USA)', isMandatory: true, validityYears: 5, description: 'Valid OSHA General Industry / Construction card.' },
    { id: 'req-emp-3', scope: 'employee', country: 'Both', title: 'First Aid / CPR Certification', category: 'Personnel Safety', isMandatory: true, validityYears: 3, description: 'Approved Standard First Aid and CPR Provider Certificate.' },
    { id: 'req-emp-4', scope: 'employee', country: 'Both', title: 'Defensive Driving / NSC / DOT Card', category: 'Transport', isMandatory: false, validityYears: 3, description: 'Driver safety and National Safety Code / DOT operator qualification card.' }
  ],
  safety_courses: [
    {
      id: 'sc-101',
      courseCode: 'MAXX-HSE-01',
      title: 'MAXX General Safety & Site Orientation',
      category: 'General Safety',
      durationHours: 2,
      description: 'Mandatory site orientation covering hazard identification, emergency response, and site rules.',
      requiredByMaxx: true
    },
    {
      id: 'sc-102',
      courseCode: 'MAXX-HSE-02',
      title: 'Hazard Communication (HAZCOM) & WHMIS',
      category: 'Occupational Health',
      durationHours: 1.5,
      description: 'Understanding SDS sheets, chemical handling, and container labeling standard operating procedures.',
      requiredByMaxx: true
    },
    {
      id: 'sc-103',
      courseCode: 'MAXX-HSE-03',
      title: 'Lock-out / Tag-out (Hazardous Energy Control)',
      category: 'High Hazard Safety',
      durationHours: 3,
      description: 'Procedures for zero energy state verification and isolation of electrical, hydraulic, and pneumatic equipment.',
      requiredByMaxx: true
    },
    {
      id: 'sc-104',
      courseCode: 'MAXX-HSE-04',
      title: 'DOT Operator Qualification & Defensive Driving',
      category: 'Transport & Fleet Safety',
      durationHours: 4,
      description: 'Compliance training for 49 CFR regulations, safe vehicle operation, and cargo transport standards.',
      requiredByMaxx: false
    },
    {
      id: 'sc-105',
      courseCode: 'MAXX-HSE-05',
      title: 'Fall Protection & Elevated Work Safety',
      category: 'High Hazard Safety',
      durationHours: 4,
      description: 'Proper use of full body harnesses, lanyards, anchor points, and fall arrest systems.',
      requiredByMaxx: false
    }
  ],
  vendor_employees: [
    { id: 'emp-101', vendorId: 'ven-demo', employeeName: 'John Doe', jobTitle: 'Site Supervisor', email: 'johndoe@acme.com', phone: '(555) 111-2222', status: 'active' },
    { id: 'emp-102', vendorId: 'ven-demo', employeeName: 'Jane Smith', jobTitle: 'Safety Technician', email: 'janesmith@acme.com', phone: '(555) 333-4444', status: 'active' }
  ],
  personnel_certificates: [],
  course_completions: [],
  assigned_tasks: [],
  job_role_presets: [
    {
      id: 'preset-tracking-tech',
      roleTitle: 'Tracking Technician',
      description: 'Field technical personnel managing tracking systems and hazardous monitoring.',
      requiredCourseIds: ['sc-101', 'sc-102', 'sc-105'],
      requiredCertTitles: ['H2S Alive Certification (Energy Safety Canada)', 'First Aid / CPR Certification', 'Defensive Driving / NSC / DOT Card']
    },
    {
      id: 'preset-site-supervisor',
      roleTitle: 'Site Supervisor',
      description: 'On-site supervisory personnel managing safety compliance and site safety rules.',
      requiredCourseIds: ['sc-101', 'sc-102', 'sc-103'],
      requiredCertTitles: ['First Aid / CPR Certification', 'CSTS-2020 / OSSA Construction Safety Training']
    },
    {
      id: 'preset-safety-tech',
      roleTitle: 'Safety Technician',
      description: 'HSE safety specialists responsible for gas monitoring, fit testing, and safety audits.',
      requiredCourseIds: ['sc-101', 'sc-102', 'sc-103', 'sc-105'],
      requiredCertTitles: ['H2S Alive Certification (Energy Safety Canada)', 'First Aid / CPR Certification', 'OSHA 10/30-Hour Safety Card']
    }
  ]
};

class DatabaseService {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.save(defaultData);
      this.seedAdmin();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        let modified = false;
        if (!parsed.required_certificates) {
          parsed.required_certificates = defaultData.required_certificates;
          modified = true;
        }
        if (!parsed.vendor_employees) {
          parsed.vendor_employees = defaultData.vendor_employees;
          modified = true;
        }
        if (!parsed.personnel_certificates) {
          parsed.personnel_certificates = defaultData.personnel_certificates;
          modified = true;
        }
        if (modified) this.save(parsed);
        this.seedAdmin();
      } catch (err) {
        console.error('Error reading db, resetting to default:', err);
        this.save(defaultData);
        this.seedAdmin();
      }
    }
  }

  read() {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.required_certificates) parsed.required_certificates = defaultData.required_certificates;
      if (!parsed.vendor_employees) parsed.vendor_employees = defaultData.vendor_employees;
      if (!parsed.personnel_certificates) parsed.personnel_certificates = defaultData.personnel_certificates;
      return parsed;
    } catch (e) {
      return defaultData;
    }
  }

  save(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  async seedAdmin() {
    const data = this.read();
    let modified = false;

    const adminExists = data.users.find(u => u.username === 'admin');
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('adminpassword123', salt);
      data.users.push({
        id: 'user-admin',
        username: 'admin',
        passwordHash: hash,
        role: 'admin',
        vendorId: null,
        createdAt: new Date().toISOString()
      });
      modified = true;
      console.log('Seeded default admin user: admin / adminpassword123');
    }

    // Seed 4 distinct contractor companies if vendors array is empty or lacks multi-company sample data
    const sampleVendors = [
      {
        id: 'ven-acme',
        userId: 'user-acme',
        companyName: 'Acme Industrial Services Ltd.',
        country: 'Canada',
        primaryContact: 'Robert Vance, HSE Director',
        phone: '(403) 555-0199',
        email: 'safety@acmeindustrial.ca',
        isnetworldId: '400-881920',
        gstNumber: '891029384 RT 0001',
        taxWcbNumber: 'WCB-9810482',
        corNumber: 'COR-2026-88192',
        address: '100 Industrial Parkway, Calgary, AB T2P 2H8',
        yearsInBusiness: 14,
        numberOfEmployees: 45,
        servicesProvided: ['Industrial Maintenance', 'Pipeline Operations', 'Facility Turnarounds']
      },
      {
        id: 'ven-sargtech',
        userId: 'user-sargtech',
        companyName: 'SargTech Energy Solutions',
        country: 'Canada',
        primaryContact: 'Andrew Sargeant, HSE Manager',
        phone: '(780) 555-3810',
        email: 'asargeant8484@gmail.com',
        isnetworldId: '400-333333',
        gstNumber: '123456789 RT 0001',
        taxWcbNumber: 'WCB-7719204',
        corNumber: 'COR-2026-10492',
        address: '500 Energy Way, Edmonton, AB T6B 2T3',
        yearsInBusiness: 8,
        numberOfEmployees: 28,
        servicesProvided: ['Automation & Electrical', 'Instrument Calibration', 'Safety Systems']
      },
      {
        id: 'ven-apex',
        userId: 'user-apex',
        companyName: 'Apex Oilfield Contracting Inc.',
        country: 'USA',
        primaryContact: 'Marcus Sterling, Compliance VP',
        phone: '(713) 555-8820',
        email: 'msterling@apexeast.com',
        isnetworldId: '400-992810',
        gstNumber: 'EIN-74-9810482',
        taxWcbNumber: 'TX-WC-99182',
        corNumber: 'OSHA-TEX-881',
        address: '1200 Energy Corridor Blvd, Houston, TX 77079',
        yearsInBusiness: 18,
        numberOfEmployees: 120,
        servicesProvided: ['Rig Maintenance', 'Downhole Tool Operations', 'DOT Heavy Haul']
      },
      {
        id: 'ven-northern',
        userId: 'user-northern',
        companyName: 'Northern Ridge Safety Services',
        country: 'Canada',
        primaryContact: 'Sarah Jenkins, Operations Lead',
        phone: '(250) 555-1920',
        email: 'sjenkins@northernridge.ca',
        isnetworldId: '400-112948',
        gstNumber: '771920481 RT 0001',
        taxWcbNumber: 'WCB-3391024',
        corNumber: 'COR-2026-44910',
        address: '400 Timberline Road, Fort St. John, BC V1J 4M6',
        yearsInBusiness: 5,
        numberOfEmployees: 15,
        servicesProvided: ['H2S Safety Monitoring', 'Gas Detection Services', 'Onsite First Aid']
      }
    ];

    sampleVendors.forEach(sv => {
      // Skip seeding this vendor if admin explicitly deleted it
      const wasDeleted = (data.deleted_seed_ids || []).includes(sv.id);
      if (!wasDeleted && !data.vendors.some(v => v.id === sv.id)) {
        data.vendors.push(sv);
        modified = true;
      }
    });

    // Seed sample worker rosters per company
    const sampleEmployees = [
      { id: 'emp-acme-1', vendorId: 'ven-acme', employeeName: 'Michael Chang', jobTitle: 'Lead Superintendent', email: 'mchang@acmeindustrial.ca', phone: '(403) 555-1010', status: 'active' },
      { id: 'emp-acme-2', vendorId: 'ven-acme', employeeName: 'David O\'Connor', jobTitle: 'Rig Welder', email: 'doconnor@acmeindustrial.ca', phone: '(403) 555-2020', status: 'active' },
      { id: 'emp-sarg-1', vendorId: 'ven-sargtech', employeeName: 'Andrew Sargeant', jobTitle: 'Senior Systems Engineer', email: 'asargeant8484@gmail.com', phone: '(780) 555-3810', status: 'active' },
      { id: 'emp-sarg-2', vendorId: 'ven-sargtech', employeeName: 'Tyler Miller', jobTitle: 'Field Technician', email: 'tmiller@sargtech.ca', phone: '(780) 555-4040', status: 'active' },
      { id: 'emp-apex-1', vendorId: 'ven-apex', employeeName: 'James Rodriguez', jobTitle: 'Heavy Haul Operator', email: 'jrodriguez@apexeast.com', phone: '(713) 555-5050', status: 'active' },
      { id: 'emp-north-1', vendorId: 'ven-northern', employeeName: 'Samantha Green', jobTitle: 'H2S Safety Advisor', email: 'sgreen@northernridge.ca', phone: '(250) 555-6060', status: 'active' }
    ];

    if (!data.vendor_employees) data.vendor_employees = [];
    sampleEmployees.forEach(se => {
      // Skip seeding this employee if admin explicitly deleted it
      const wasDeleted = (data.deleted_seed_ids || []).includes(se.id);
      if (!wasDeleted && !data.vendor_employees.some(e => e.id === se.id)) {
        data.vendor_employees.push(se);
        modified = true;
      }
    });

    if (modified) {
      this.save(data);
    }
  }

  // Users
  getUserByUsername(username) {
    const data = this.read();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  getUserByUsernameOrEmail(identifier) {
    if (!identifier) return null;
    const data = this.read();
    const query = identifier.toLowerCase().trim();

    // 1. Direct match on username or user email
    let user = data.users.find(u => 
      u.username.toLowerCase() === query || 
      (u.email && u.email.toLowerCase() === query)
    );
    if (user) return user;

    // 2. Match on employee email
    const emp = (data.vendor_employees || []).find(e => e.email && e.email.toLowerCase() === query);
    if (emp) {
      user = data.users.find(u => u.employeeId === emp.id);
      if (user) return user;
    }

    // 3. Match on vendor company email
    const vendor = (data.vendors || []).find(v => v.email && v.email.toLowerCase() === query);
    if (vendor) {
      user = data.users.find(u => u.vendorId === vendor.id);
      if (user) return user;
    }

    return null;
  }

  getUserById(id) {
    const data = this.read();
    return data.users.find(u => u.id === id);
  }

  async createUser({ username, password, role = 'vendor', vendorId = null, employeeId = null }) {
    const data = this.read();
    if (data.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const newUser = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      username,
      passwordHash: hash,
      role,
      vendorId,
      employeeId,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    this.save(data);
    return newUser;
  }

  // Vendors
  getVendorById(id) {
    const data = this.read();
    return data.vendors.find(v => v.id === id);
  }

  getVendorByUserId(userId) {
    const data = this.read();
    return data.vendors.find(v => v.userId === userId);
  }

  getAllVendors() {
    const data = this.read();
    return data.vendors;
  }

  saveVendor(vendorObj) {
    const data = this.read();
    const idx = data.vendors.findIndex(v => v.id === vendorObj.id);
    if (idx >= 0) {
      data.vendors[idx] = { ...data.vendors[idx], ...vendorObj, updatedAt: new Date().toISOString() };
    } else {
      vendorObj.gstNumber = vendorObj.gstNumber || '';
      vendorObj.createdAt = new Date().toISOString();
      data.vendors.push(vendorObj);
    }
    this.save(data);
    return vendorObj;
  }

  deleteVendor(id) {
    const data = this.read();
    // Track deleted seed IDs to prevent re-seeding on restart
    if (!data.deleted_seed_ids) data.deleted_seed_ids = [];
    if (!data.deleted_seed_ids.includes(id)) data.deleted_seed_ids.push(id);
    // Also track deleted seed employees for this vendor
    const deletedEmpIds = (data.vendor_employees || []).filter(e => e.vendorId === id).map(e => e.id);
    deletedEmpIds.forEach(eid => { if (!data.deleted_seed_ids.includes(eid)) data.deleted_seed_ids.push(eid); });
    data.vendors = (data.vendors || []).filter(v => v.id !== id);
    data.prequalifications = (data.prequalifications || []).filter(p => p.vendorId !== id);
    data.certificates = (data.certificates || []).filter(c => c.vendorId !== id);
    data.personnel_certificates = (data.personnel_certificates || []).filter(c => c.vendorId !== id);
    data.vendor_employees = (data.vendor_employees || []).filter(e => e.vendorId !== id);
    // Also delete associated user accounts
    data.users = (data.users || []).filter(u => u.vendorId !== id);
    this.save(data);
  }

  // Vendor Employees
  getEmployeesByVendorId(vendorId) {
    const data = this.read();
    return data.vendor_employees.filter(e => e.vendorId === vendorId);
  }

  getAllEmployees() {
    const data = this.read();
    return data.vendor_employees;
  }

  saveEmployee(empObj) {
    const data = this.read();
    const idx = data.vendor_employees.findIndex(e => e.id === empObj.id);
    if (idx >= 0) {
      data.vendor_employees[idx] = { ...data.vendor_employees[idx], ...empObj };
    } else {
      empObj.id = empObj.id || 'emp-' + Date.now();
      empObj.createdAt = new Date().toISOString();
      data.vendor_employees.push(empObj);
    }
    this.save(data);
    return empObj;
  }

  deleteEmployee(id) {
    const data = this.read();
    // Track deleted seed IDs to prevent re-seeding on restart
    if (!data.deleted_seed_ids) data.deleted_seed_ids = [];
    if (!data.deleted_seed_ids.includes(id)) data.deleted_seed_ids.push(id);
    data.vendor_employees = (data.vendor_employees || []).filter(e => e.id !== id);
    // Also delete the employee's user account if exists
    data.users = (data.users || []).filter(u => u.employeeId !== id);
    // Also delete their personnel certs
    data.personnel_certificates = (data.personnel_certificates || []).filter(c => c.employeeId !== id);
    this.save(data);
  }

  // Pre-qualifications
  getPrequalByVendorId(vendorId) {
    const data = this.read();
    return data.prequalifications.find(p => p.vendorId === vendorId);
  }

  getPrequalById(id) {
    const data = this.read();
    return data.prequalifications.find(p => p.id === id);
  }

  getAllPrequals() {
    const data = this.read();
    return data.prequalifications;
  }

  savePrequal(prequalObj) {
    const data = this.read();
    const idx = data.prequalifications.findIndex(p => p.id === prequalObj.id || p.vendorId === prequalObj.vendorId);
    if (idx >= 0) {
      data.prequalifications[idx] = { ...data.prequalifications[idx], ...prequalObj, updatedAt: new Date().toISOString() };
    } else {
      prequalObj.id = prequalObj.id || 'pq-' + Date.now();
      prequalObj.createdAt = new Date().toISOString();
      data.prequalifications.push(prequalObj);
    }
    this.save(data);
    return prequalObj;
  }

  // Required Certificate Definitions (Company & Employee level)
  getRequiredCertificates(scope = null) {
    const data = this.read();
    const list = data.required_certificates || defaultData.required_certificates;
    if (scope) {
      return list.filter(rc => (rc.scope || 'company') === scope);
    }
    return list;
  }

  saveRequiredCertificate(reqCertObj) {
    const data = this.read();
    if (!data.required_certificates) data.required_certificates = defaultData.required_certificates;
    const idx = data.required_certificates.findIndex(rc => rc.id === reqCertObj.id);
    if (idx >= 0) {
      data.required_certificates[idx] = { ...data.required_certificates[idx], ...reqCertObj };
    } else {
      reqCertObj.id = reqCertObj.id || 'req-' + Date.now();
      reqCertObj.scope = reqCertObj.scope || 'company';
      data.required_certificates.push(reqCertObj);
    }
    this.save(data);
    return reqCertObj;
  }

  deleteRequiredCertificate(id) {
    const data = this.read();
    if (data.required_certificates) {
      data.required_certificates = data.required_certificates.filter(rc => rc.id !== id);
      this.save(data);
    }
  }

  // Company Certificates
  getCertificatesByVendorId(vendorId) {
    const data = this.read();
    const list = data.certificates.filter(c => c.vendorId === vendorId);
    return this.updateCertStatuses(list);
  }

  getAllCertificates() {
    const data = this.read();
    return this.updateCertStatuses(data.certificates);
  }

  // Personnel Certificates
  getPersonnelCertificatesByVendorId(vendorId) {
    const data = this.read();
    const list = data.personnel_certificates.filter(pc => pc.vendorId === vendorId);
    return this.updateCertStatuses(list);
  }

  getAllPersonnelCertificates() {
    const data = this.read();
    return this.updateCertStatuses(data.personnel_certificates);
  }

  addPersonnelCertificate(pcObj) {
    const data = this.read();
    pcObj.id = 'pc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    pcObj.createdAt = new Date().toISOString();
    data.personnel_certificates.push(pcObj);
    this.save(data);
    return pcObj;
  }

  deletePersonnelCertificate(id) {
    const data = this.read();
    data.personnel_certificates = data.personnel_certificates.filter(pc => pc.id !== id);
    this.save(data);
  }

  updateCertStatuses(certs) {
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return certs.map(c => {
      let status = 'active';
      if (c.expiryDate) {
        const exp = new Date(c.expiryDate);
        const diff = exp.getTime() - now.getTime();
        if (diff <= 0) {
          status = 'expired';
        } else if (diff <= thirtyDays) {
          status = 'expiring_soon';
        }
      }
      return { ...c, computedStatus: status };
    });
  }

  addCertificate(certObj) {
    const data = this.read();
    certObj.id = 'cert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    certObj.createdAt = new Date().toISOString();
    data.certificates.push(certObj);
    this.save(data);
    return certObj;
  }

  saveCertificate(certObj) {
    const data = this.read();
    if (!data.certificates) data.certificates = [];
    const idx = data.certificates.findIndex(c => c.id === certObj.id);
    if (idx >= 0) {
      data.certificates[idx] = { ...data.certificates[idx], ...certObj, updatedAt: new Date().toISOString() };
    } else {
      certObj.id = certObj.id || 'cert-' + Date.now();
      certObj.createdAt = new Date().toISOString();
      data.certificates.push(certObj);
    }
    this.save(data);
    return certObj;
  }

  savePersonnelCertificate(pcObj) {
    const data = this.read();
    if (!data.personnel_certificates) data.personnel_certificates = [];
    const idx = data.personnel_certificates.findIndex(pc => pc.id === pcObj.id);
    if (idx >= 0) {
      data.personnel_certificates[idx] = { ...data.personnel_certificates[idx], ...pcObj, updatedAt: new Date().toISOString() };
    } else {
      pcObj.id = pcObj.id || 'pc-' + Date.now();
      pcObj.createdAt = new Date().toISOString();
      data.personnel_certificates.push(pcObj);
    }
    this.save(data);
    return pcObj;
  }

  deleteCertificate(certId) {
    const data = this.read();
    data.certificates = data.certificates.filter(c => c.id !== certId);
    this.save(data);
  }

  // Safety Courses & Completions
  getAllCourses() {
    const data = this.read();
    return data.safety_courses;
  }

  saveCourse(courseObj) {
    const data = this.read();
    const idx = data.safety_courses.findIndex(c => c.id === courseObj.id);
    if (idx >= 0) {
      data.safety_courses[idx] = { ...data.safety_courses[idx], ...courseObj };
    } else {
      courseObj.id = courseObj.id || 'sc-' + Date.now();
      data.safety_courses.push(courseObj);
    }
    this.save(data);
    return courseObj;
  }

  deleteCourse(id) {
    const data = this.read();
    data.safety_courses = data.safety_courses.filter(c => c.id !== id);
    this.save(data);
  }

  getCompletionsByVendorId(vendorId) {
    const data = this.read();
    const completions = data.course_completions.filter(cc => cc.vendorId === vendorId);
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return completions.map(cc => {
      let status = 'valid';
      if (cc.expiryDate) {
        const exp = new Date(cc.expiryDate);
        const diff = exp.getTime() - now.getTime();
        if (diff <= 0) {
          status = 'expired';
        } else if (diff <= thirtyDays) {
          status = 'expiring_soon';
        }
      }
      return { ...cc, computedStatus: status };
    });
  }

  addCourseCompletion(completionObj) {
    const data = this.read();
    completionObj.id = 'comp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    completionObj.createdAt = new Date().toISOString();
    data.course_completions.push(completionObj);
    this.save(data);
    return completionObj;
  }

  // Assigned Tasks & Requests (Training & Certificates)
  getAssignedTasksByVendorId(vendorId) {
    const data = this.read();
    const tasks = data.assigned_tasks || [];
    return tasks.filter(t => t.vendorId === vendorId);
  }

  getAllAssignedTasks() {
    const data = this.read();
    return data.assigned_tasks || [];
  }

  addAssignedTask(taskObj) {
    const data = this.read();
    if (!data.assigned_tasks) data.assigned_tasks = [];
    taskObj.id = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    taskObj.status = taskObj.status || 'pending';
    taskObj.createdAt = new Date().toISOString();
    data.assigned_tasks.push(taskObj);
    this.save(data);
    return taskObj;
  }

  updateTaskStatus(taskId, status) {
    const data = this.read();
    if (data.assigned_tasks) {
      const idx = data.assigned_tasks.findIndex(t => t.id === taskId);
      if (idx >= 0) {
        data.assigned_tasks[idx].status = status;
        data.assigned_tasks[idx].updatedAt = new Date().toISOString();
      }
    }
  }

  // Required Certificate Definitions
  getRequiredCertificates(scope = null) {
    const data = this.read();
    const reqs = data.requiredCertificates || data.required_certificates || [];
    if (scope) return reqs.filter(r => r.scope === scope);
    return reqs;
  }

  saveRequiredCertificate(reqObj) {
    const data = this.read();
    let list = data.requiredCertificates || data.required_certificates || [];
    const idx = list.findIndex(r => r.id === reqObj.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...reqObj, updatedAt: new Date().toISOString() };
    } else {
      reqObj.id = reqObj.id || 'req-' + Date.now();
      reqObj.createdAt = new Date().toISOString();
      list.push(reqObj);
    }
    data.requiredCertificates = list;
    data.required_certificates = list;
    this.save(data);
    return reqObj;
  }

  deleteRequiredCertificate(id) {
    const data = this.read();
    let list = data.requiredCertificates || data.required_certificates || [];
    list = list.filter(r => r.id !== id);
    data.requiredCertificates = list;
    data.required_certificates = list;
    this.save(data);
  }

  // Job Role Presets
  getJobRolePresets() {
    const data = this.read();
    return data.job_role_presets || [
      {
        id: 'preset-tracking-tech',
        roleTitle: 'Tracking Technician',
        description: 'Field technical personnel managing tracking systems and hazardous monitoring.',
        requiredCourseIds: ['sc-101', 'sc-102', 'sc-105'],
        requiredCertTitles: ['H2S Alive Certification (Energy Safety Canada)', 'First Aid / CPR Certification', 'Defensive Driving / NSC / DOT Card']
      },
      {
        id: 'preset-site-supervisor',
        roleTitle: 'Site Supervisor',
        description: 'On-site supervisory personnel managing safety compliance and site safety rules.',
        requiredCourseIds: ['sc-101', 'sc-102', 'sc-103'],
        requiredCertTitles: ['First Aid / CPR Certification', 'CSTS-2020 / OSSA Construction Safety Training']
      },
      {
        id: 'preset-safety-tech',
        roleTitle: 'Safety Technician',
        description: 'HSE safety specialists responsible for gas monitoring, fit testing, and safety audits.',
        requiredCourseIds: ['sc-101', 'sc-102', 'sc-103', 'sc-105'],
        requiredCertTitles: ['H2S Alive Certification (Energy Safety Canada)', 'First Aid / CPR Certification', 'OSHA 10/30-Hour Safety Card']
      }
    ];
  }

  saveJobRolePreset(presetObj) {
    const data = this.read();
    if (!data.job_role_presets) data.job_role_presets = this.getJobRolePresets();
    const idx = data.job_role_presets.findIndex(p => p.id === presetObj.id);
    if (idx >= 0) {
      data.job_role_presets[idx] = { ...data.job_role_presets[idx], ...presetObj, updatedAt: new Date().toISOString() };
    } else {
      presetObj.id = presetObj.id || 'preset-' + Date.now();
      presetObj.createdAt = new Date().toISOString();
      data.job_role_presets.push(presetObj);
    }
    this.save(data);
    return presetObj;
  }

  deleteJobRolePreset(id) {
    const data = this.read();
    if (data.job_role_presets) {
      data.job_role_presets = data.job_role_presets.filter(p => p.id !== id);
      this.save(data);
    }
  }
}

module.exports = new DatabaseService();
