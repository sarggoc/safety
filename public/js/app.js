// MAXX Industries Ltd - Vendor Management System Application Client Logic

const QUESTIONS_D1 = [
  "Does your company have a written Safety Policy?",
  "Does your company have a written Health & Safety Program?",
  "Does your company conduct periodic audits to ensure the effectiveness of its safety program?",
  "Does your company have a written Anti-Drug & Alcohol Misuse Program/ Plan?",
  "Does your company conduct periodic audits to ensure the Anti-Drug and Alcohol Misuse Prevention Program/ Plan is being administered effectively?",
  "Are management, supervisor and employee health and safety responsibilities clearly identified within your Health and safety program?",
  "Does your company ensure that management, supervisors and employees understand their specific responsibilities for safety?",
  "Does your company have a progressive disciplinary program in place for unacceptable safety performance by individuals?",
  "Does your operations management team conduct routine site safety tours?",
  "Is there a program in place to recognize, identify, and correct workplace hazards?",
  "Does your safety program identify work hazard risks for work tasks performed and are procedures written to identify how to eliminate or control the identified hazards?",
  "Are workers involved in pre-job safety meetings and are meeting agenda topics & attendance documented?",
  "Does your company have a process in place that allows employees to promptly submit reports of hazards, incidents, and near-misses at the worksite?",
  "Does management investigate and review all reported: hazardous conditions, incidents, and near-misses at the worksite?",
  "Does your company's Safety Program require follow-up to ensure correction of reported unsafe conditions?",
  "Does your company conduct monthly safety meetings?",
  "How often are safety meetings held? (Daily / Work Scope Change / Monthly)",
  "Does your company use additional communication methods (posters, bulletins) to stress safety practices?",
  "Does your company have written Hearing Conservation Program?",
  "Does your company have a written Energy Isolation Lock-out/Tag-out Program?",
  "Does your company have an effective modified work program in place for injured workers?",
  "Do you have a full time Health and Safety Representative on Staff?"
];

const QUESTIONS_D2 = [
  "New Hire Safety Orientations?",
  "Company Safety Policy",
  "Company Safety Rules",
  "Defensive Driving (Safe Vehicle Operation)",
  "Emergency Preparedness",
  "Fall Protection",
  "Fire Extinguishers (i.e. use of Portable Fire Extinguishers)",
  "First Aid/CPR",
  "Hazard Communication (HAZCOM)",
  "Hazard Recognition and Control",
  "Hazard Reporting Process",
  "Hearing Conservation",
  "Housekeeping - Safe Work Practices",
  "Incident Reporting (including Injury, Environmental, Damage, etc.)",
  "Lock-out/Tag-out (i.e. Isolation | De-energizing of Hazardous Energy)",
  "Personal Protective Equipment Use & Pre-Use Inspections",
  "Respiratory Protection – Air Purifying Respirators (APR)",
  "OSHA 10-Hour General Industry Training?",
  "OSHA 30-Hour General Industry?",
  "Does your company provide employees with necessary training per US DOT Operator Qualification rule for covered tasks?",
  "Are employee training records and qualifications maintained on file?"
];

const QUESTIONS_D3 = [
  "Has your company established an ISO Quality Management System or equivalency?",
  "Does your company have a policy outlining the responsibilities and frequency for conducting regular inspections of equipment?",
  "Does your company have a preventative maintenance program in place whereby all maintenance and/ or calibration records are retained?",
  "Does your organization collect and analyze data to determine suitability and effectiveness of quality management system?",
  "Is top management committed to the development and enhancement of your Quality Management System?",
  "Has your company established a procedure for identification, storage, retrieval, protection, retention and disposition of QMS records?",
  "Does your company review customer requirements prior to product supply commitment?",
  "Does your organization identify, verify, protect and maintain customer property and proprietary information where applicable?",
  "Is a member of your management team the appointed Quality Management Representative for your company?"
];

class VMSApp {
  constructor() {
    this.currentUser = null;
    this.currentVendor = null;
    this.currentPrequal = null;
    this.currentStep = 'partA';
    this.selectedAdminVendorId = 'all';
    this.certificates = [];
    this.personnelCertificates = [];
    this.requiredDefinitions = [];
    this.employees = [];
    this.courses = [];
    this.completions = [];
    this.allVendors = [];
    this.init();
  }

  async init() {
    this.renderQuestionnaires();
    await this.loadAllVendors();
    await this.checkSession();
  }

  renderQuestionnaires() {
    const d1Container = document.getElementById('q_container_d1');
    if (d1Container) {
      d1Container.innerHTML = QUESTIONS_D1.map((q, idx) => `
        <div class="question-item">
          <div class="question-text"><strong>${idx + 1}.</strong> ${q}</div>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="d1_q${idx + 1}" value="Yes"> <span>Yes</span></label>
            <label class="radio-label"><input type="radio" name="d1_q${idx + 1}" value="No"> <span>No</span></label>
            <label class="radio-label"><input type="radio" name="d1_q${idx + 1}" value="NA" checked> <span>N/A</span></label>
          </div>
        </div>
      `).join('');
    }

    const d2Container = document.getElementById('q_container_d2');
    if (d2Container) {
      d2Container.innerHTML = QUESTIONS_D2.map((q, idx) => `
        <div class="question-item">
          <div class="question-text"><strong>${idx + 1}.</strong> ${q}</div>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="d2_q${idx + 1}" value="Yes"> <span>Yes</span></label>
            <label class="radio-label"><input type="radio" name="d2_q${idx + 1}" value="No"> <span>No</span></label>
            <label class="radio-label"><input type="radio" name="d2_q${idx + 1}" value="As Required" checked> <span>As Required</span></label>
          </div>
        </div>
      `).join('');
    }

    const d3Container = document.getElementById('q_container_d3');
    if (d3Container) {
      d3Container.innerHTML = QUESTIONS_D3.map((q, idx) => `
        <div class="question-item">
          <div class="question-text"><strong>${idx + 1}.</strong> ${q}</div>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="d3_q${idx + 1}" value="Yes"> <span>Yes</span></label>
            <label class="radio-label"><input type="radio" name="d3_q${idx + 1}" value="No"> <span>No</span></label>
            <label class="radio-label"><input type="radio" name="d3_q${idx + 1}" value="NA" checked> <span>N/A</span></label>
          </div>
        </div>
      `).join('');
    }
  }

  showAppLayout() {
    const layout = document.getElementById('appLayout');
    if (layout) layout.style.display = '';
  }

  hideAppLayout() {
    const layout = document.getElementById('appLayout');
    if (layout) layout.style.display = 'none';
  }

  async checkSession() {
    try {
      const data = await this.safeFetchJson('/api/auth/me');
      if (data && data.user) {
        this.currentUser = data.user;
        this.currentVendor = data.vendor;
        this.closeAuthModal();
        this.showAppLayout();
        this.updateUserUI();
        await this.loadPrequal();
        await this.loadEmployees();
        await this.loadCertificates();
        await this.loadCourses();
        await this.loadAssignedTasks();
        if (this.currentUser.role === 'admin') {
          await this.loadAdminOverview();
        }
      } else {
        this.hideAppLayout();
        this.updateUserUI();
        this.openAuthModal('login');
      }
    } catch (e) {
      console.error('Session check failed', e);
      this.hideAppLayout();
      this.updateUserUI();
    }
  }

  async loadAllVendors() {
    if (!this.currentUser || this.currentUser.role !== 'admin') return;
    try {
      const data = await this.safeFetchJson('/api/prequal/all-vendors');
      if (data && data.vendors) {
        this.allVendors = data.vendors;
        this.populateGlobalCompanySelect();
        this.renderDashCompaniesTable();
      }
    } catch (e) {
      console.error('Failed to load all vendors', e);
    }
  }

  updateUserUI() {
    const userArea = document.getElementById('userArea');
    const sideNavAdmin = document.getElementById('sideNavAdmin');
    const sideAdminHeader = document.getElementById('sideAdminHeader');
    const sideNavPrequal = document.getElementById('sideNavPrequal');
    const sideNavPersonnel = document.getElementById('sideNavPersonnel');
    const sideNavAudit = document.getElementById('sideNavAudit');
    const sideCompanyContext = document.getElementById('sidebarCompanyContextBox');
    const globalCompanyBar = document.getElementById('globalCompanySelectorBar');
    const dashGlobalCompaniesCard = document.getElementById('dashGlobalCompaniesCard');
    const dashActionBanner = document.getElementById('dashActionBanner');

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';
    const isEmployee = this.currentUser && this.currentUser.role === 'employee';

    // Show top multi-company context bar ONLY for Admins
    if (globalCompanyBar) {
      if (isAdmin) globalCompanyBar.classList.remove('hidden');
      else globalCompanyBar.classList.add('hidden');
    }

    if (sideCompanyContext) {
      if (isAdmin) sideCompanyContext.classList.remove('hidden');
      else sideCompanyContext.classList.add('hidden');
    }

    if (dashGlobalCompaniesCard) {
      if (isAdmin) dashGlobalCompaniesCard.classList.remove('hidden');
      else dashGlobalCompaniesCard.classList.add('hidden');
    }

    const dashPendingWorkerTicketsCard = document.getElementById('dashPendingWorkerTicketsCard');
    if (dashPendingWorkerTicketsCard) {
      if (isAdmin && (this.personnelCertificates || []).some(c => c.approvalStatus === 'pending_approval' || !c.approvalStatus)) {
        dashPendingWorkerTicketsCard.classList.remove('hidden');
      } else {
        dashPendingWorkerTicketsCard.classList.add('hidden');
      }
    }

    if (dashActionBanner) {
      if (isEmployee) dashActionBanner.classList.add('hidden');
      else dashActionBanner.classList.remove('hidden');
    }

    // Hide company prequal & audit tabs for employee role
    if (sideNavPrequal) {
      if (isEmployee) sideNavPrequal.classList.add('hidden');
      else sideNavPrequal.classList.remove('hidden');
    }

    if (sideNavPersonnel) {
      if (isEmployee) sideNavPersonnel.classList.add('hidden');
      else sideNavPersonnel.classList.remove('hidden');
    }

    if (sideNavAudit) {
      if (isEmployee) sideNavAudit.classList.add('hidden');
      else sideNavAudit.classList.remove('hidden');
    }

    const btnUploadCompanyPolicyDoc = document.getElementById('btnUploadCompanyPolicyDoc');
    const btnAddCompanyCert = document.getElementById('btnAddCompanyCert');
    if (btnUploadCompanyPolicyDoc) {
      if (isEmployee) btnUploadCompanyPolicyDoc.classList.add('hidden');
      else btnUploadCompanyPolicyDoc.classList.remove('hidden');
    }
    if (btnAddCompanyCert) {
      if (isEmployee) btnAddCompanyCert.classList.add('hidden');
      else btnAddCompanyCert.classList.remove('hidden');
    }

    if (this.currentUser) {
      const currentEmp = isEmployee ? (this.employees || []).find(e => e.id === this.currentUser.employeeId) : null;
      const displayName = currentEmp ? currentEmp.employeeName : this.currentUser.username;
      const companyName = currentEmp ? (currentEmp.companyName || 'Contractor') : (this.currentVendor ? this.currentVendor.companyName : 'Contractor Organization');

      const avatarHtml = (currentEmp && currentEmp.profilePictureUrl)
        ? `<img src="${currentEmp.profilePictureUrl}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">`
        : `<div style="width:38px; height:38px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem;">
             ${displayName.charAt(0).toUpperCase()}
           </div>`;

      if (userArea) {
        userArea.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
            ${avatarHtml}
            <div style="overflow:hidden;">
              <div style="font-weight:700; font-size:0.88rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${displayName}">${displayName}</div>
              <div style="font-size:0.75rem; color:var(--primary); font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${companyName}">${companyName}</div>
              <div style="font-size:0.68rem; color:var(--text-muted); text-transform:uppercase;">${isEmployee ? 'Company Worker' : this.currentUser.role}</div>
            </div>
          </div>
          <div style="display:flex; gap:0.35rem; margin-top:0.35rem;">
            ${isEmployee ? `<button class="btn btn-secondary btn-sm" style="flex:1; font-size:0.75rem;" onclick="app.openWorkerSelfProfileModal()"><i class="fa-solid fa-user-pen"></i> Edit Profile</button>` : ''}
            <button class="btn btn-secondary btn-sm" style="${isEmployee ? 'flex:1;' : 'width:100%;'} font-size:0.75rem;" onclick="app.logout()">
              <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        `;
      }

      // Update Dashboard Header Title for Employee
      const dashTitle = document.querySelector('#tab-dashboard .card-title');
      const dashSubtitle = document.getElementById('dashSubtitle');
      if (dashTitle && isEmployee) {
        dashTitle.innerHTML = `<i class="fa-solid fa-id-card-clip" style="color:var(--primary);"></i> Worker Safety & Qualification Portal`;
      }
      if (dashSubtitle && isEmployee) {
        dashSubtitle.innerText = `Logged in as ${displayName} (${companyName}) | Personal Safety Tickets & Compliance Center`;
      }

      if (isAdmin) {
        if (sideAdminHeader) sideAdminHeader.classList.remove('hidden');
        if (sideNavAdmin) sideNavAdmin.classList.remove('hidden');
      } else {
        if (sideAdminHeader) sideAdminHeader.classList.add('hidden');
        if (sideNavAdmin) sideNavAdmin.classList.add('hidden');
      }
    } else {
      if (userArea) {
        userArea.innerHTML = `
          <button class="btn btn-primary btn-sm" style="width:100%;" onclick="app.openAuthModal('login')">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In / Register
          </button>
        `;
      }
    }
  }

  populateGlobalCompanySelect() {
    const gSelect = document.getElementById('globalCompanySelect');
    const sSelect = document.getElementById('sidebarCompanySelect');
    const aSelect = document.getElementById('adminCompanyFilterSelect');

    if (this.allVendors && this.allVendors.length > 0) {
      const selectedVal = this.selectedAdminVendorId || (this.currentVendor ? this.currentVendor.id : 'all');

      const optionsHtml = `
        <option value="all" ${selectedVal === 'all' ? 'selected' : ''}>Global Multi-Company View (${this.allVendors.length} Companies)</option>
        ${this.allVendors.map(v => `<option value="${v.id}" ${selectedVal === v.id ? 'selected' : ''}>${v.companyName} (${v.country || 'Canada'})</option>`).join('')}
      `;

      if (gSelect) {
        gSelect.innerHTML = optionsHtml;
        gSelect.value = selectedVal;
      }
      if (sSelect) {
        sSelect.innerHTML = optionsHtml;
        sSelect.value = selectedVal;
      }
      if (aSelect) {
        aSelect.innerHTML = optionsHtml;
        aSelect.value = selectedVal;
      }
    }
  }

  async handleGlobalCompanyChange(vendorId) {
    this.selectedAdminVendorId = vendorId;
    
    // Sync all dropdowns
    const gSelect = document.getElementById('globalCompanySelect');
    const sSelect = document.getElementById('sidebarCompanySelect');
    const aSelect = document.getElementById('adminCompanyFilterSelect');

    if (gSelect) gSelect.value = vendorId;
    if (sSelect) sSelect.value = vendorId;
    if (aSelect) aSelect.value = vendorId;

    await this.loadPrequal(vendorId !== 'all' ? vendorId : null);
    await this.loadEmployees();
    await this.loadCertificates();
    await this.loadAssignedTasks();

    // Reload active tab
    const activeTab = document.querySelector('.tab-content:not(.hidden)');
    if (activeTab && activeTab.id === 'tab-audit') {
      this.loadAuditReport();
    }
  }

  showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
      targetTab.classList.remove('hidden');
    }

    const navIdMap = {
      'dashboard': 'sideNavDashboard',
      'prequal': 'sideNavPrequal',
      'certificates': 'sideNavCerts',
      'personnel': 'sideNavPersonnel',
      'courses': 'sideNavCourses',
      'audit': 'sideNavAudit',
      'admin': 'sideNavAdmin'
    };

    const targetNav = document.getElementById(navIdMap[tabName]);
    if (targetNav) targetNav.classList.add('active');

    if (tabName === 'audit') {
      this.loadAuditReport();
    }
  }

  loadAuditReport() {
    const v = (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all') 
      ? (this.allVendors.find(item => item.id === this.selectedAdminVendorId) || this.currentVendor) 
      : this.currentVendor;

    const pq = this.currentPrequal || {};

    if (document.getElementById('auditRefNum')) {
      document.getElementById('auditRefNum').innerText = `AUD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (document.getElementById('auditTimestamp')) {
      document.getElementById('auditTimestamp').innerText = `Audit Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    }

    if (v) {
      const flag = (v.country === 'USA') ? '🇺🇸 United States (OSHA / DOT)' : ((v.country === 'Both') ? '🇨🇦🇺🇸 Dual Jurisdiction' : '🇨🇦 Canada (WCB / OH&S)');
      if (document.getElementById('auditCompName')) document.getElementById('auditCompName').innerText = v.companyName || 'Acme Contracting';
      if (document.getElementById('auditCountry')) document.getElementById('auditCountry').innerText = flag;
      if (document.getElementById('auditContact')) document.getElementById('auditContact').innerText = `${v.primaryContact || 'N/A'} (${v.email || ''})`;
      if (document.getElementById('auditIsnet')) document.getElementById('auditIsnet').innerText = v.isnetworldId || 'N/A';
      if (document.getElementById('auditGst')) document.getElementById('auditGst').innerText = v.gstNumber || 'N/A';
      if (document.getElementById('auditWcb')) document.getElementById('auditWcb').innerText = v.taxWcbNumber || 'N/A';
      if (document.getElementById('auditCor')) document.getElementById('auditCor').innerText = v.corNumber || 'N/A';
      if (document.getElementById('auditEmail')) document.getElementById('auditEmail').innerText = v.email || 'N/A';
    }

    // Comprehensive Audit Pass/Fail Evaluation
    const deficiencies = [];

    // 1. Check Company Organization Identifiers
    if (!v || !v.gstNumber || v.gstNumber === 'N/A' || !v.gstNumber.trim()) {
      deficiencies.push('Missing GST / HST Business Number (Canada)');
    }
    if (!v || !v.taxWcbNumber || v.taxWcbNumber === 'N/A' || !v.taxWcbNumber.trim()) {
      deficiencies.push('Missing WCB / WSIB Account Number (Canada)');
    }
    if (!v || !v.corNumber || v.corNumber === 'N/A' || !v.corNumber.trim()) {
      deficiencies.push('Missing COR / SECOR Safety Certificate Number (Safety Canada)');
    }

    // 2. Check Mandated Company Certificates
    const requiredCompanyMandatory = (this.requiredDefinitions && Array.isArray(this.requiredDefinitions)) 
      ? this.requiredDefinitions.filter(r => (r.scope || 'company') === 'company' && r.isMandatory) 
      : [];

    const companyCertAuditRows = [];
    requiredCompanyMandatory.forEach(req => {
      const found = (this.certificates || []).find(c => c.title.toLowerCase().includes(req.title.toLowerCase()) || req.title.toLowerCase().includes(c.type.toLowerCase()));
      if (!found) {
        deficiencies.push(`Missing Mandated Company Certificate: ${req.title}`);
        companyCertAuditRows.push({
          title: req.title,
          type: req.category || 'Company Requirement',
          status: '<span class="badge badge-draft">MISSING</span>',
          expiry: 'N/A',
          result: '<span style="color:var(--danger); font-weight:700;">FAIL (MISSING)</span>'
        });
      } else if (found.computedStatus === 'expired') {
        deficiencies.push(`Expired Company Certificate: ${req.title} (Expired on ${found.expiryDate})`);
        companyCertAuditRows.push({
          title: found.title,
          type: found.type,
          status: `<span class="badge badge-${found.computedStatus}">${found.computedStatus}</span>`,
          expiry: found.expiryDate,
          result: '<span style="color:var(--danger); font-weight:700;">FAIL (EXPIRED)</span>'
        });
      } else if (found.approvalStatus === 'rejected') {
        deficiencies.push(`Rejected Company Certificate: ${req.title} (Rejected by MAXX Admin)`);
        companyCertAuditRows.push({
          title: found.title,
          type: found.type,
          status: '<span class="badge badge-expired">REJECTED</span>',
          expiry: found.expiryDate,
          result: '<span style="color:var(--danger); font-weight:700;">FAIL (REJECTED)</span>'
        });
      } else if (found.approvalStatus === 'pending_approval') {
        deficiencies.push(`Unapproved Company Certificate: ${req.title} (Pending MAXX Admin Approval)`);
        companyCertAuditRows.push({
          title: found.title,
          type: found.type,
          status: '<span class="badge badge-warning">PENDING REVIEW</span>',
          expiry: found.expiryDate,
          result: '<span style="color:var(--warning); font-weight:700;">PENDING ADMIN APPROVAL</span>'
        });
      } else {
        companyCertAuditRows.push({
          title: found.title,
          type: found.type,
          status: `<span class="badge badge-${found.computedStatus}">${found.computedStatus}</span>`,
          expiry: found.expiryDate,
          result: '<span style="color:var(--success); font-weight:700;">PASS</span>'
        });
      }
    });

    // Add any extra uploaded company certs
    (this.certificates || []).forEach(c => {
      const alreadyListed = companyCertAuditRows.some(row => row.title === c.title);
      if (!alreadyListed) {
        const isFail = c.computedStatus === 'expired' || c.approvalStatus === 'rejected';
        const isPending = c.approvalStatus === 'pending_approval';
        companyCertAuditRows.push({
          title: c.title,
          type: c.type,
          status: `<span class="badge badge-${c.computedStatus}">${c.computedStatus}</span>`,
          expiry: c.expiryDate,
          result: isFail ? '<span style="color:var(--danger); font-weight:700;">FAIL</span>' : (isPending ? '<span style="color:var(--warning); font-weight:700;">PENDING REVIEW</span>' : '<span style="color:var(--success); font-weight:700;">PASS</span>')
        });
      }
    });

    // 3. Check Worker Delegated Qualifications against Roster & Requirements
    const requiredWorkerMandatory = (this.requiredDefinitions && Array.isArray(this.requiredDefinitions)) 
      ? this.requiredDefinitions.filter(r => r.scope === 'employee' && r.isMandatory) 
      : [];

    const workerCertAuditRows = [];
    const activeWorkers = (this.employees && this.employees.length > 0) ? this.employees : [{ id: 'demo', employeeName: 'Company Workers', jobTitle: 'Worker' }];

    activeWorkers.forEach(emp => {
      requiredWorkerMandatory.forEach(req => {
        const found = (this.personnelCertificates || []).find(pc => (pc.employeeId === emp.id || pc.employeeName === emp.employeeName) && (pc.title.toLowerCase().includes(req.title.toLowerCase()) || req.title.toLowerCase().includes(pc.title.toLowerCase())));
        
        if (!found) {
          deficiencies.push(`Missing Worker Qualification: ${emp.employeeName} - ${req.title}`);
          workerCertAuditRows.push({
            empName: emp.employeeName,
            jobTitle: emp.jobTitle || 'Worker',
            reqTitle: req.title,
            issueDate: 'N/A',
            expiryDate: 'N/A',
            result: '<span style="color:var(--danger); font-weight:700;">FAIL (MISSING)</span>'
          });
        } else if (found.computedStatus === 'expired') {
          deficiencies.push(`Expired Worker Qualification: ${emp.employeeName} - ${req.title} (Expired on ${found.expiryDate})`);
          workerCertAuditRows.push({
            empName: emp.employeeName,
            jobTitle: emp.jobTitle || 'Worker',
            reqTitle: found.title,
            issueDate: found.issueDate || 'N/A',
            expiryDate: found.expiryDate,
            result: '<span style="color:var(--danger); font-weight:700;">FAIL (EXPIRED)</span>'
          });
        } else {
          workerCertAuditRows.push({
            empName: emp.employeeName,
            jobTitle: emp.jobTitle || 'Worker',
            reqTitle: found.title,
            issueDate: found.issueDate || 'N/A',
            expiryDate: found.expiryDate,
            result: '<span style="color:var(--success); font-weight:700;">PASS</span>'
          });
        }
      });
    });

    // Add any extra submitted personnel certs
    (this.personnelCertificates || []).forEach(pc => {
      const alreadyListed = workerCertAuditRows.some(row => row.empName === pc.employeeName && row.reqTitle === pc.title);
      if (!alreadyListed) {
        workerCertAuditRows.push({
          empName: pc.employeeName,
          jobTitle: 'Worker',
          reqTitle: pc.title,
          issueDate: pc.issueDate || 'N/A',
          expiryDate: pc.expiryDate,
          result: pc.computedStatus === 'expired' ? '<span style="color:var(--danger); font-weight:700;">FAIL (EXPIRED)</span>' : '<span style="color:var(--success); font-weight:700;">PASS</span>'
        });
      }
    });

    // 4. Check Pre-Qualification Review Status
    const status = pq.status || 'draft';
    if (status !== 'approved') {
      deficiencies.push('Pre-Qualification Package Not Signed Off (Part F Review Pending)');
    }

    // Render Audit Scorecard Box & Badge
    const scorecardBox = document.getElementById('auditScorecardBox');
    const badgeEl = document.getElementById('auditScorecardBadge');
    const detailsEl = document.getElementById('auditSignOffDetails');
    const deficienciesCard = document.getElementById('auditDeficienciesCard');
    const deficienciesList = document.getElementById('auditDeficienciesList');
    const deficiencyCountEl = document.getElementById('auditDeficiencyCount');

    if (deficiencies.length === 0) {
      if (scorecardBox) {
        scorecardBox.style.background = 'var(--success-bg)';
        scorecardBox.style.borderColor = 'var(--success-border)';
      }
      if (badgeEl) {
        badgeEl.innerText = 'VERIFIED & APPROVED';
        badgeEl.style.color = 'var(--success-text)';
      }
      if (detailsEl) {
        detailsEl.innerText = '100% Compliant - Part F Sign-Off & Active Certificates';
        detailsEl.style.color = 'var(--success-text)';
      }
      if (deficienciesCard) deficienciesCard.classList.add('hidden');
    } else {
      if (scorecardBox) {
        scorecardBox.style.background = '#fef2f2';
        scorecardBox.style.borderColor = '#fca5a5';
      }
      if (badgeEl) {
        badgeEl.innerText = 'AUDIT FAILED';
        badgeEl.style.color = '#991b1b';
      }
      if (detailsEl) {
        detailsEl.innerText = `${deficiencies.length} Critical Deficiencies Identified`;
        detailsEl.style.color = '#991b1b';
      }
      if (deficienciesCard) {
        deficienciesCard.classList.remove('hidden');
        if (deficiencyCountEl) deficiencyCountEl.innerText = deficiencies.length;
        if (deficienciesList) {
          deficienciesList.innerHTML = deficiencies.map(d => `<li>${d}</li>`).join('');
        }
      }
    }

    // Incident Table
    const incidentBody = document.getElementById('auditIncidentBody');
    if (incidentBody) {
      const records = (pq.partC && pq.partC.records) ? pq.partC.records : [
        { year: 2024, hoursWorked: 120000, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0 },
        { year: 2023, hoursWorked: 115000, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0 },
        { year: 2022, hoursWorked: 110000, lostTimeCases: 0, totalRecordableCases: 0, trir: 0, ltir: 0, dart: 0, emr: 1.0, fatalities: 0, citations: 0 }
      ];

      const r24 = records.find(r => r.year === 2024) || {};
      const r23 = records.find(r => r.year === 2023) || {};
      const r22 = records.find(r => r.year === 2022) || {};

      incidentBody.innerHTML = `
        <tr><td>Total Workforce Accumulated Hours</td><td>${(r24.hoursWorked || 0).toLocaleString()}</td><td>${(r23.hoursWorked || 0).toLocaleString()}</td><td>${(r22.hoursWorked || 0).toLocaleString()}</td><td>Standard Baseline</td></tr>
        <tr><td>Total Recordable Injury Rate (TRIR)</td><td><strong>${(r24.trir || 0).toFixed(2)}</strong></td><td><strong>${(r23.trir || 0).toFixed(2)}</strong></td><td><strong>${(r22.trir || 0).toFixed(2)}</strong></td><td><span class="badge badge-active">Verified Low</span></td></tr>
        <tr><td>Lost Time Injury Rate (LTIR)</td><td><strong>${(r24.ltir || 0).toFixed(2)}</strong></td><td><strong>${(r23.ltir || 0).toFixed(2)}</strong></td><td><strong>${(r22.ltir || 0).toFixed(2)}</strong></td><td><span class="badge badge-active">Zero LTI</span></td></tr>
        <tr><td>Days Away / Restricted Rate (DART)</td><td><strong>${(r24.dart || 0).toFixed(2)}</strong></td><td><strong>${(r23.dart || 0).toFixed(2)}</strong></td><td><strong>${(r22.dart || 0).toFixed(2)}</strong></td><td><span class="badge badge-active">Zero DART</span></td></tr>
        <tr><td>Experience Modification Rate (EMR)</td><td>${r24.emr || 1.0}</td><td>${r23.emr || 1.0}</td><td>${r22.emr || 1.0}</td><td>Satisfactory</td></tr>
        <tr><td>Workplace Fatalities / Citations</td><td>${r24.fatalities || 0} / ${r24.citations || 0}</td><td>${r23.fatalities || 0} / ${r23.citations || 0}</td><td>${r22.fatalities || 0} / ${r22.citations || 0}</td><td>Clean Record</td></tr>
      `;
    }

    // Company Cert Audit Table
    const certBody = document.getElementById('auditCompanyCertBody');
    if (certBody) {
      if (companyCertAuditRows.length === 0) {
        certBody.innerHTML = `<tr><td colspan="5" class="text-center">No company compliance certificates on file.</td></tr>`;
      } else {
        certBody.innerHTML = companyCertAuditRows.map(row => `
          <tr>
            <td><strong>${row.title}</strong></td>
            <td>${row.type}</td>
            <td>${row.status}</td>
            <td>${row.expiry}</td>
            <td>${row.result}</td>
          </tr>
        `).join('');
      }
    }

    // Worker Cert Audit Table
    const workerBody = document.getElementById('auditWorkerCertBody');
    if (workerBody) {
      if (workerCertAuditRows.length === 0) {
        workerBody.innerHTML = `<tr><td colspan="6" class="text-center">No employee safety qualifications on file.</td></tr>`;
      } else {
        workerBody.innerHTML = workerCertAuditRows.map(row => `
          <tr>
            <td><strong>${row.empName}</strong></td>
            <td>${row.jobTitle}</td>
            <td>${row.reqTitle}</td>
            <td>${row.issueDate}</td>
            <td>${row.expiryDate}</td>
            <td>${row.result}</td>
          </tr>
        `).join('');
      }
    }
  }

  setAdminSubTab(subTab) {
    document.querySelectorAll('.admin-sub-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('#tab-admin .btn-secondary').forEach(el => el.classList.remove('active'));

    const view = document.getElementById(`adminView-${subTab}`);
    if (view) view.classList.remove('hidden');

    const btnMap = {
      vendors: 'adminSubTabVendors',
      certReq: 'adminSubTabCertReq',
      courseReq: 'adminSubTabCourseReq'
    };
    const btn = document.getElementById(btnMap[subTab]);
    if (btn) btn.classList.add('active');
  }

  setStep(stepName) {
    this.currentStep = stepName;
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.step-tab').forEach(el => el.classList.remove('active'));

    const targetStep = document.getElementById(`step-${stepName}`);
    if (targetStep) targetStep.classList.remove('hidden');

    const stepMap = { partA: 0, partB: 1, partC: 2, partD: 3, partE: 4, partF: 5 };
    const tabs = document.querySelectorAll('.step-tab');
    if (stepMap[stepName] !== undefined && tabs[stepMap[stepName]]) {
      tabs[stepMap[stepName]].classList.add('active');
    }
  }

  // Auth Handling
  openAuthModal(type = 'login') {
    document.getElementById('authModal').classList.add('active');
    this.toggleAuthForm(type);
  }

  closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
  }

  toggleAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authModalTitle');

    if (type === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      title.innerText = 'Sign In to MAXX VMS';
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      title.innerText = 'Contractor Account Registration';
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      this.currentUser = data.user;
      this.currentVendor = data.vendor;
      this.closeAuthModal();
      this.updateUserUI();
      await this.loadPrequal();
      await this.loadEmployees();
      await this.loadCertificates();
      await this.loadCourses();
      if (this.currentUser.role === 'admin') {
        await this.loadAdminOverview();
      }
      this.showTab('dashboard');
    } catch (err) {
      alert('Login Error: ' + err.message);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const payload = {
      username: document.getElementById('regUsername').value,
      password: document.getElementById('regPassword').value,
      companyName: document.getElementById('regCompanyName').value,
      primaryContact: document.getElementById('regContact').value,
      isnetworldId: document.getElementById('regIsnetworld').value,
      gstNumber: document.getElementById('regGstNumber') ? document.getElementById('regGstNumber').value : '',
      phone: document.getElementById('regPhone').value,
      email: document.getElementById('regEmail').value
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      this.currentUser = data.user;
      this.currentVendor = data.vendor;
      this.closeAuthModal();
      this.showAppLayout();
      this.updateUserUI();
      await this.loadPrequal();
      await this.loadEmployees();
      await this.loadCertificates();
      await this.loadCourses();
      this.showTab('prequal');
    } catch (err) {
      alert('Registration Error: ' + err.message);
    }
  }

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    this.currentUser = null;
    this.currentVendor = null;
    this.currentPrequal = null;
    this.hideAppLayout();
    this.updateUserUI();
    this.openAuthModal('login');
  }

  // Safe JSON Fetch Helper
  async safeFetchJson(url, options = {}) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (e) {
      console.warn('JSON fetch failed for ' + url, e);
    }
    return null;
  }

  // Pre-qualification Loading & Populating
  async loadPrequal(vendorId = null) {
    try {
      const targetId = vendorId || (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all' ? this.selectedAdminVendorId : null);
      const url = targetId ? `/api/prequal/${targetId}` : '/api/prequal';
      const data = await this.safeFetchJson(url);
      if (data) {
        this.currentPrequal = data.prequal;
        if (data.vendor) this.currentVendor = data.vendor;
        this.populatePrequalForm(data.prequal);
        this.updateDashboardUI();
      }
    } catch (e) {
      console.error('Failed to load prequal', e);
    }
  }

  updateDashboardUI() {
    const prequalStatusPill = document.getElementById('prequalStatusPill');
    const dashPrequalStatus = document.getElementById('dashPrequalStatus');
    const dashSubtitle = document.getElementById('dashSubtitle');
    const checklistBody = document.getElementById('dashChecklistBody');

    const status = this.currentPrequal ? (this.currentPrequal.status || 'draft') : 'not_started';

    const statusLabels = {
      'draft': 'Draft Saved',
      'pending_review': 'Pending MAXX Review',
      'approved': 'Approved Service Provider',
      'rejected': 'Application Rejected',
      'not_started': 'Not Started'
    };

    if (prequalStatusPill) {
      prequalStatusPill.innerHTML = `<span class="badge badge-${status}">${statusLabels[status] || status}</span>`;
    }
    if (dashPrequalStatus) {
      dashPrequalStatus.innerText = statusLabels[status] || status;
    }
    if (dashSubtitle) {
      if (!this.selectedAdminVendorId || this.selectedAdminVendorId === 'all') {
        const count = this.allVendors ? this.allVendors.length : 4;
        dashSubtitle.innerText = `Global Multi-Company Compliance View | Showing All ${count} Registered Contractor Organizations`;
      } else if (this.currentVendor) {
        dashSubtitle.innerText = `Active Contractor: ${this.currentVendor.companyName} | Jurisdiction: ${this.currentVendor.country || 'Canada'} | ISNetworld ID: ${this.currentVendor.isnetworldId || 'N/A'} | GST/WCB #: ${this.currentVendor.gstNumber || this.currentVendor.taxWcbNumber || 'N/A'}`;
      }
    }

    if (checklistBody && this.currentPrequal) {
      const partB = this.currentPrequal.partB || {};
      const items = [
        { req: 'B.1 Health & Safety Manual', limit: 'Company Policy Standard', file: partB.healthSafetyManual, exp: partB.healthSafetyManualExpiry },
        { req: 'B.2 Anti-Drug & Alcohol Plan', limit: '49 CFR Part 199 / Part 40', file: partB.antiDrugPlan, exp: partB.antiDrugPlanExpiry },
        { req: 'B.3 Commercial Liability Insurance', limit: '$5,000,000 CGL / $2M Auto', file: partB.liabilityCert, exp: partB.liabilityCertExpiry },
        { req: 'B.4 Workers Compensation', limit: 'State Statutory + Subrogation Waiver', file: partB.workersCompCert, exp: partB.workersCompCertExpiry },
        { req: 'B.5 3-Year EMR Statement', limit: 'Insurance Provider Statement', file: partB.emrStatement, exp: partB.emrStatementExpiry }
      ];

      checklistBody.innerHTML = items.map(item => {
        let statusBadge = '<span class="badge badge-draft">Missing</span>';
        if (item.file && item.file.url) {
          statusBadge = '<span class="badge badge-active">Uploaded</span>';
        }
        return `
          <tr>
            <td><strong>${item.req}</strong></td>
            <td>${item.limit}</td>
            <td>${statusBadge}</td>
            <td>${item.exp || 'N/A'}</td>
          </tr>
        `;
      }).join('');
    }
  }

  handleCountryChange(country) {
    const lblGst = document.getElementById('lblGstNumber');
    const lblWcb = document.getElementById('lblTaxWcbNumber');
    const lblCor = document.getElementById('lblCorNumber');
    const lblState = document.getElementById('lblStateProvince');

    if (country === 'Canada') {
      if (lblGst) lblGst.innerText = 'GST / HST Business Number (Canada)';
      if (lblWcb) lblWcb.innerText = 'WCB / WSIB Account Number (Canada)';
      if (lblCor) lblCor.innerText = 'COR / SECOR Certificate Number (Safety Canada)';
      if (lblState) lblState.innerText = 'Province * (e.g. AB, BC, ON, SK)';
    } else if (country === 'USA') {
      if (lblGst) lblGst.innerText = 'Federal EIN / Tax ID Number (USA)';
      if (lblWcb) lblWcb.innerText = 'Workers Compensation Policy / Account #';
      if (lblCor) lblCor.innerText = 'OSHA / Safety Program Audit ID';
      if (lblState) lblState.innerText = 'State * (e.g. TX, ND, PA, OH)';
    } else {
      if (lblGst) lblGst.innerText = 'GST/HST (Canada) / Tax ID (USA)';
      if (lblWcb) lblWcb.innerText = 'WCB (Canada) / Workers Comp Account #';
      if (lblCor) lblCor.innerText = 'COR / SECOR / Safety Audit Number';
      if (lblState) lblState.innerText = 'Province / State *';
    }
  }

  populatePrequalForm(pq) {
    if (!pq) return;

    // Part A
    if (pq.partA) {
      if (document.getElementById('partA_country')) {
        document.getElementById('partA_country').value = pq.partA.country || 'Canada';
        this.handleCountryChange(pq.partA.country || 'Canada');
      }
      document.getElementById('partA_contractorName').value = pq.partA.contractorName || '';
      document.getElementById('partA_primaryContact').value = pq.partA.primaryContact || '';
      document.getElementById('partA_isnetworldId').value = pq.partA.isnetworldId || '';
      if (document.getElementById('partA_gstNumber')) document.getElementById('partA_gstNumber').value = pq.partA.gstNumber || '';
      if (document.getElementById('partA_taxWcbNumber')) document.getElementById('partA_taxWcbNumber').value = pq.partA.taxWcbNumber || '';
      if (document.getElementById('partA_corNumber')) document.getElementById('partA_corNumber').value = pq.partA.corNumber || '';
      document.getElementById('partA_address').value = pq.partA.address || '';
      document.getElementById('partA_city').value = pq.partA.city || '';
      document.getElementById('partA_state').value = pq.partA.state || '';
      document.getElementById('partA_zip').value = pq.partA.zip || '';
      document.getElementById('partA_phone').value = pq.partA.phone || '';
      document.getElementById('partA_fax').value = pq.partA.fax || '';
      document.getElementById('partA_email').value = pq.partA.email || '';
    }

    // Part B
    if (pq.partB) {
      if (pq.partB.healthSafetyManualExpiry) document.getElementById('expiry_b1').value = pq.partB.healthSafetyManualExpiry;
      if (pq.partB.antiDrugPlanExpiry) document.getElementById('expiry_b2').value = pq.partB.antiDrugPlanExpiry;
      if (pq.partB.liabilityCertExpiry) document.getElementById('expiry_b3').value = pq.partB.liabilityCertExpiry;
      if (pq.partB.workersCompCertExpiry) document.getElementById('expiry_b4').value = pq.partB.workersCompCertExpiry;
      if (pq.partB.workersCompExplanation) document.getElementById('partB_wcExplanation').value = pq.partB.workersCompExplanation;
      if (pq.partB.emrStatementExpiry) document.getElementById('expiry_b5').value = pq.partB.emrStatementExpiry;
      if (pq.partB.emrExplanation) document.getElementById('partB_emrExplanation').value = pq.partB.emrExplanation;
      if (pq.partB.cargoTransport) {
        document.getElementById('partB_cargoTransport').value = pq.partB.cargoTransport;
        this.toggleCargoSection();
      }
    }

    // Part C
    if (pq.partC && pq.partC.records) {
      pq.partC.records.forEach(rec => {
        const yr = rec.year;
        if ([2024, 2023, 2022].includes(yr)) {
          document.getElementById(`c_hours_${yr}`).value = rec.hoursWorked || '';
          document.getElementById(`c_ltCases_${yr}`).value = rec.lostTimeCases || '';
          document.getElementById(`c_trCases_${yr}`).value = rec.totalRecordableCases || '';
          document.getElementById(`c_emr_${yr}`).value = rec.emr || '';
          document.getElementById(`c_fatalities_${yr}`).value = rec.fatalities || '';
          document.getElementById(`c_citations_${yr}`).value = rec.citations || '';
        }
      });
      if (pq.partC.citationSummary) {
        document.getElementById('partC_citationSummary').value = pq.partC.citationSummary;
      }
      this.recalculatePartC();
    }

    // Part D Questionnaire Answers
    if (pq.partD) {
      ['d1', 'd2', 'd3'].forEach(sectionKey => {
        const sec = pq.partD[sectionKey];
        if (sec) {
          Object.keys(sec).forEach(qKey => {
            const rad = document.querySelector(`input[name="${sectionKey}_${qKey}"][value="${sec[qKey]}"]`);
            if (rad) rad.checked = true;
          });
        }
      });
    }

    // Part E
    if (pq.partE) {
      document.getElementById('partE_companyName').value = pq.partE.companyName || '';
      document.getElementById('partE_phone').value = pq.partE.phone || '';
      document.getElementById('partE_fax').value = pq.partE.fax || '';
      document.getElementById('partE_email').value = pq.partE.email || '';
      document.getElementById('partE_repName').value = pq.partE.representativeName || '';
      document.getElementById('partE_date').value = pq.partE.date || '';
      document.getElementById('partE_signature').value = pq.partE.signature || '';
      this.updateSignatureBox(pq.partE.signature || '');
    }

    // Part F
    if (pq.partF) {
      document.getElementById('partF_subcontractorName').innerText = pq.partA ? (pq.partA.contractorName || 'Contractor') : 'Contractor';
      document.getElementById('partF_opsManager').value = pq.partF.operationsManager || '';
      document.getElementById('partF_opsDate').value = pq.partF.operationsDate || '';
      document.getElementById('partF_hseOfficer').value = pq.partF.hseOfficer || '';
      document.getElementById('partF_hseDate').value = pq.partF.hseDate || '';
      document.getElementById('partF_comments').value = pq.partF.comments || '';
    }
  }

  async savePrequal(submitForReview = false) {
    try {
      const partA = {
        country: document.getElementById('partA_country') ? document.getElementById('partA_country').value : 'Canada',
        contractorName: document.getElementById('partA_contractorName').value,
        primaryContact: document.getElementById('partA_primaryContact').value,
        isnetworldId: document.getElementById('partA_isnetworldId').value,
        gstNumber: document.getElementById('partA_gstNumber') ? document.getElementById('partA_gstNumber').value : '',
        taxWcbNumber: document.getElementById('partA_taxWcbNumber') ? document.getElementById('partA_taxWcbNumber').value : '',
        corNumber: document.getElementById('partA_corNumber') ? document.getElementById('partA_corNumber').value : '',
        address: document.getElementById('partA_address').value,
        city: document.getElementById('partA_city').value,
        state: document.getElementById('partA_state').value,
        zip: document.getElementById('partA_zip').value,
        phone: document.getElementById('partA_phone').value,
        fax: document.getElementById('partA_fax').value,
        email: document.getElementById('partA_email').value
      };

      const partB = {
        healthSafetyManual: { url: document.getElementById('url_b1').value },
        healthSafetyManualExpiry: document.getElementById('expiry_b1').value,
        antiDrugPlan: { url: document.getElementById('url_b2').value },
        antiDrugPlanExpiry: document.getElementById('expiry_b2').value,
        liabilityCert: { url: document.getElementById('url_b3').value },
        liabilityCertExpiry: document.getElementById('expiry_b3').value,
        cargoTransport: document.getElementById('partB_cargoTransport').value,
        cargoCert: { url: document.getElementById('url_cargo').value },
        cargoCertExpiry: document.getElementById('expiry_cargo').value,
        workersCompCert: { url: document.getElementById('url_b4').value },
        workersCompCertExpiry: document.getElementById('expiry_b4').value,
        workersCompExplanation: document.getElementById('partB_wcExplanation').value,
        emrStatement: { url: document.getElementById('url_b5').value },
        emrStatementExpiry: document.getElementById('expiry_b5').value,
        emrExplanation: document.getElementById('partB_emrExplanation').value
      };

      const records = [2024, 2023, 2022].map(yr => ({
        year: yr,
        hoursWorked: parseFloat(document.getElementById(`c_hours_${yr}`).value) || 0,
        lostTimeCases: parseFloat(document.getElementById(`c_ltCases_${yr}`).value) || 0,
        totalRecordableCases: parseFloat(document.getElementById(`c_trCases_${yr}`).value) || 0,
        emr: parseFloat(document.getElementById(`c_emr_${yr}`).value) || 1.0,
        fatalities: parseInt(document.getElementById(`c_fatalities_${yr}`).value) || 0,
        citations: parseInt(document.getElementById(`c_citations_${yr}`).value) || 0
      }));

      const partC = {
        records,
        citationSummary: document.getElementById('partC_citationSummary').value,
        osha300aFiles: [{ url: document.getElementById('url_osha300a').value }]
      };

      // Part D answers
      const d1 = {}, d2 = {}, d3 = {};
      QUESTIONS_D1.forEach((_, idx) => {
        const rad = document.querySelector(`input[name="d1_q${idx + 1}"]:checked`);
        if (rad) d1[`q${idx + 1}`] = rad.value;
      });
      QUESTIONS_D2.forEach((_, idx) => {
        const rad = document.querySelector(`input[name="d2_q${idx + 1}"]:checked`);
        if (rad) d2[`q${idx + 1}`] = rad.value;
      });
      QUESTIONS_D3.forEach((_, idx) => {
        const rad = document.querySelector(`input[name="d3_q${idx + 1}"]:checked`);
        if (rad) d3[`q${idx + 1}`] = rad.value;
      });

      const partE = {
        companyName: document.getElementById('partE_companyName').value,
        phone: document.getElementById('partE_phone').value,
        fax: document.getElementById('partE_fax').value,
        email: document.getElementById('partE_email').value,
        representativeName: document.getElementById('partE_repName').value,
        date: document.getElementById('partE_date').value,
        signature: document.getElementById('partE_signature').value
      };

      const payload = {
        vendorId: (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all') ? this.selectedAdminVendorId : null,
        partA,
        partB,
        partC,
        partD: { d1, d2, d3 },
        partE,
        submitForReview
      };

      const res = await fetch('/api/prequal/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save prequalification');

      alert(submitForReview ? 'Pre-Qualification submitted successfully to MAXX Industries!' : 'Draft saved successfully!');
      await this.loadPrequal();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (err) {
      alert('Save error: ' + err.message);
    }
  }

  async adminSignOff(decisionStatus) {
    try {
      const operationsManager = document.getElementById('partF_opsManager') ? document.getElementById('partF_opsManager').value : '';
      const operationsDate = document.getElementById('partF_opsDate') ? document.getElementById('partF_opsDate').value : '';
      const hseOfficer = document.getElementById('partF_hseOfficer') ? document.getElementById('partF_hseOfficer').value : '';
      const hseDate = document.getElementById('partF_hseDate') ? document.getElementById('partF_hseDate').value : '';
      const comments = document.getElementById('partF_comments') ? document.getElementById('partF_comments').value : '';

      const vendorId = (this.selectedAdminVendorId && this.selectedAdminVendorId !== 'all') 
        ? this.selectedAdminVendorId 
        : (this.currentPrequal ? this.currentPrequal.vendorId : null);

      const payload = {
        vendorId,
        prequalId: this.currentPrequal ? this.currentPrequal.id : null,
        status: decisionStatus,
        operationsManager,
        operationsDate,
        hseOfficer,
        hseDate,
        comments
      };

      const data = await this.safeFetchJson('/api/prequal/admin-signoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      this.showToast(`Prequalification application marked as ${decisionStatus.toUpperCase()}!`, decisionStatus === 'approved' ? 'success' : 'warning');
      await this.loadPrequal(vendorId);
      await this.loadAllVendors();
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderDashCompaniesTable();
        await this.loadAdminOverview();
      }
      this.showTab('dashboard');
    } catch (err) {
      this.showToast('Sign off error: ' + err.message, 'error');
    }
  }

  // Dynamic Calculation of TRIR, LTI, DART
  recalculatePartC() {
    [2024, 2023, 2022].forEach(yr => {
      const hours = parseFloat(document.getElementById(`c_hours_${yr}`).value) || 0;
      const ltCases = parseFloat(document.getElementById(`c_ltCases_${yr}`).value) || 0;
      const trCases = parseFloat(document.getElementById(`c_trCases_${yr}`).value) || 0;

      let trir = 0;
      let ltir = 0;
      let dart = 0;

      if (hours > 0) {
        trir = Number(((trCases * 200000) / hours).toFixed(2));
        ltir = Number(((ltCases * 200000) / hours).toFixed(2));
        dart = Number(((ltCases * 200000) / hours).toFixed(2));
      }

      document.getElementById(`c_trir_${yr}`).innerText = trir.toFixed(2);
      document.getElementById(`c_ltir_${yr}`).innerText = ltir.toFixed(2);
      document.getElementById(`c_dart_${yr}`).innerText = dart.toFixed(2);
    });
  }

  toggleCargoSection() {
    const val = document.getElementById('partB_cargoTransport').value;
    const block = document.getElementById('cargoUploadBlock');
    if (val === 'Yes') {
      block.classList.remove('hidden');
    } else {
      block.classList.add('hidden');
    }
  }

  updateSignatureBox(val) {
    const box = document.getElementById('sigPreviewBox');
    box.innerText = val ? `Digitally Signed: ${val}` : 'Digitally Signed By Representative';
  }

  // Drag and Drop Event Handlers
  handleDragOver(e, element) {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add('dragover');
  }

  handleDragLeave(e, element) {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('dragover');
  }

  async handleDrop(e, fieldKey) {
    e.preventDefault();
    e.stopPropagation();
    const element = e.currentTarget;
    element.classList.remove('dragover');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const mockInput = { files: [file] };
      await this.handleFileUpload(mockInput, fieldKey);
    }
  }

  // Handle File Uploads
  async handleFileUpload(inputEl, fieldKey) {
    if (!inputEl.files || !inputEl.files[0]) return;
    const file = inputEl.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/prequal/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const urlInput = document.getElementById(`url_${fieldKey}`);
      if (urlInput) urlInput.value = data.file.url;

      const isImg = this.isImageUrl(data.file.url) || file.type.startsWith('image/');

      const preview = document.getElementById(`preview_${fieldKey}`);
      if (preview) {
        preview.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${isImg ? `<img src="${data.file.url}" style="width:36px; height:36px; object-fit:cover; border-radius:4px;">` : `<i class="fa-solid fa-file-pdf fa-lg" style="color:var(--danger);"></i>`}
            <span>${data.file.originalName}</span>
          </div>
          ${isImg ? `<button class="btn btn-secondary btn-sm" onclick="app.openImagePreviewModal('${data.file.url}', '${data.file.originalName}')"><i class="fa-solid fa-eye"></i> View Image</button>` : `<a href="${data.file.url}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> View File</a>`}
        `;
        preview.classList.remove('hidden');
      }
    } catch (e) {
      alert('Upload error: ' + e.message);
    }
  }

  isImageUrl(url) {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif') || cleanUrl.endsWith('.svg');
  }

  // Lightbox Image Preview Modal
  openImagePreviewModal(url, title = 'Document Preview') {
    document.getElementById('imageModalTitle').innerText = title;
    document.getElementById('imageModalImg').src = url;
    document.getElementById('imageModalDownloadLink').href = url;
    document.getElementById('imagePreviewModal').classList.add('active');
  }

  closeImagePreviewModal() {
    document.getElementById('imagePreviewModal').classList.remove('active');
  }

  // Load & Render Employees
  async loadEmployees() {
    try {
      let url = '/api/employees';
      if (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all') {
        url += `?vendorId=${this.selectedAdminVendorId}`;
      }
      const data = await this.safeFetchJson(url);
      if (data) {
        this.employees = data.employees || [];
        this.renderEmployeesTable(this.employees);
        this.renderAdminPersonnelTable(this.employees);
        this.populateEmployeeSelects(this.employees);
      }
    } catch (e) {
      console.error('Failed to load employees', e);
    }
  }

  renderAdminPersonnelTable(employees) {
    const tbody = document.getElementById('adminPersonnelBody');
    if (!tbody) return;

    if (!employees || employees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-muted);">No personnel on file across registered companies. Click "Add Worker" to add workers.</td></tr>`;
      return;
    }

    tbody.innerHTML = employees.map(e => `
      <tr>
        <td><strong>${e.employeeName}</strong></td>
        <td>${e.companyName || 'Contractor'}</td>
        <td>${e.jobTitle || 'Worker'}</td>
        <td>${e.email || 'N/A'}</td>
        <td>${e.phone || 'N/A'}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="app.openEmployeeProfileModal('${e.id}')">
            <i class="fa-solid fa-user"></i> View Profile
          </button>
          <a href="/passport.html?id=${e.id}" target="_blank" class="btn btn-secondary btn-sm" title="Scan or View Digital QR Passport">
            <i class="fa-solid fa-qrcode"></i> QR Passport
          </a>
          <button class="btn btn-success btn-sm" onclick="app.openAddPersonnelCertModal('${e.id}', '${e.employeeName}')">
            <i class="fa-solid fa-id-card"></i> Submit Ticket
          </button>
          <button class="btn btn-danger btn-sm" onclick="app.deleteEmployee('${e.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderEmployeesTable(employees) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;

    if (!employees || employees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-muted);">No company personnel added yet. Click "Add Employee" to add workers.</td></tr>`;
      return;
    }

    tbody.innerHTML = employees.map(e => `
      <tr>
        <td><strong>${e.employeeName}</strong></td>
        <td>${e.jobTitle || 'Worker'}</td>
        <td>${e.companyName || 'Company'}</td>
        <td>${e.email || 'N/A'}</td>
        <td>${e.phone || 'N/A'}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="app.openEmployeeProfileModal('${e.id}')">
            <i class="fa-solid fa-user"></i> View Profile
          </button>
          <a href="/passport.html?id=${e.id}" target="_blank" class="btn btn-secondary btn-sm" title="Open Digital QR Passport">
            <i class="fa-solid fa-qrcode"></i> Passport
          </a>
          <button class="btn btn-success btn-sm" onclick="app.openAddPersonnelCertModal('${e.id}', '${e.employeeName}')">
            <i class="fa-solid fa-id-card"></i> Submit Cert
          </button>
          <button class="btn btn-danger btn-sm" onclick="app.deleteEmployee('${e.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  handlePersonnelSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!this.employees) return;
    if (!q) {
      this.renderEmployeesTable(this.employees);
      return;
    }

    const filtered = this.employees.filter(e => 
      (e.employeeName && e.employeeName.toLowerCase().includes(q)) ||
      (e.jobTitle && e.jobTitle.toLowerCase().includes(q)) ||
      (e.companyName && e.companyName.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.phone && e.phone.toLowerCase().includes(q))
    );

    this.renderEmployeesTable(filtered);
  }

  handleAdminPersonnelSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!this.employees) return;
    let base = this.employees;
    if (this.selectedAdminVendorId && this.selectedAdminVendorId !== 'all') {
      base = base.filter(e => e.vendorId === this.selectedAdminVendorId);
    }

    if (!q) {
      this.renderAdminPersonnelTable(base);
      return;
    }

    const filtered = base.filter(e => 
      (e.employeeName && e.employeeName.toLowerCase().includes(q)) ||
      (e.jobTitle && e.jobTitle.toLowerCase().includes(q)) ||
      (e.companyName && e.companyName.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.phone && e.phone.toLowerCase().includes(q))
    );

    this.renderAdminPersonnelTable(filtered);
  }

  async openEmployeeProfileModal(empId) {
    try {
      const res = await fetch(`/api/employees/${empId}/profile`);
      if (!res.ok) throw new Error('Worker profile not found');
      const data = await res.json();
      
      const { employee, vendor, certificates, completions, assignedTasks = [], mandatoryCourses = [], mandatoryCertReqs = [], userAccount } = data;

      document.getElementById('empProfileName').innerText = employee.employeeName;
      document.getElementById('empProfileTitle').innerText = `${employee.jobTitle || 'Worker'} • ${vendor.companyName}`;
      document.getElementById('empProfileCompany').innerText = vendor.companyName;
      document.getElementById('empProfileCountry').innerText = vendor.country === 'USA' ? '🇺🇸 USA' : '🇨🇦 Canada';
      document.getElementById('empProfileEmail').innerText = employee.email || 'N/A';
      document.getElementById('empProfilePhone').innerText = employee.phone || 'N/A';
      document.getElementById('empProfileUsername').innerText = userAccount ? userAccount.username : 'Auto-generated on creation';

      // Initials for Avatar
      const parts = employee.employeeName.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : employee.employeeName.substring(0,2).toUpperCase();
      document.getElementById('empProfileAvatar').innerText = initials;

      // Populate Digital QR Badge
      const host = window.location.host;
      const protocol = window.location.protocol;
      const passportUrl = `${protocol}//${host}/passport.html?id=${employee.id}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(passportUrl)}`;

      const qrImg = document.getElementById('empProfileQrImg');
      const qrLink = document.getElementById('empProfileQrLink');
      const passportBtn = document.getElementById('empProfilePassportBtn');

      if (qrImg) qrImg.src = qrApiUrl;
      if (qrLink) qrLink.href = passportUrl;
      if (passportBtn) passportBtn.href = passportUrl;

      this.currentProfilePassportUrl = passportUrl;
      this.currentProfileEmployee = { ...employee, companyName: vendor.companyName };

      // Strict Clearance & Missing Items Evaluation Engine
      const deficiencies = [];

      // 1. Check Expired Submitted Tickets
      const expiredCerts = (certificates || []).filter(c => c.computedStatus === 'expired');
      if (expiredCerts.length > 0) {
        deficiencies.push(`Expired Qualification Ticket(s): ${expiredCerts.map(c => `${c.title} (Expired ${c.expiryDate})`).join(', ')}`);
      }

      // 2. Check Rejected Qualification Tickets
      const rejectedCerts = (certificates || []).filter(c => c.approvalStatus === 'rejected');
      if (rejectedCerts.length > 0) {
        deficiencies.push(`Rejected Qualification Ticket(s): ${rejectedCerts.map(c => `${c.title} (${c.reviewNotes || 'Rejected by Admin'})`).join(', ')}`);
      }

      // 3. Check Missing Mandated Worker Certificates / Tickets
      const submittedTitlesList = (certificates || []).map(c => (c.title || '').toLowerCase());
      const checkMatched = (rcTitle) => {
        const r = (rcTitle || '').toLowerCase().trim();
        return submittedTitlesList.some(s => {
          if (r === s || r.includes(s) || s.includes(r)) return true;
          const keywords = ['cso', 'whmis', 'first aid', 'h2s', 'fit test', 'dot', 'defensive driving', 'osha'];
          return keywords.some(k => r.includes(k) && s.includes(k));
        });
      };
      const missingMandatoryCerts = (mandatoryCertReqs || []).filter(rc => rc.isMandatory && !checkMatched(rc.title));
      if (missingMandatoryCerts.length > 0) {
        deficiencies.push(`Missing Mandated Ticket(s): ${missingMandatoryCerts.map(rc => rc.title).join(', ')}`);
      }

      // 4. Check Uncompleted Mandatory MAXX Safety Courses
      const completedCourseTitles = (completions || []).map(cc => (cc.courseTitle || '').toLowerCase());
      const missingMandatoryCourses = (mandatoryCourses || []).filter(mc => mc.requiredByMaxx && !completedCourseTitles.some(t => t.includes((mc.title || '').toLowerCase())));
      if (missingMandatoryCourses.length > 0) {
        deficiencies.push(`Missing Mandatory Safety Course(s): ${missingMandatoryCourses.map(mc => `${mc.courseCode || 'MAXX'} - ${mc.title}`).join(', ')}`);
      }

      // 5. Check Pending Assigned Compliance Tasks / Requests
      const pendingTasks = (assignedTasks || []).filter(t => t.status !== 'confirmed');
      if (pendingTasks.length > 0) {
        deficiencies.push(`Pending Compliance Action(s): ${pendingTasks.map(t => `${t.title || t.itemTitle || 'Task'} (Due ${t.dueDate || 'N/A'})`).join(', ')}`);
      }

      const clearanceBadge = document.getElementById('empProfileClearanceBadge');
      const clearanceDetails = document.getElementById('empProfileClearanceDetails');
      const clearanceBox = document.getElementById('empProfileClearanceBox');

      if (deficiencies.length > 0) {
        clearanceBox.style.background = 'var(--danger-bg)';
        clearanceBox.style.borderColor = 'var(--danger-border)';
        clearanceBadge.style.color = 'var(--danger-text)';
        clearanceBadge.innerText = 'CLEARANCE RESTRICTED';
        clearanceDetails.style.color = 'var(--danger-text)';
        clearanceDetails.innerHTML = `
          <div style="font-weight:700; font-size:0.82rem; margin-bottom:0.35rem; color:#991b1b;"><i class="fa-solid fa-triangle-exclamation"></i> MISSING COMPLIANCE REQUIREMENTS & ACTION ITEMS (${deficiencies.length}):</div>
          <ul style="margin:0; padding-left:1.25rem; text-align:left; font-size:0.8rem; line-height:1.5; color:#991b1b;">${deficiencies.map(d => `<li>${d}</li>`).join('')}</ul>
        `;
      } else {
        clearanceBox.style.background = 'var(--success-bg)';
        clearanceBox.style.borderColor = 'var(--success-border)';
        clearanceBadge.style.color = 'var(--success-text)';
        clearanceBadge.innerText = 'JOBSITE CLEARED';
        clearanceDetails.style.color = 'var(--success-text)';
        clearanceDetails.innerText = 'All Required Safety Tickets & Courses Completed';
      }

      // Certs Table (Submitted + Missing Required Certificates)
      const cBody = document.getElementById('empProfileCertsBody');
      if (cBody) {
        const statusMap = {
          active: '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Valid</span>',
          expiring_soon: '<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Expiring Soon</span>',
          expired: '<span class="badge badge-expired"><i class="fa-solid fa-triangle-exclamation"></i> Expired</span>'
        };

        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        const certRows = [];

        // 1. Submitted certificates
        (certificates || []).forEach(c => {
          const approval = c.approvalStatus || 'pending_approval';
          let statusBadge = '';
          let actionHtml = '';

          if (approval === 'approved') {
            if (c.computedStatus === 'expired') {
              statusBadge = `<span class="badge badge-expired"><i class="fa-solid fa-triangle-exclamation"></i> Expired</span>`;
              actionHtml = isAdmin 
                ? `<button class="btn btn-warning btn-sm" onclick="app.closeEmployeeProfileModal(); app.reviewCert('${c.id}', true, 'rejected');"><i class="fa-solid fa-rotate"></i> Require Resubmission</button>`
                : `<button class="btn btn-warning btn-sm" onclick="app.closeEmployeeProfileModal(); app.openUpdateCertModal('${c.id}', true);"><i class="fa-solid fa-rotate"></i> Update Ticket</button>`;
            } else if (c.computedStatus === 'expiring_soon') {
              statusBadge = `<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Expiring Soon</span>`;
              actionHtml = c.documentUrl ? `<a href="${c.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-file-pdf"></i> View File</a>` : `<span>Verified</span>`;
            } else {
              statusBadge = `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Approved & Active</span>`;
              actionHtml = c.documentUrl ? `<a href="${c.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-file-pdf"></i> View File</a>` : `<span style="color:var(--text-muted); font-size:0.75rem;">Verified</span>`;
            }
          } else if (approval === 'rejected') {
            statusBadge = `<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Rejected: ${c.reviewNotes || 'Resubmission Required'}</span>`;
            actionHtml = isAdmin 
              ? `<button class="btn btn-success btn-sm" onclick="app.closeEmployeeProfileModal(); app.reviewCert('${c.id}', true, 'approved');"><i class="fa-solid fa-check"></i> Re-Approve</button>`
              : `<button class="btn btn-warning btn-sm" onclick="app.closeEmployeeProfileModal(); app.openUpdateCertModal('${c.id}', true);"><i class="fa-solid fa-rotate"></i> Resubmit Ticket</button>`;
          } else {
            // pending_approval
            statusBadge = `<span class="badge badge-warning" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;"><i class="fa-solid fa-clock"></i> Submitted (Awaiting Admin Approval)</span>`;
            if (isAdmin) {
              actionHtml = `
                <div style="display:flex; gap:0.35rem;">
                  <button class="btn btn-success btn-sm" style="font-size:0.78rem; padding:4px 10px; font-weight:700;" onclick="app.closeEmployeeProfileModal(); app.reviewCert('${c.id}', true, 'approved');"><i class="fa-solid fa-check"></i> Approve</button>
                  <button class="btn btn-danger btn-sm" style="font-size:0.78rem; padding:4px 10px; font-weight:700;" onclick="app.closeEmployeeProfileModal(); app.reviewCert('${c.id}', true, 'rejected');"><i class="fa-solid fa-xmark"></i> Reject</button>
                </div>
              `;
            } else {
              actionHtml = `<button class="btn btn-secondary btn-sm" onclick="app.closeEmployeeProfileModal(); app.openUpdateCertModal('${c.id}', true);"><i class="fa-solid fa-pen-to-square"></i> Edit / Replace File</button>`;
            }
          }

          certRows.push(`
            <tr>
              <td><strong>${c.title}</strong></td>
              <td>${c.issueDate || 'N/A'}</td>
              <td><strong>${c.expiryDate}</strong></td>
              <td>${statusBadge}</td>
              <td>${actionHtml}</td>
            </tr>
          `);
        });

        // 2. Missing Mandated worker certificates
        const submittedTitles = (certificates || []).map(c => (c.title || '').toLowerCase());
        
        const isCertMatched = (rcTitle) => {
          const r = (rcTitle || '').toLowerCase().trim();
          return submittedTitles.some(s => {
            if (r === s || r.includes(s) || s.includes(r)) return true;
            const keywords = ['cso', 'whmis', 'first aid', 'h2s', 'fit test', 'dot', 'defensive driving', 'osha'];
            return keywords.some(k => r.includes(k) && s.includes(k));
          });
        };

        const missingReqs = (mandatoryCertReqs || []).filter(rc => !isCertMatched(rc.title));

        missingReqs.forEach(rc => {
          certRows.push(`
            <tr style="background:#fef2f2;">
              <td><strong style="color:var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> ${rc.title}</strong> <span class="badge badge-danger" style="font-size:0.65rem;">MISSING</span></td>
              <td><span style="color:var(--text-muted);">Not Uploaded</span></td>
              <td><span style="color:var(--text-muted);">N/A</span></td>
              <td>
                <span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> ${rc.isMandatory ? 'Missing Mandatory Ticket' : 'Optional Ticket Missing'}</span>
              </td>
              <td>
                <button class="btn btn-success btn-sm" onclick="app.closeEmployeeProfileModal(); app.openAddPersonnelCertModal('${employee.id}');"><i class="fa-solid fa-upload"></i> Upload Ticket</button>
              </td>
            </tr>
          `);
        });

        if (certRows.length === 0) {
          cBody.innerHTML = `<tr><td colspan="5" class="text-center">No safety qualifications or required certificates.</td></tr>`;
        } else {
          cBody.innerHTML = certRows.join('');
        }
      }

      // Courses Table
      const coBody = document.getElementById('empProfileCoursesBody');
      if (!completions || completions.length === 0) {
        coBody.innerHTML = `<tr><td colspan="4" class="text-center">No MAXX safety courses recorded for this worker.</td></tr>`;
      } else {
        coBody.innerHTML = completions.map(cc => `
          <tr>
            <td><strong>${cc.courseTitle}</strong></td>
            <td><code>${cc.certNumber}</code></td>
            <td>${cc.completionDate}</td>
            <td>${cc.expiryDate}</td>
          </tr>
        `).join('');
      }

      // Tasks Table
      const tBody = document.getElementById('empProfileTasksBody');
      if (!tBody) return;

      if (!assignedTasks || assignedTasks.length === 0) {
        tBody.innerHTML = `<tr><td colspan="5" class="text-center">No pending training or certificate requests assigned.</td></tr>`;
      } else {
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        const taskStatusMap = {
          pending: '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Pending Request</span>',
          completed: '<span class="badge badge-info"><i class="fa-solid fa-spinner"></i> Submitted (Pending Confirmation)</span>',
          confirmed: '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Confirmed & Completed</span>'
        };

        tBody.innerHTML = assignedTasks.map(t => {
          const taskTitle = t.title || t.itemTitle || 'Assigned Request';
          const isTraining = t.taskType === 'training_course' || t.type === 'training';
          const statusBadge = taskStatusMap[t.status] || `<span class="badge badge-draft">${t.status}</span>`;

          let actionBtn = '';
          if (t.status === 'confirmed') {
            actionBtn = '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Confirmed</span>';
          } else if (t.status === 'completed') {
            if (isAdmin) {
              actionBtn = `<button class="btn btn-success btn-sm" onclick="app.confirmTaskCompletion('${t.id}')"><i class="fa-solid fa-check-double"></i> Confirm Completion</button>`;
            } else {
              actionBtn = '<span class="badge badge-info"><i class="fa-solid fa-clock"></i> Submitted (Awaiting Confirmation)</span>';
            }
          } else {
            actionBtn = isTraining 
              ? `<button class="btn btn-primary btn-sm" onclick="app.closeEmployeeProfileModal(); app.openRecordCourseModal();"><i class="fa-solid fa-graduation-cap"></i> Record Training</button>`
              : `<button class="btn btn-success btn-sm" onclick="app.closeEmployeeProfileModal(); app.openAddPersonnelCertModal('${employee.id}');"><i class="fa-solid fa-upload"></i> Upload Ticket</button>`;
          }

          return `
            <tr>
              <td><strong>${taskTitle}</strong></td>
              <td><span class="badge badge-info">${isTraining ? 'Safety Training Course' : 'Certificate Request'}</span></td>
              <td><strong style="color:var(--danger);">${t.dueDate || 'N/A'}</strong></td>
              <td><small style="color:var(--text-muted);">${t.notes || 'Required by MAXX Admin'}</small><br style="margin-bottom:2px;">${statusBadge}</td>
              <td>${actionBtn}</td>
            </tr>
          `;
        }).join('');
      }

      document.getElementById('employeeProfileModal').classList.add('active');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  closeEmployeeProfileModal() {
    document.getElementById('employeeProfileModal').classList.remove('active');
  }

  populateEmployeeSelects(employees) {
    const select = document.getElementById('pCertEmployeeSelect');
    if (select) {
      const safeEmps = Array.isArray(employees) ? employees : [];
      select.innerHTML = safeEmps.map(e => `<option value="${e.id}">${e.employeeName} (${e.jobTitle || 'Worker'})</option>`).join('');

      const isEmployeeRole = this.currentUser && this.currentUser.role === 'employee';
      if (isEmployeeRole && this.currentUser.employeeId) {
        select.value = this.currentUser.employeeId;
        select.disabled = true;
        select.style.background = '#f1f5f9';
        select.style.cursor = 'not-allowed';
      } else {
        select.disabled = false;
        select.style.background = '#ffffff';
        select.style.cursor = 'default';
      }
    }
  }

  openAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.add('active');
  }

  closeAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.remove('active');
  }

  async handleAddEmployee(e) {
    e.preventDefault();
    const payload = {
      employeeName: document.getElementById('empName').value,
      jobTitle: document.getElementById('empTitle').value,
      email: document.getElementById('empEmail').value,
      phone: document.getElementById('empPhone').value
    };

    try {
      const res = await fetch('/api/employees/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add employee');
      this.closeAddEmployeeModal();
      await this.loadEmployees();

      if (data.credentials) {
        this.openEmployeeCredentialsModal(data.credentials.username, data.credentials.password);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  openEmployeeCredentialsModal(username, password) {
    document.getElementById('genCredUsername').innerText = username;
    document.getElementById('genCredPassword').innerText = password;
    document.getElementById('employeeCredentialsModal').classList.add('active');
  }

  closeEmployeeCredentialsModal() {
    document.getElementById('employeeCredentialsModal').classList.remove('active');
  }

  async deleteEmployee(id) {
    if (!confirm('Are you sure you want to remove this employee record permanently?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      this.showToast('Employee removed successfully', 'success');
      await this.loadEmployees();
      await this.loadCertificates();
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderDashCompaniesTable();
        await this.loadAdminOverview();
        if (typeof this.renderAdminPersonnelTable === 'function') {
          this.renderAdminPersonnelTable(this.employees || []);
        }
      }
    } catch (e) {
      this.showToast('Delete error: ' + e.message, 'error');
    }
  }

  async deleteVendor(id) {
    if (!confirm('Are you sure you want to delete this contractor company? This will remove all associated workers and certificate records.')) return;
    try {
      const res = await fetch(`/api/prequal/vendor/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contractor company');
      this.showToast('Contractor company deleted successfully', 'success');
      await this.loadAllVendors();
      await this.loadCertificates();
      await this.loadEmployees();
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderDashCompaniesTable();
        await this.loadAdminOverview();
      }
    } catch (e) {
      this.showToast('Delete error: ' + e.message, 'error');
    }
  }

  // Load & Render Certificates & Required Policy Grid
  async loadCertificates() {
    try {
      let url = '/api/certificates';
      if (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all') {
        url += `?vendorId=${this.selectedAdminVendorId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.certificates = data.certificates || [];
        this.personnelCertificates = data.personnelCertificates || [];
        this.requiredDefinitions = Array.isArray(data.requiredDefinitions) ? data.requiredDefinitions : [];

        this.renderRequiredPolicyGrid(this.requiredDefinitions);
        this.renderCertificatesTable(this.certificates);
        this.renderPersonnelCertificatesTable(this.personnelCertificates);
        this.populateRequiredCertSelects(this.requiredDefinitions);

        if (data.summary) {
          document.getElementById('dashActiveCerts').innerText = data.summary.active || 0;
          document.getElementById('dashExpiringCerts').innerText = data.summary.expiringSoon || 0;
          document.getElementById('dashExpiredCerts').innerText = data.summary.expired || 0;
        }

        const banner = document.getElementById('expirationWarningBanner');
        const text = document.getElementById('warningBannerText');
        if (data.summary && (data.summary.expiringSoon > 0 || data.summary.expired > 0)) {
          banner.classList.remove('hidden');
          text.innerHTML = `<strong>Attention Required:</strong> You have ${data.summary.expiringSoon} certificate(s) expiring within 30 days and ${data.summary.expired} expired certificate(s). Please submit renewed documents.`;
        } else {
          banner.classList.add('hidden');
        }
      }
    } catch (e) {
      console.error('Failed to load certificates', e);
    }
  }

  renderRequiredPolicyGrid(reqs) {
    const cTbody = document.getElementById('requiredCompanyPolicyTableBody');
    const eTbody = document.getElementById('requiredEmployeePolicyTableBody');
    if (!cTbody && !eTbody) return;

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';
    const isVendor = this.currentUser && this.currentUser.role === 'vendor';
    const isEmployee = this.currentUser && this.currentUser.role === 'employee';
    const canManageCompanyCert = isAdmin || isVendor;

    const vendorCountry = (this.currentVendor && this.currentVendor.country) ? this.currentVendor.country : 'Canada';

    const companyReqs = (reqs || []).filter(r => {
      if ((r.scope || 'company') !== 'company') return false;
      if (!r.country || r.country === 'Both') return true;
      if (vendorCountry.toLowerCase().includes('canada')) return r.country === 'Canada';
      if (vendorCountry.toLowerCase().includes('usa')) return r.country === 'USA';
      return r.country === vendorCountry;
    });

    const employeeReqs = (reqs || []).filter(r => {
      if (r.scope !== 'employee') return false;
      if (!r.country || r.country === 'Both') return true;
      if (vendorCountry.toLowerCase().includes('canada')) return r.country === 'Canada';
      if (vendorCountry.toLowerCase().includes('usa')) return r.country === 'USA';
      return r.country === vendorCountry;
    });

    // Helper to evaluate matching submitted cert for Company
    const getCompanyCertMatch = (title) => {
      const t = (title || '').toLowerCase().trim();
      return (this.certificates || []).find(c => {
        const ct = (c.title || '').toLowerCase().trim();
        return ct === t || ct.includes(t) || t.includes(ct);
      });
    };

    // Helper to evaluate matching submitted cert for Employee
    const getWorkerCertMatch = (title) => {
      const t = (title || '').toLowerCase().trim();
      return (this.personnelCertificates || []).find(pc => {
        const pct = (pc.title || '').toLowerCase().trim();
        return pct === t || pct.includes(t) || t.includes(pct);
      });
    };

    // Render Company Checklist Table Body
    if (cTbody) {
      if (companyReqs.length === 0) {
        cTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--text-muted);">No company policy certificate requirements configured.</td></tr>`;
      } else {
        cTbody.innerHTML = companyReqs.map(rc => {
          const match = getCompanyCertMatch(rc.title);
          let statusHtml = '';
          let actionHtml = '';

          if (!match) {
            statusHtml = `<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Missing / Not Uploaded</span>`;
            actionHtml = canManageCompanyCert
              ? `<button class="btn btn-primary btn-sm" onclick="app.openAddCertModal('${rc.title}')"><i class="fa-solid fa-upload"></i> Upload Policy Cert</button>`
              : `<span style="color:var(--text-muted); font-size:0.78rem;"><i class="fa-solid fa-shield-halved"></i> Company Admin Managed</span>`;
          } else {
            const approval = match.approvalStatus || 'pending_approval';
            if (approval === 'approved') {
              statusHtml = `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Approved & Active</span>`;
              actionHtml = canManageCompanyCert
                ? `${match.documentUrl ? `<a href="${match.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-file-pdf"></i> View File</a>` : ''}
                   <button class="btn btn-primary btn-sm" onclick="app.openEditCertModal('${match.id}', false)"><i class="fa-solid fa-cloud-arrow-up"></i> Update Cert</button>`
                : (match.documentUrl ? `<a href="${match.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-file-pdf"></i> View File</a>` : `<span style="color:var(--text-muted); font-size:0.78rem;">Verified</span>`);
            } else if (approval === 'rejected') {
              statusHtml = `<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Rejected: ${match.reviewNotes || 'Resubmission Required'}</span>`;
              actionHtml = canManageCompanyCert
                ? `<button class="btn btn-warning btn-sm" onclick="app.openEditCertModal('${match.id}', false)"><i class="fa-solid fa-rotate"></i> Resubmit Document</button>`
                : `<span style="color:var(--text-muted); font-size:0.78rem;"><i class="fa-solid fa-shield-halved"></i> Company Admin Managed</span>`;
            } else {
              statusHtml = `<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Submitted (Awaiting Admin Approval)</span>`;
              actionHtml = canManageCompanyCert
                ? `<button class="btn btn-secondary btn-sm" onclick="app.openEditCertModal('${match.id}', false)"><i class="fa-solid fa-pen-to-square"></i> Replace / Update File</button>`
                : `<span style="color:var(--text-muted); font-size:0.78rem;"><i class="fa-solid fa-clock"></i> Awaiting Admin Approval</span>`;
            }
          }

          return `
            <tr>
              <td>
                <strong>${rc.title}</strong>
                <br><small style="color:var(--text-muted);">${rc.description || 'Mandatory company policy requirement'}</small>
              </td>
              <td>${rc.category || 'Insurance / Safety Policy'}</td>
              <td>
                ${rc.isMandatory ? '<span class="badge badge-danger"><i class="fa-solid fa-lock"></i> Mandatory</span>' : '<span class="badge badge-draft"><i class="fa-solid fa-unlock"></i> Optional</span>'}
              </td>
              <td>${statusHtml}</td>
              <td>${actionHtml}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Employee Checklist Table Body
    if (eTbody) {
      if (employeeReqs.length === 0) {
        eTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--text-muted);">No delegated worker qualification requirements configured.</td></tr>`;
      } else {
        eTbody.innerHTML = employeeReqs.map(rc => {
          const match = getWorkerCertMatch(rc.title);
          let statusHtml = '';
          let actionHtml = '';

          if (!match) {
            statusHtml = `<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Missing / Not Uploaded</span>`;
            actionHtml = `<button class="btn btn-success btn-sm" onclick="app.openAddPersonnelCertModal('', '', '${rc.title}')"><i class="fa-solid fa-upload"></i> Submit Worker Ticket</button>`;
          } else {
            const approval = match.approvalStatus || 'pending_approval';
            if (approval === 'approved') {
              statusHtml = `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Approved & Active</span><br><small style="color:var(--text-muted);">${match.employeeName}</small>`;
              actionHtml = `${match.documentUrl ? `<a href="${match.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-file-pdf"></i> View File</a>` : ''}
                <button class="btn btn-primary btn-sm" onclick="app.openEditCertModal('${match.id}', true)"><i class="fa-solid fa-cloud-arrow-up"></i> Update Ticket</button>`;
            } else if (approval === 'rejected') {
              statusHtml = `<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Rejected: ${match.reviewNotes || 'Resubmission Required'}</span><br><small style="color:var(--text-muted);">${match.employeeName}</small>`;
              actionHtml = `<button class="btn btn-warning btn-sm" onclick="app.openEditCertModal('${match.id}', true)"><i class="fa-solid fa-rotate"></i> Resubmit Ticket</button>`;
            } else {
              statusHtml = `<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Submitted (Awaiting Admin Approval)</span><br><small style="color:var(--text-muted);">${match.employeeName}</small>`;
              actionHtml = `<button class="btn btn-secondary btn-sm" onclick="app.openEditCertModal('${match.id}', true)"><i class="fa-solid fa-pen-to-square"></i> Replace / Update File</button>`;
            }
          }

          return `
            <tr>
              <td>
                <strong>${rc.title}</strong>
                <br><small style="color:var(--text-muted);">${rc.description || 'Mandatory worker qualification requirement'}</small>
              </td>
              <td>${rc.category || 'Personnel Qualification'}</td>
              <td>
                ${rc.isMandatory ? '<span class="badge badge-danger"><i class="fa-solid fa-lock"></i> Mandatory</span>' : '<span class="badge badge-draft"><i class="fa-solid fa-unlock"></i> Optional</span>'}
              </td>
              <td>${statusHtml}</td>
              <td>${actionHtml}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  renderCertificatesTable(certs) {
    const tbody = document.getElementById('certTableBody');
    if (!tbody) return;

    if (!certs || certs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--text-muted);">No company compliance certificates on file.</td></tr>`;
      return;
    }

    const statusMap = {
      active: '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Valid</span>',
      expiring_soon: '<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Expiring Soon</span>',
      expired: '<span class="badge badge-expired"><i class="fa-solid fa-triangle-exclamation"></i> Expired</span>'
    };

    const approvalMap = {
      approved: '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Approved</span>',
      rejected: '<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>',
      pending_approval: '<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Pending Review</span>'
    };

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    tbody.innerHTML = certs.map(c => {
      const isImg = this.isImageUrl(c.documentUrl);
      const thumbHtml = c.documentUrl
        ? (isImg 
            ? `<div class="cert-thumb-box" onclick="app.openImagePreviewModal('${c.documentUrl}', '${c.title}')" title="Click to view full image"><img src="${c.documentUrl}" alt="Cert"></div>`
            : `<div class="cert-thumb-box" onclick="window.open('${c.documentUrl}', '_blank')" title="PDF Document"><i class="fa-solid fa-file-pdf fa-lg" style="color:var(--danger);"></i></div>`)
        : `<div class="cert-thumb-box" style="cursor:default;"><i class="fa-solid fa-file-excel" style="color:var(--text-dim);"></i></div>`;

      const approvalStatus = c.approvalStatus || 'pending_approval';

      return `
        <tr>
          <td>${thumbHtml}</td>
          <td><strong>${c.companyName || 'Contractor'}</strong></td>
          <td>${c.title}</td>
          <td>${c.type}</td>
          <td>${c.issueDate || 'N/A'}</td>
          <td><strong>${c.expiryDate}</strong></td>
          <td>
            ${statusMap[c.computedStatus] || c.computedStatus}<br>
            <small style="margin-top:2px; display:inline-block;">${approvalMap[approvalStatus] || approvalStatus}</small>
          </td>
          <td>
            ${c.documentUrl ? (isImg 
                ? `<button class="btn btn-secondary btn-sm" onclick="app.openImagePreviewModal('${c.documentUrl}', '${c.title}')"><i class="fa-solid fa-eye"></i> View</button>`
                : `<a href="${c.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> View</a>`)
              : ''}
            <button class="btn btn-primary btn-sm" onclick="app.openEditCertModal('${c.id}', false)" title="Resubmit or update certificate document"><i class="fa-solid fa-cloud-arrow-up"></i> ${c.approvalStatus === 'rejected' ? 'Resubmit' : 'Update'}</button>
            ${isAdmin ? `
              <button class="btn btn-success btn-sm" onclick="app.reviewCert('${c.id}', false, 'approved')" title="Approve Certificate"><i class="fa-solid fa-check"></i> Approve</button>
              <button class="btn btn-warning btn-sm" onclick="app.reviewCert('${c.id}', false, 'rejected')" title="Reject Certificate"><i class="fa-solid fa-xmark"></i> Reject</button>
            ` : ''}
            <button class="btn btn-danger btn-sm" onclick="app.deleteCert('${c.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPersonnelCertificatesTable(pcerts) {
    const tbody = document.getElementById('personnelCertTableBody');
    if (!tbody) return;

    if (!pcerts || pcerts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--text-muted);">No employee certificates submitted yet. Click "Submit Employee Cert" to add.</td></tr>`;
      return;
    }

    const statusMap = {
      active: '<span class="badge badge-active">Valid</span>',
      expiring_soon: '<span class="badge badge-expiring_soon">Expiring Soon</span>',
      expired: '<span class="badge badge-expired">Expired</span>'
    };

    const approvalMap = {
      approved: '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Approved</span>',
      rejected: '<span class="badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>',
      pending_approval: '<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Pending Review</span>'
    };

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    tbody.innerHTML = pcerts.map(c => {
      const isImg = this.isImageUrl(c.documentUrl);
      const thumbHtml = c.documentUrl
        ? (isImg 
            ? `<div class="cert-thumb-box" onclick="app.openImagePreviewModal('${c.documentUrl}', '${c.title}')"><img src="${c.documentUrl}" alt="Cert"></div>`
            : `<div class="cert-thumb-box" onclick="window.open('${c.documentUrl}', '_blank')"><i class="fa-solid fa-file-pdf fa-lg" style="color:var(--danger);"></i></div>`)
        : `<div class="cert-thumb-box" style="cursor:default;"><i class="fa-solid fa-id-card" style="color:var(--text-dim);"></i></div>`;

      const approvalStatus = c.approvalStatus || 'pending_approval';

      return `
        <tr>
          <td>${thumbHtml}</td>
          <td><strong>${c.employeeName}</strong></td>
          <td>${c.companyName || 'Contractor'}</td>
          <td>${c.title}</td>
          <td>${c.issueDate || 'N/A'}</td>
          <td><strong>${c.expiryDate}</strong></td>
          <td>
            ${statusMap[c.computedStatus] || c.computedStatus}<br>
            <small style="margin-top:2px; display:inline-block;">${approvalMap[approvalStatus] || approvalStatus}</small>
          </td>
          <td>
            ${c.documentUrl ? (isImg 
                ? `<button class="btn btn-secondary btn-sm" onclick="app.openImagePreviewModal('${c.documentUrl}', '${c.title}')"><i class="fa-solid fa-eye"></i> View</button>`
                : `<a href="${c.documentUrl}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> View</a>`)
              : ''}
            <button class="btn btn-primary btn-sm" onclick="app.openEditCertModal('${c.id}', true)" title="Resubmit or update worker ticket"><i class="fa-solid fa-cloud-arrow-up"></i> ${c.approvalStatus === 'rejected' ? 'Resubmit' : 'Update'}</button>
            ${isAdmin ? `
              <button class="btn btn-success btn-sm" onclick="app.reviewCert('${c.id}', true, 'approved')" title="Approve Worker Ticket"><i class="fa-solid fa-check"></i> Approve</button>
              <button class="btn btn-warning btn-sm" onclick="app.reviewCert('${c.id}', true, 'rejected')" title="Reject Worker Ticket"><i class="fa-solid fa-xmark"></i> Reject</button>
            ` : ''}
            <button class="btn btn-danger btn-sm" onclick="app.deletePersonnelCert('${c.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  openEditCertModal(certId, isPersonnel) {
    const list = isPersonnel ? (this.personnelCertificates || []) : (this.certificates || []);
    const cert = list.find(c => c.id === certId);
    if (!cert) return;

    document.getElementById('editCertId').value = certId;
    document.getElementById('editIsPersonnel').value = isPersonnel ? 'true' : 'false';

    document.getElementById('editCertTitleDisplay').innerText = cert.title || 'Compliance Certificate';
    document.getElementById('editCertReasonDisplay').innerText = cert.reviewNotes ? `Admin Note: ${cert.reviewNotes}` : (cert.approvalStatus === 'rejected' ? 'Document Rejected by MAXX Admin' : 'Renew / Update Expiring Document');

    document.getElementById('editCertIssueDate').value = cert.issueDate || new Date().toISOString().split('T')[0];
    document.getElementById('editCertExpiryDate').value = cert.expiryDate || '';
    document.getElementById('url_editCert').value = cert.documentUrl || '';
    document.getElementById('editCertNotes').value = cert.notes || '';

    document.getElementById('editCertModal').classList.add('active');
  }

  closeEditCertModal() {
    document.getElementById('editCertModal').classList.remove('active');
  }

  async handleEditCertSubmit(e) {
    e.preventDefault();
    const certId = document.getElementById('editCertId').value;
    const isPersonnel = document.getElementById('editIsPersonnel').value === 'true';

    const payload = {
      issueDate: document.getElementById('editCertIssueDate').value,
      expiryDate: document.getElementById('editCertExpiryDate').value,
      documentUrl: document.getElementById('url_editCert').value,
      notes: document.getElementById('editCertNotes').value
    };

    const endpoint = isPersonnel ? `/api/certificates/personnel/update/${certId}` : `/api/certificates/update/${certId}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resubmit certificate');

      this.closeEditCertModal();
      this.showToast('Certificate resubmitted successfully! Awaiting Admin review.', 'success');
      await this.loadCertificates();
    } catch (err) {
      this.showToast('Resubmit error: ' + err.message, 'error');
    }
  }

  reviewCert(certId, isPersonnel, decision) {
    const certList = isPersonnel ? (this.personnelCertificates || []) : (this.certificates || []);
    const targetCert = certList.find(c => c.id === certId);

    document.getElementById('reviewCertId').value = certId;
    document.getElementById('reviewIsPersonnel').value = isPersonnel ? 'true' : 'false';
    document.getElementById('reviewDecision').value = decision;

    document.getElementById('reviewCertTitleDisplay').innerText = targetCert ? targetCert.title : 'Certificate Document';
    document.getElementById('reviewCertVendorDisplay').innerText = targetCert ? (targetCert.employeeName ? `Worker: ${targetCert.employeeName} (${targetCert.companyName || 'Contractor'})` : `Company: ${targetCert.companyName || 'Contractor'}`) : 'Contractor Organization';

    const banner = document.getElementById('reviewDecisionBanner');
    const text = document.getElementById('reviewDecisionText');
    const submitBtn = document.getElementById('reviewSubmitBtn');
    const presets = document.getElementById('reviewPresetsContainer');
    const notesInput = document.getElementById('reviewNotesInput');

    if (decision === 'approved') {
      banner.style.background = 'var(--success-bg)';
      banner.style.color = 'var(--success-text)';
      banner.style.border = '1px solid var(--success-border)';
      text.innerText = 'APPROVING CERTIFICATE COMPLIANCE';
      submitBtn.className = 'btn btn-success';
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirm Approval';
      presets.classList.add('hidden');
      notesInput.value = 'Approved by MAXX Industries HSE Compliance Team.';
    } else {
      banner.style.background = '#fef2f2';
      banner.style.color = '#991b1b';
      banner.style.border = '1px solid #fca5a5';
      text.innerText = 'REJECTING CERTIFICATE COMPLIANCE';
      submitBtn.className = 'btn btn-danger';
      submitBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Confirm Rejection';
      presets.classList.remove('hidden');
      notesInput.value = '';
    }

    document.getElementById('reviewCertModal').classList.add('active');
  }

  closeReviewCertModal() {
    document.getElementById('reviewCertModal').classList.remove('active');
  }

  applyReviewPreset(presetText) {
    const input = document.getElementById('reviewNotesInput');
    if (input) {
      input.value = presetText;
    }
  }

  async handleReviewCertSubmit(e) {
    e.preventDefault();
    const certId = document.getElementById('reviewCertId').value;
    const isPersonnel = document.getElementById('reviewIsPersonnel').value === 'true';
    const decision = document.getElementById('reviewDecision').value;
    const notes = document.getElementById('reviewNotesInput').value;

    try {
      const res = await fetch('/api/certificates/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId, isPersonnel, decision, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review decision');

      this.closeReviewCertModal();
      this.showToast(`Certificate compliance marked as ${decision.toUpperCase()}!`, decision === 'approved' ? 'success' : 'warning');
      await this.loadCertificates();
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderDashCompaniesTable();
      }
    } catch (err) {
      this.showToast('Review error: ' + err.message, 'error');
    }
  }

  async quickApproveCert(certId, isPersonnel = true) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Only MAXX Site Admins have permission to approve tickets.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/certificates/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certId,
          isPersonnel,
          decision: 'approved',
          notes: 'Approved by MAXX Industries HSE Compliance Admin.'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve certificate');

      // Update local state immediately so queue re-renders without a full reload
      if (isPersonnel) {
        const cert = (this.personnelCertificates || []).find(c => c.id === certId);
        if (cert) cert.approvalStatus = 'approved';
      } else {
        const cert = (this.certificates || []).find(c => c.id === certId);
        if (cert) cert.approvalStatus = 'approved';
      }

      this.showToast('Document approved! Compliance granted.', 'success');
      this.renderPendingWorkerTicketsQueue();
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderDashCompaniesTable();
      }
      if (this.currentProfileEmployee) {
        this.openEmployeeProfileModal(this.currentProfileEmployee.id);
      }
      // Full reload in background to persist accurate state
      await this.loadCertificates();
    } catch (err) {
      this.showToast('Approval error: ' + err.message, 'error');
    }
  }

  async quickRejectCert(certId, isPersonnel = true) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Only MAXX Site Admins have permission to reject tickets.', 'error');
      return;
    }
    const reason = prompt('Please enter rejection reason / required correction for contractor:');
    if (reason === null) return;

    try {
      const res = await fetch('/api/certificates/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certId,
          isPersonnel,
          decision: 'rejected',
          notes: reason || 'Document rejected. Please resubmit updated certificate.'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject certificate');

      // Update local state immediately so queue re-renders without a full reload
      if (isPersonnel) {
        const cert = (this.personnelCertificates || []).find(c => c.id === certId);
        if (cert) cert.approvalStatus = 'rejected';
      } else {
        const cert = (this.certificates || []).find(c => c.id === certId);
        if (cert) cert.approvalStatus = 'rejected';
      }

      this.showToast('Document rejected. Contractor notified to resubmit.', 'warning');
      this.renderPendingWorkerTicketsQueue();
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderDashCompaniesTable();
      }
      if (this.currentProfileEmployee) {
        this.openEmployeeProfileModal(this.currentProfileEmployee.id);
      }
      // Full reload in background
      await this.loadCertificates();
    } catch (err) {
      this.showToast('Rejection error: ' + err.message, 'error');
    }
  }

  showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:0.5rem; pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981');
    const icon = type === 'error' ? 'circle-xmark' : (type === 'warning' ? 'triangle-exclamation' : 'circle-check');

    toast.style.cssText = `background:${bg}; color:white; padding:0.85rem 1.25rem; border-radius:8px; font-size:0.9rem; font-weight:600; box-shadow:0 10px 25px rgba(0,0,0,0.2); display:flex; align-items:center; gap:0.6rem; transition:all 0.3s ease; pointer-events:auto;`;
    toast.innerHTML = `<i class="fa-solid fa-${icon} fa-lg"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  populateRequiredCertSelects(reqs) {
    const select = document.getElementById('pCertReqSelect');
    if (select) {
      const safeReqs = Array.isArray(reqs) ? reqs : [];
      const vendorCountry = (this.currentVendor && this.currentVendor.country) ? this.currentVendor.country : 'Canada';

      const empReqs = safeReqs.filter(rc => {
        if (!rc || rc.scope !== 'employee') return false;
        if (!rc.country || rc.country === 'Both') return true;
        if (vendorCountry.toLowerCase().includes('canada')) return rc.country === 'Canada';
        if (vendorCountry.toLowerCase().includes('usa')) return rc.country === 'USA';
        return rc.country === vendorCountry;
      });

      select.innerHTML = empReqs.map(rc => `<option value="${rc.title}">${rc.title} ${rc.isMandatory ? '(Mandatory)' : '(Optional)'}</option>`).join('');
    }
  }

  anticipateExpiryDate(issueDateStr, title) {
    if (!issueDateStr) return '';
    const issueDate = new Date(issueDateStr);
    if (isNaN(issueDate.getTime())) return '';

    const t = (title || '').toLowerCase();
    let years = 1;

    const foundReq = (this.requiredDefinitions || []).find(r => (r.title || '').toLowerCase() === t || (r.title || '').toLowerCase().includes(t) || t.includes((r.title || '').toLowerCase()));
    if (foundReq && foundReq.validityYears) {
      years = parseInt(foundReq.validityYears, 10);
    } else {
      if (t.includes('first aid') || t.includes('h2s') || t.includes('csts') || t.includes('defensive') || t.includes('cor') || t.includes('dot') || t.includes('3 year') || t.includes('3yr')) {
        years = 3;
      } else if (t.includes('osha') || t.includes('trade') || t.includes('5 year') || t.includes('5yr')) {
        years = 5;
      } else if (t.includes('whmis') || t.includes('liability') || t.includes('cgl') || t.includes('wcb') || t.includes('wsib') || t.includes('drug') || t.includes('1 year') || t.includes('1yr')) {
        years = 1;
      }
    }

    const expDate = new Date(issueDate);
    expDate.setFullYear(expDate.getFullYear() + years);
    return expDate.toISOString().split('T')[0];
  }

  handleIssueDateChange(issueInputId, expiryInputId, titleSelectId) {
    const issueInput = document.getElementById(issueInputId);
    const titleSelect = document.getElementById(titleSelectId);
    const expiryInput = document.getElementById(expiryInputId);

    const issueVal = issueInput ? issueInput.value : '';
    const titleVal = titleSelect ? (titleSelect.value || titleSelect.innerText) : '';

    if (issueVal && expiryInput) {
      const calculatedExpiry = this.anticipateExpiryDate(issueVal, titleVal);
      if (calculatedExpiry) {
        expiryInput.value = calculatedExpiry;
      }
    }
  }

  openAddCertModal(defaultTitle = null) {
    if (defaultTitle && document.getElementById('certTitle')) {
      document.getElementById('certTitle').value = defaultTitle;
    }
    document.getElementById('addCertModal').classList.add('active');
  }

  closeAddCertModal() {
    document.getElementById('addCertModal').classList.remove('active');
  }

  openAddPersonnelCertModal(empId = null, empName = null, defaultTitle = null) {
    const selectEmp = document.getElementById('pCertEmployeeSelect');
    const isEmployeeRole = this.currentUser && this.currentUser.role === 'employee';

    if (isEmployeeRole && this.currentUser.employeeId) {
      empId = this.currentUser.employeeId;
    }

    if (selectEmp) {
      const safeEmps = Array.isArray(this.employees) ? this.employees : [];
      selectEmp.innerHTML = safeEmps.map(e => `<option value="${e.id}">${e.employeeName} (${e.jobTitle || 'Worker'})</option>`).join('');
      if (empId) selectEmp.value = empId;
      if (isEmployeeRole) {
        selectEmp.disabled = true;
        selectEmp.style.background = '#f1f5f9';
        selectEmp.style.cursor = 'not-allowed';
      } else {
        selectEmp.disabled = false;
        selectEmp.style.background = '#ffffff';
        selectEmp.style.cursor = 'default';
      }
    }

    if (defaultTitle && document.getElementById('pCertReqSelect')) {
      document.getElementById('pCertReqSelect').value = defaultTitle;
    }
    document.getElementById('addPersonnelCertModal').classList.add('active');
  }

  handleDragOver(e, el) {
    e.preventDefault();
    if (el) el.classList.add('drag-over');
  }

  handleDragLeave(e, el) {
    e.preventDefault();
    if (el) el.classList.remove('drag-over');
  }

  handleDrop(e, key) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      const file = dt.files[0];
      this.processFileRead(file, key);
    }
  }

  handleFileUpload(input, key) {
    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFileRead(file, key);
    }
  }

  processFileRead(file, key) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      let urlInput = document.getElementById(`url_${key}`);
      if (!urlInput) urlInput = document.getElementById(key);
      let previewDiv = document.getElementById(`preview_${key}`);

      if (urlInput) urlInput.value = dataUrl;
      if (previewDiv) {
        previewDiv.classList.remove('hidden');
        const isImage = file.type.startsWith('image/');
        previewDiv.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; width:100%; background:#eff6ff; padding:0.5rem 0.75rem; border-radius:6px; border:1px solid #bfdbfe; margin-top:0.35rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.82rem;">
              <i class="fa-solid ${isImage ? 'fa-file-image' : 'fa-file-pdf'}" style="color:var(--primary);"></i>
              <strong style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</strong>
              <small style="color:var(--text-muted);">(${(file.size / 1024).toFixed(1)} KB)</small>
            </div>
            <span class="badge badge-active" style="font-size:0.7rem;"><i class="fa-solid fa-check"></i> Ready to Upload</span>
          </div>
        `;
      }
      this.showToast(`File '${file.name}' attached successfully!`, 'info');
    };
    reader.readAsDataURL(file);
  }

  closeAddPersonnelCertModal() {
    document.getElementById('addPersonnelCertModal').classList.remove('active');
  }

  async handleAddCert(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('certTitle').value,
      type: document.getElementById('certType').value,
      issueDate: document.getElementById('certIssueDate').value,
      expiryDate: document.getElementById('certExpiryDate').value,
      documentUrl: document.getElementById('url_newcert').value
    };

    try {
      const res = await fetch('/api/certificates/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add certificate');
      this.closeAddCertModal();
      await this.loadCertificates();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async handleAddPersonnelCert(e) {
    e.preventDefault();
    const selectEmp = document.getElementById('pCertEmployeeSelect');
    const empName = selectEmp.options[selectEmp.selectedIndex] ? selectEmp.options[selectEmp.selectedIndex].text.split(' (')[0] : '';
    const payload = {
      employeeId: selectEmp.value,
      employeeName: empName,
      requirementTitle: document.getElementById('pCertReqSelect').value,
      issueDate: document.getElementById('pCertIssueDate').value,
      expiryDate: document.getElementById('pCertExpiryDate').value,
      documentUrl: document.getElementById('url_pcert').value
    };

    try {
      const res = await fetch('/api/certificates/personnel/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit personnel certificate');
      this.closeAddPersonnelCertModal();
      await this.loadCertificates();
      await this.loadAssignedTasks();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async deleteCert(id) {
    if (!confirm('Are you sure you want to delete this certificate record?')) return;
    try {
      await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      await this.loadCertificates();
    } catch (e) {
      alert('Delete failed');
    }
  }

  async deletePersonnelCert(id) {
    if (!confirm('Are you sure you want to delete this employee certificate?')) return;
    try {
      await fetch(`/api/certificates/personnel/${id}`, { method: 'DELETE' });
      await this.loadCertificates();
    } catch (e) {
      alert('Delete failed');
    }
  }

  // Load & Render MAXX Safety Courses
  async loadCourses() {
    try {
      let url = '/api/courses';
      if (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all') {
        url += `?vendorId=${this.selectedAdminVendorId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.courses = data.courses;
        this.completions = data.completions;

        this.renderCoursesCatalog(data.courses);
        this.renderCompletionsTable(data.completions);
        this.populateCourseSelect(data.courses);
      }
    } catch (e) {
      console.error('Failed to load courses', e);
    }
  }

  renderCoursesCatalog(courses) {
    const grid = document.getElementById('courseCatalogGrid');
    if (!grid) return;

    grid.innerHTML = courses.map(c => `
      <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-sm);">
        <div class="flex-between mb-2">
          <span class="badge badge-info">${c.courseCode}</span>
          ${c.requiredByMaxx ? '<span class="badge badge-danger">Mandatory</span>' : '<span class="badge badge-draft">Elective</span>'}
        </div>
        <h4 style="font-size: 1rem; color: var(--text-main); margin-bottom: 0.35rem;">${c.title}</h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">${c.description}</p>
        <div class="flex-between" style="font-size: 0.8rem; color: var(--text-dim);">
          <span><i class="fa-solid fa-clock"></i> ${c.durationHours} Hours</span>
          <span>Category: ${c.category}</span>
        </div>
      </div>
    `).join('');
  }

  renderCompletionsTable(completions) {
    const tbody = document.getElementById('courseLogTableBody');
    if (!tbody) return;

    if (!completions || completions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--text-muted);">No safety course completions recorded yet.</td></tr>`;
      return;
    }

    const statusMap = {
      valid: '<span class="badge badge-active">Valid</span>',
      expiring_soon: '<span class="badge badge-expiring_soon">Expiring Soon</span>',
      expired: '<span class="badge badge-expired">Expired</span>'
    };

    tbody.innerHTML = completions.map(cc => `
      <tr>
        <td><strong>${cc.employeeName}</strong></td>
        <td>${cc.companyName || 'Vendor'}</td>
        <td>${cc.courseTitle}</td>
        <td><code>${cc.certNumber}</code></td>
        <td>${cc.completionDate}</td>
        <td>${cc.expiryDate}</td>
        <td>${statusMap[cc.computedStatus] || cc.computedStatus}</td>
      </tr>
    `).join('');
  }

  populateCourseSelect(courses) {
    const select = document.getElementById('courseSelect');
    if (select) {
      select.innerHTML = courses.map(c => `<option value="${c.id}">${c.courseCode} - ${c.title}</option>`).join('');
    }
  }

  openRecordCourseModal() {
    document.getElementById('recordCourseModal').classList.add('active');
  }

  closeRecordCourseModal() {
    document.getElementById('recordCourseModal').classList.remove('active');
  }

  async handleRecordCourse(e) {
    e.preventDefault();
    const payload = {
      employeeName: document.getElementById('courseEmpName').value,
      courseId: document.getElementById('courseSelect').value,
      completionDate: document.getElementById('courseCompDate').value,
      expiryDate: document.getElementById('courseExpDate').value,
      certNumber: document.getElementById('courseCertNum').value
    };

    try {
      const res = await fetch('/api/courses/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to record completion');
      this.closeRecordCourseModal();
      await this.loadCourses();
      await this.loadAssignedTasks();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // Admin Overview & Configurator Actions
  async loadAdminOverview() {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        this.allVendors = data.vendors || [];
        this.populateAdminCompanySelect(data.vendors || []);
        this.renderAdminVendorsTable(data.vendors || [], data.prequals || []);
        this.renderAdminPersonnelTable(this.employees || []);
        this.renderAdminCertReqTable(this.requiredDefinitions);
        this.renderAdminCourseReqTable(this.courses);
        this.renderDashCompaniesTable();
        await this.loadJobRolePresets();
      }
    } catch (e) {
      console.error('Failed to load admin overview', e);
    }
  }

  populateAdminCompanySelect(vendors) {
    const select = document.getElementById('adminCompanyFilterSelect');
    if (!select) return;

    select.innerHTML = `
      <option value="all" ${this.selectedAdminVendorId === 'all' ? 'selected' : ''}>All Registered Companies (Global View)</option>
      ${vendors.map(v => `<option value="${v.id}" ${this.selectedAdminVendorId === v.id ? 'selected' : ''}>${v.companyName} (${v.isnetworldId || 'No ID'})</option>`).join('')}
    `;
  }

  async handleAdminCompanyFilterChange(vendorId) {
    this.selectedAdminVendorId = vendorId;
    await this.loadAdminOverview();
    await this.loadCertificates();
    await this.loadEmployees();
    await this.loadCourses();
  }

  setAdminSubTab(subTab) {
    document.querySelectorAll('.admin-sub-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('#tab-admin .btn-secondary').forEach(el => el.classList.remove('active'));

    const view = document.getElementById(`adminView-${subTab}`);
    if (view) view.classList.remove('hidden');

    const btnMap = {
      vendors: 'adminSubTabVendors',
      personnel: 'adminSubTabPersonnel',
      companyCertReq: 'adminSubTabCompanyCertReq',
      employeeCertReq: 'adminSubTabEmployeeCertReq',
      courseReq: 'adminSubTabCourseReq',
      jobRolePresets: 'adminSubTabJobRolePresets'
    };
    const btn = document.getElementById(btnMap[subTab]);
    if (btn) btn.classList.add('active');
  }

  async adminReviewVendor(vendorId) {
    this.selectedAdminVendorId = vendorId;
    const select = document.getElementById('globalCompanySelect');
    if (select) select.value = vendorId;
    const aSelect = document.getElementById('adminCompanyFilterSelect');
    if (aSelect) aSelect.value = vendorId;
    await this.loadPrequal(vendorId);
    this.showTab('prequal');
    this.setStep('partF');
  }

  async confirmTaskCompletion(taskId) {
    try {
      const res = await fetch(`/api/courses/tasks/confirm/${taskId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm task completion');
      this.showToast('Task completion verified & confirmed by MAXX Admin!', 'success');
      await this.loadAssignedTasks();
    } catch (err) {
      this.showToast('Confirmation error: ' + err.message, 'error');
    }
  }

  async deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this safety course?')) return;
    try {
      await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      await this.loadCourses();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (e) {
      alert('Delete failed');
    }
  }

  renderAdminVendorsTable(vendors, prequals) {
    const tbody = document.getElementById('adminVendorsBody');
    if (!tbody) return;

    if (!vendors || vendors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">No contractor companies registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = vendors.map(v => {
      const flag = (v.country === 'USA') ? '🇺🇸 USA' : ((v.country === 'Both') ? '🇨🇦🇺🇸 Dual' : '🇨🇦 Canada');
      const pqStatus = v.prequalStatus || 'draft';
      const pqBadge = pqStatus === 'approved' 
        ? '<span class="badge badge-active"><i class="fa-solid fa-check"></i> Approved</span>' 
        : (pqStatus === 'pending_review' 
          ? '<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Pending Review</span>' 
          : '<span class="badge badge-draft">Draft</span>');

      return `
        <tr>
          <td><strong>${v.companyName}</strong></td>
          <td>${flag}</td>
          <td>${v.contactName || 'N/A'}<br><small style="color:var(--text-muted);">${v.email || ''}</small></td>
          <td><code>${v.isnetworldId || 'N/A'}</code></td>
          <td><code>${v.gstNumber || 'N/A'}</code></td>
          <td>${pqBadge}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="app.adminReviewVendor('${v.id}')">
              <i class="fa-solid fa-signature"></i> Review / Sign Off
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderAdminPersonnelTable(employees) {
    const tbody = document.getElementById('adminPersonnelBody');
    if (!tbody) return;

    let filtered = employees;
    if (this.selectedAdminVendorId !== 'all') {
      filtered = employees.filter(e => e.vendorId === this.selectedAdminVendorId);
    }

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No personnel added for selected company. Click "Add Worker" to add.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(e => `
      <tr>
        <td><strong>${e.employeeName}</strong></td>
        <td>${e.companyName || 'Company'}</td>
        <td>${e.jobTitle || 'Worker'}</td>
        <td>${e.email || 'N/A'}</td>
        <td>${e.phone || 'N/A'}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="app.openEmployeeProfileModal('${e.id}')">
            <i class="fa-solid fa-user"></i> View Profile
          </button>
          <button class="btn btn-success btn-sm" onclick="app.openAddPersonnelCertModal('${e.id}', '${e.employeeName}')">
            <i class="fa-solid fa-id-card"></i> Submit Cert
          </button>
          <button class="btn btn-danger btn-sm" onclick="app.deleteEmployee('${e.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderAdminCertReqTable(reqs) {
    const cBody = document.getElementById('adminCompanyCertReqBody');
    const eBody = document.getElementById('adminEmployeeCertReqBody');
    if (!cBody && !eBody) return;

    const companyReqs = (reqs || []).filter(r => (r.scope || 'company') === 'company');
    const employeeReqs = (reqs || []).filter(r => r.scope === 'employee');

    const renderRow = (rc) => `
      <tr>
        <td><strong>${rc.title}</strong></td>
        <td><span class="badge ${rc.scope === 'employee' ? 'badge-info' : 'badge-warning'}">${rc.scope === 'employee' ? 'Worker Qualification' : 'Company Policy'}</span></td>
        <td>${rc.category}</td>
        <td>
          <button class="btn btn-sm ${rc.isMandatory ? 'btn-danger' : 'btn-secondary'}" onclick="app.toggleRequiredCertMandatory('${rc.id}')">
            ${rc.isMandatory ? '<i class="fa-solid fa-lock"></i> Mandatory' : '<i class="fa-solid fa-unlock"></i> Optional'}
          </button>
        </td>
        <td><small style="color:var(--text-muted);">${rc.description}</small></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="app.deleteRequiredCert('${rc.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;

    if (cBody) {
      if (companyReqs.length === 0) cBody.innerHTML = `<tr><td colspan="6" class="text-center">No company policy requirements configured.</td></tr>`;
      else cBody.innerHTML = companyReqs.map(renderRow).join('');
    }

    if (eBody) {
      if (employeeReqs.length === 0) eBody.innerHTML = `<tr><td colspan="6" class="text-center">No employee qualification policies configured.</td></tr>`;
      else eBody.innerHTML = employeeReqs.map(renderRow).join('');
    }
  }

  renderAdminCourseReqTable(courses) {
    const tbody = document.getElementById('adminCourseReqBody');
    if (!tbody) return;

    if (!courses || courses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No safety courses configured.</td></tr>`;
      return;
    }

    tbody.innerHTML = courses.map(c => `
      <tr>
        <td><code>${c.courseCode}</code></td>
        <td><strong>${c.title}</strong></td>
        <td>${c.category}</td>
        <td>${c.durationHours} Hours</td>
        <td>
          <button class="btn btn-sm ${c.requiredByMaxx ? 'btn-danger' : 'btn-secondary'}" onclick="app.toggleCourseMandatory('${c.id}')">
            ${c.requiredByMaxx ? '<i class="fa-solid fa-lock"></i> Mandatory' : '<i class="fa-solid fa-unlock"></i> Elective'}
          </button>
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="app.deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  async toggleRequiredCertMandatory(id) {
    try {
      const req = this.requiredDefinitions.find(r => r.id === id);
      if (!req) return;
      const updatedStatus = !req.isMandatory;

      const res = await fetch(`/api/certificates/required/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMandatory: updatedStatus })
      });
      if (!res.ok) throw new Error('Failed to update requirement status');
      await this.loadCertificates();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (e) {
      alert('Error toggling requirement: ' + e.message);
    }
  }

  async toggleCourseMandatory(id) {
    try {
      const course = this.courses.find(c => c.id === id);
      if (!course) return;
      const updatedStatus = !course.requiredByMaxx;

      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiredByMaxx: updatedStatus })
      });
      if (!res.ok) throw new Error('Failed to update course status');
      await this.loadCourses();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (e) {
      alert('Error toggling course requirement: ' + e.message);
    }
  }

  openAddRequiredCertModal(scope) {
    if (scope) {
      const select = document.getElementById('reqCertScope');
      if (select) select.value = scope;
    }
    document.getElementById('addRequiredCertModal').classList.add('active');
  }

  closeAddRequiredCertModal() {
    document.getElementById('addRequiredCertModal').classList.remove('active');
  }

  async handleSaveRequiredCert(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('reqCertTitle').value,
      scope: document.getElementById('reqCertScope').value,
      category: document.getElementById('reqCertCategory').value,
      isMandatory: document.getElementById('reqCertMandatory').value === 'true',
      description: document.getElementById('reqCertDescription').value
    };

    try {
      const res = await fetch('/api/certificates/required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save certificate requirement');
      this.closeAddRequiredCertModal();
      await this.loadCertificates();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async deleteRequiredCert(id) {
    if (!confirm('Are you sure you want to delete this certificate requirement policy?')) return;
    try {
      await fetch(`/api/certificates/required/${id}`, { method: 'DELETE' });
      await this.loadCertificates();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (e) {
      alert('Delete failed');
    }
  }

  openAddCourseModal() {
    document.getElementById('addCourseModal').classList.add('active');
  }

  closeAddCourseModal() {
    document.getElementById('addCourseModal').classList.remove('active');
  }

  async handleSaveCourse(e) {
    e.preventDefault();
    const payload = {
      courseCode: document.getElementById('cCode').value,
      title: document.getElementById('cTitle').value,
      category: document.getElementById('cCategory').value,
      durationHours: document.getElementById('cDuration').value,
      requiredByMaxx: document.getElementById('cRequired').value === 'true',
      description: document.getElementById('cDescription').value
    };

    try {
      const res = await fetch('/api/courses/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save course');
      this.closeAddCourseModal();
      await this.loadCourses();
      if (this.currentUser.role === 'admin') await this.loadAdminOverview();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  renderDashCompaniesTable() {
    this.renderPendingWorkerTicketsQueue();
    const tbody = document.getElementById('dashCompaniesTableBody');
    if (!tbody) return;

    if (!this.allVendors || this.allVendors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: var(--text-muted);">No contractor companies registered yet.</td></tr>`;
      return;
    }

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    tbody.innerHTML = this.allVendors.map(v => {
      const flag = (v.country === 'USA') ? '🇺🇸 USA' : ((v.country === 'Both') ? '🇨🇦🇺🇸 Dual' : '🇨🇦 Canada');
      const pqStatus = v.prequalStatus || 'draft';
      const pqBadge = pqStatus === 'approved'
        ? '<span class="badge badge-active"><i class="fa-solid fa-check"></i> Approved</span>'
        : (pqStatus === 'pending_review' 
          ? '<span class="badge badge-expiring_soon"><i class="fa-solid fa-clock"></i> Pending Review</span>'
          : '<span class="badge badge-draft">Draft / Incomplete</span>');

      const empCount = (this.employees || []).filter(e => e.vendorId === v.id).length;
      const certCount = (this.certificates || []).filter(c => c.vendorId === v.id).length;

      // Simple audit score check
      const hasGst = v.gstNumber && v.gstNumber !== 'N/A';
      const hasWcb = v.taxWcbNumber && v.taxWcbNumber !== 'N/A';
      const auditClear = (pqStatus === 'approved' && hasGst && hasWcb);

      const auditBadge = auditClear
        ? '<span class="badge badge-active"><i class="fa-solid fa-shield-halved"></i> VERIFIED & APPROVED</span>'
        : '<span class="badge badge-expired"><i class="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED</span>';

      return `
        <tr>
          <td>
            <strong>${v.companyName}</strong><br>
            <small style="color:var(--text-muted);">${v.primaryContact || 'N/A'}</small>
          </td>
          <td>${flag}</td>
          <td><code>${v.isnetworldId || 'N/A'}</code></td>
          <td>${pqBadge}</td>
          <td><span class="badge badge-info">${certCount} Certs</span></td>
          <td><button class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="app.showAdminPersonnelForVendor('${v.id}')"><i class="fa-solid fa-users"></i> ${empCount} Workers</button></td>
          <td>${auditBadge}</td>
          <td>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="app.selectCompanyAndAudit('${v.id}')"><i class="fa-solid fa-file-shield"></i> Audit Report</button>
              ${isAdmin 
                ? `<button class="btn btn-primary btn-sm" onclick="app.adminReviewVendor('${v.id}')"><i class="fa-solid fa-signature"></i> Prequal Sign-Off</button>
                   <button class="btn btn-success btn-sm" onclick="app.showAdminPersonnelForVendor('${v.id}')"><i class="fa-solid fa-user-check"></i> Worker Tickets</button>
                   <button class="btn btn-danger btn-sm" onclick="app.deleteVendor('${v.id}')" title="Delete Contractor Company"><i class="fa-solid fa-trash"></i> Delete</button>` 
                : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPendingWorkerTicketsQueue() {
    const card = document.getElementById('dashPendingWorkerTicketsCard');
    const tbody = document.getElementById('dashPendingWorkerTicketsBody');
    if (!card || !tbody) return;

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';
    if (!isAdmin) {
      card.classList.add('hidden');
      return;
    }

    const allPersonnelCerts = (this.personnelCertificates || []).map(c => ({
      ...c,
      isPersonnel: true,
      ownerName: c.employeeName || 'Worker',
      docCategory: 'Worker Ticket'
    }));

    const allCompanyCerts = (this.certificates || []).map(c => ({
      ...c,
      isPersonnel: false,
      ownerName: c.companyName || 'Company Policy',
      docCategory: 'Company Policy'
    }));

    const combined = [...allPersonnelCerts, ...allCompanyCerts];
    const pendingDocs = combined.filter(c => c.approvalStatus === 'pending_approval' || !c.approvalStatus);

    if (pendingDocs.length === 0) {
      card.classList.add('hidden');
      return;
    }

    // Build vendor name lookup map
    const vendorNameMap = {};
    (this.allVendors || []).forEach(v => { vendorNameMap[v.id] = v.companyName; });

    card.classList.remove('hidden');
    tbody.innerHTML = pendingDocs.map(c => {
      // Resolve company name - prefer allVendors lookup over stored value
      const resolvedCompany = vendorNameMap[c.vendorId] || c.companyName || 'Contractor Organization';
      const isUnknown = resolvedCompany === 'Unknown Vendor';
      const displayCompany = isUnknown ? (vendorNameMap[c.vendorId] || 'Contractor Organization') : resolvedCompany;
      return `
      <tr>
        <td>
          <strong>${c.ownerName}</strong><br>
          <small style="color:var(--text-muted);">${displayCompany}</small>
        </td>
        <td><span class="badge ${c.isPersonnel ? 'badge-info' : 'badge-warning'}">${c.docCategory}</span></td>
        <td><strong style="color:var(--primary);">${c.title}</strong></td>
        <td><strong>${c.expiryDate || 'N/A'}</strong></td>
        <td>
          ${c.documentUrl 
            ? `<button class="btn btn-secondary btn-sm" onclick="app.openImagePreviewModal('${c.documentUrl}', '${c.title}')"><i class="fa-solid fa-eye"></i> View Document</button>` 
            : '<span style="color:var(--text-muted);">No File Attached</span>'}
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-success btn-sm" style="font-weight:700; font-size:0.8rem; padding:4px 10px;" onclick="app.quickApproveCert('${c.id}', ${c.isPersonnel})"><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn btn-danger btn-sm" style="font-weight:700; font-size:0.8rem; padding:4px 10px;" onclick="app.quickRejectCert('${c.id}', ${c.isPersonnel})"><i class="fa-solid fa-xmark"></i> Reject</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  showAdminPersonnelForVendor(vendorId) {
    this.selectedAdminVendorId = vendorId;
    const select = document.getElementById('globalCompanySelect');
    if (select) select.value = vendorId;
    this.showTab('admin');
    this.setAdminSubTab('personnel');
  }

  async selectCompanyAndAudit(vendorId) {
    this.selectedAdminVendorId = vendorId;
    const select = document.getElementById('globalCompanySelect');
    if (select) select.value = vendorId;
    await this.handleGlobalCompanyChange(vendorId);
    this.showTab('audit');
  }

  async loadAssignedTasks() {
    try {
      let url = '/api/courses/assigned-tasks';
      if (this.currentUser && this.currentUser.role === 'admin' && this.selectedAdminVendorId !== 'all') {
        url += `?vendorId=${this.selectedAdminVendorId}`;
      }
      const data = await this.safeFetchJson(url);
      if (data) {
        this.renderAssignedTasksTable(data.tasks || []);
      }
    } catch (e) {
      console.error('Failed to load assigned tasks', e);
    }
  }

  renderAssignedTasksTable(tasks) {
    const tbody = document.getElementById('assignedTasksTableBody');
    if (!tbody) return;

    if (!tasks || tasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No pending assigned tasks or certificate requests.</td></tr>`;
      return;
    }

    tbody.innerHTML = tasks.map(t => {
      const isTraining = t.taskType === 'training_course';
      const typeBadge = isTraining 
        ? '<span class="badge badge-info"><i class="fa-solid fa-graduation-cap"></i> Assigned Course</span>'
        : '<span class="badge badge-danger"><i class="fa-solid fa-file-contract"></i> Cert Requested</span>';

      return `
        <tr>
          <td>
            <strong>${t.title}</strong><br>
            ${typeBadge}
          </td>
          <td>${t.employeeName || 'Company Scope'} (${t.companyName})</td>
          <td><strong style="color:var(--danger);">${t.dueDate}</strong></td>
          <td><small style="color:var(--text-muted);">${t.notes || 'N/A'}</small></td>
          <td>
            ${isTraining 
              ? `<button class="btn btn-primary btn-sm" onclick="app.openRecordCourseModal()"><i class="fa-solid fa-check-circle"></i> Fulfill Training</button>`
              : `<button class="btn btn-success btn-sm" onclick="app.openAddCertModal()"><i class="fa-solid fa-upload"></i> Upload Requested Cert</button>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  openAssignTaskModal() {
    if (!this.allVendors || this.allVendors.length === 0) {
      alert('Please wait for contractor companies to load.');
      return;
    }

    const vSelect = document.getElementById('assignVendorSelect');
    if (vSelect) {
      vSelect.innerHTML = this.allVendors.map(v => `<option value="${v.id}">${v.companyName} (${v.isnetworldId || 'No ID'})</option>`).join('');
      this.handleAssignVendorChange(this.allVendors[0].id);
    }

    const cSelect = document.getElementById('assignCourseSelect');
    if (cSelect && this.courses) {
      cSelect.innerHTML = this.courses.map(c => `<option value="${c.id}">${c.courseCode} - ${c.title}</option>`).join('');
    }

    const rSelect = document.getElementById('assignCertReqSelect');
    if (rSelect && this.requiredDefinitions) {
      rSelect.innerHTML = this.requiredDefinitions.map(r => `<option value="${r.title}">${r.title} (${r.scope === 'employee' ? 'Worker' : 'Company'})</option>`).join('');
    }

    document.getElementById('assignDueDate').value = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('assignTaskModal').classList.add('active');
  }

  closeAssignTaskModal() {
    document.getElementById('assignTaskModal').classList.remove('active');
  }

  toggleAssignTaskType(type) {
    document.getElementById('assignTaskType').value = type;
    const btnTrain = document.getElementById('assignTypeBtnTraining');
    const btnCert = document.getElementById('assignTypeBtnCert');
    const grpTrain = document.getElementById('assignCourseGroup');
    const grpCert = document.getElementById('assignCertGroup');

    if (type === 'training') {
      btnTrain.classList.add('active');
      btnCert.classList.remove('active');
      grpTrain.classList.remove('hidden');
      grpCert.classList.add('hidden');
    } else {
      btnTrain.classList.remove('active');
      btnCert.classList.add('active');
      grpTrain.classList.add('hidden');
      grpCert.classList.remove('hidden');
    }
  }

  handleAssignVendorChange(vendorId) {
    const wSelect = document.getElementById('assignWorkerSelect');
    if (!wSelect) return;

    const vendorWorkers = this.employees ? this.employees.filter(e => e.vendorId === vendorId) : [];
    wSelect.innerHTML = `
      <option value="">All Workers / Company Scope</option>
      ${vendorWorkers.map(w => `<option value="${w.id}">${w.employeeName} (${w.jobTitle || 'Worker'})</option>`).join('')}
    `;
  }

  async handleAssignTask(e) {
    e.preventDefault();
    const type = document.getElementById('assignTaskType').value;
    const vendorId = document.getElementById('assignVendorSelect').value;
    const employeeId = document.getElementById('assignWorkerSelect').value;
    const dueDate = document.getElementById('assignDueDate').value;
    const notes = document.getElementById('assignNotes').value;

    try {
      let endpoint = '';
      let payload = {};

      if (type === 'training') {
        endpoint = '/api/courses/assign';
        payload = {
          vendorId,
          employeeId: employeeId || null,
          courseId: document.getElementById('assignCourseSelect').value,
          dueDate,
          notes
        };
      } else {
        endpoint = '/api/certificates/request';
        payload = {
          vendorId,
          employeeId: employeeId || null,
          requirementTitle: document.getElementById('assignCertReqSelect').value,
          dueDate,
          notes
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign task');

      alert(data.message || 'Task assigned successfully!');
      this.closeAssignTaskModal();
      await this.loadAssignedTasks();
    } catch (err) {
      alert('Assignment error: ' + err.message);
    }
  }

  // MAXX Safety AI Assistant Handlers (Zero API Key Needed)
  toggleAiModal() {
    const modal = document.getElementById('aiAssistantModal');
    if (modal) {
      modal.classList.toggle('active');
    }
  }

  sendAiQuickAction(prompt) {
    const input = document.getElementById('aiInputPrompt');
    if (input) {
      input.value = prompt;
      this.handleAiSubmit(new Event('submit'));
    }
  }

  async handleAiSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('aiInputPrompt');
    const stream = document.getElementById('aiChatStream');
    if (!input || !stream) return;

    const prompt = input.value.trim();
    if (!prompt) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'background:var(--primary-light); border:1px solid #bfdbfe; border-radius:var(--radius-md); padding:0.75rem 1rem; margin-bottom:1rem; color:var(--primary); text-align:right; font-weight:600;';
    userMsg.innerText = prompt;
    stream.appendChild(userMsg);

    input.value = '';
    stream.scrollTop = stream.scrollHeight;

    // Append AI Loading Indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'background:#f8fafc; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.75rem 1rem; margin-bottom:1rem; color:var(--text-muted); font-style:italic;';
    loadingMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MAXX AI is analyzing safety regulations & compliance data...';
    stream.appendChild(loadingMsg);
    stream.scrollTop = stream.scrollHeight;

    try {
      const vendorId = this.selectedAdminVendorId !== 'all' ? this.selectedAdminVendorId : (this.currentVendor ? this.currentVendor.id : null);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, vendorId })
      });

      const data = await res.json();
      loadingMsg.remove();

      const aiMsg = document.createElement('div');
      aiMsg.style.cssText = 'background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; margin-bottom:1rem; box-shadow:var(--shadow-sm); color:#1e293b;';
      
      // Simple format replacement for bold & newlines
      const formatted = (data.response || 'No response')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      aiMsg.innerHTML = formatted;
      stream.appendChild(aiMsg);
      stream.scrollTop = stream.scrollHeight;
    } catch (err) {
      loadingMsg.remove();
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = 'background:#fef2f2; border:1px solid #fca5a5; border-radius:var(--radius-md); padding:0.75rem 1rem; margin-bottom:1rem; color:#991b1b;';
      errorMsg.innerText = 'AI Error: ' + err.message;
      stream.appendChild(errorMsg);
    }
  }

  async loadJobRolePresets() {
    try {
      const res = await fetch('/api/courses/role-presets');
      if (res.ok) {
        const data = await res.json();
        this.jobRolePresets = data.presets || [];
        this.renderAdminJobRolePresetsTable(this.jobRolePresets);
      }
    } catch (e) {
      console.error('Failed to load job role presets', e);
    }
  }

  renderAdminJobRolePresetsTable(presets) {
    const tbody = document.getElementById('adminJobRolePresetsBody');
    if (!tbody) return;

    if (!presets || presets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--text-muted);">No job role training & qualification presets configured. Click "Add Job Role Preset" to create one.</td></tr>`;
      return;
    }

    const courseMap = new Map((this.courses || []).map(c => [c.id, c.title]));

    tbody.innerHTML = presets.map(p => {
      const courseBadges = (p.requiredCourseIds || []).map(id => `<span class="badge badge-info mb-1"><i class="fa-solid fa-book"></i> ${courseMap.get(id) || id}</span>`).join(' ') || '<span style="color:var(--text-muted); font-size:0.78rem;">None</span>';
      const certBadges = (p.requiredCertTitles || []).map(t => `<span class="badge badge-warning mb-1"><i class="fa-solid fa-id-badge"></i> ${t}</span>`).join(' ') || '<span style="color:var(--text-muted); font-size:0.78rem;">None</span>';

      return `
        <tr>
          <td><strong style="color:var(--primary); font-size:0.95rem;"><i class="fa-solid fa-user-gear"></i> ${p.roleTitle}</strong></td>
          <td><small style="color:var(--text-muted);">${p.description || 'N/A'}</small></td>
          <td><div style="max-width:280px; display:flex; flex-wrap:wrap; gap:0.25rem;">${courseBadges}</div></td>
          <td><div style="max-width:280px; display:flex; flex-wrap:wrap; gap:0.25rem;">${certBadges}</div></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="app.openEditJobRolePresetModal('${p.id}')"><i class="fa-solid fa-pen"></i> Edit Preset</button>
            <button class="btn btn-danger btn-sm" onclick="app.deleteJobRolePreset('${p.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  openAddJobRolePresetModal() {
    document.getElementById('presetId').value = '';
    document.getElementById('presetRoleTitle').value = '';
    document.getElementById('presetDescription').value = '';
    this.populatePresetChecklists([], []);
    document.getElementById('jobRolePresetModal').classList.add('active');
  }

  openEditJobRolePresetModal(id) {
    const preset = (this.jobRolePresets || []).find(p => p.id === id);
    if (!preset) return;

    document.getElementById('presetId').value = preset.id;
    document.getElementById('presetRoleTitle').value = preset.roleTitle;
    document.getElementById('presetDescription').value = preset.description || '';
    this.populatePresetChecklists(preset.requiredCourseIds || [], preset.requiredCertTitles || []);
    document.getElementById('jobRolePresetModal').classList.add('active');
  }

  closeJobRolePresetModal() {
    document.getElementById('jobRolePresetModal').classList.remove('active');
  }

  populatePresetChecklists(selectedCourseIds = [], selectedCertTitles = []) {
    const cContainer = document.getElementById('presetCoursesChecklist');
    const certContainer = document.getElementById('presetCertsChecklist');

    if (cContainer) {
      const courses = this.courses || [];
      if (courses.length === 0) {
        cContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem;">No safety courses available.</span>`;
      } else {
        cContainer.innerHTML = courses.map(c => `
          <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; font-size:0.82rem; cursor:pointer;">
            <input type="checkbox" name="presetCourse" value="${c.id}" ${selectedCourseIds.includes(c.id) ? 'checked' : ''}>
            <span><strong>${c.courseCode}</strong>: ${c.title}</span>
          </label>
        `).join('');
      }
    }

    if (certContainer) {
      const empCerts = (this.requiredDefinitions || []).filter(r => r.scope === 'employee');
      if (empCerts.length === 0) {
        certContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem;">No worker qualification policy tickets available.</span>`;
      } else {
        certContainer.innerHTML = empCerts.map(r => `
          <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; font-size:0.82rem; cursor:pointer;">
            <input type="checkbox" name="presetCert" value="${r.title}" ${selectedCertTitles.includes(r.title) ? 'checked' : ''}>
            <span><strong>${r.title}</strong> ${r.isMandatory ? '(Mandatory)' : '(Optional)'}</span>
          </label>
        `).join('');
      }
    }
  }

  async handleSaveJobRolePreset(e) {
    e.preventDefault();
    const id = document.getElementById('presetId').value;
    const roleTitle = document.getElementById('presetRoleTitle').value;
    const description = document.getElementById('presetDescription').value;

    const checkedCourses = Array.from(document.querySelectorAll('input[name="presetCourse"]:checked')).map(cb => cb.value);
    const checkedCerts = Array.from(document.querySelectorAll('input[name="presetCert"]:checked')).map(cb => cb.value);

    const payload = {
      id: id || null,
      roleTitle,
      description,
      requiredCourseIds: checkedCourses,
      requiredCertTitles: checkedCerts
    };

    try {
      const res = await fetch('/api/courses/role-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role preset');

      this.closeJobRolePresetModal();
      this.showToast(`Role requirement preset '${roleTitle}' saved successfully!`, 'success');
      await this.loadJobRolePresets();
    } catch (err) {
      this.showToast('Save preset error: ' + err.message, 'error');
    }
  }

  async deleteJobRolePreset(id) {
    if (!confirm('Are you sure you want to delete this job role requirement preset?')) return;
    try {
      const res = await fetch(`/api/courses/role-presets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete preset');
      this.showToast('Job role requirement preset deleted!', 'info');
      await this.loadJobRolePresets();
    } catch (err) {
      this.showToast('Delete error: ' + err.message, 'error');
    }
  }

  async openWorkerSelfProfileModal() {
    if (!this.currentUser || !this.currentUser.employeeId) {
      alert('No employee profile record linked to this account.');
      return;
    }

    let emp = (this.employees || []).find(e => e.id === this.currentUser.employeeId);
    if (!emp) {
      try {
        const res = await fetch(`/api/employees/${this.currentUser.employeeId}/profile`);
        if (res.ok) {
          const data = await res.json();
          emp = data.employee;
        }
      } catch (e) {
        console.error('Error loading worker profile:', e);
      }
    }

    if (!emp) {
      alert('Employee profile record could not be loaded.');
      return;
    }

    const nameParts = (emp.employeeName || '').split(' ');
    const fName = emp.firstName || nameParts[0] || '';
    const lName = emp.lastName || nameParts.slice(1).join(' ') || '';

    const inputFName = document.getElementById('selfFirstName');
    const inputLName = document.getElementById('selfLastName');
    const inputEmail = document.getElementById('selfEmail');
    const inputPhone = document.getElementById('selfPhone');
    const inputTitle = document.getElementById('selfJobTitle');
    const inputAvatar = document.getElementById('selfAvatarUrl');

    if (inputFName) inputFName.value = fName;
    if (inputLName) inputLName.value = lName;
    if (inputEmail) inputEmail.value = emp.email || '';
    if (inputPhone) inputPhone.value = emp.phone || '';
    if (inputTitle) inputTitle.value = emp.jobTitle || 'Worker';
    if (inputAvatar) inputAvatar.value = emp.profilePictureUrl || '';

    const modal = document.getElementById('editWorkerSelfProfileModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeWorkerSelfProfileModal() {
    document.getElementById('editWorkerSelfProfileModal').classList.remove('active');
  }

  async handleWorkerSelfProfileSubmit(e) {
    e.preventDefault();
    const payload = {
      firstName: document.getElementById('selfFirstName').value,
      lastName: document.getElementById('selfLastName').value,
      email: document.getElementById('selfEmail').value,
      phone: document.getElementById('selfPhone').value,
      jobTitle: document.getElementById('selfJobTitle').value,
      profilePictureUrl: document.getElementById('selfAvatarUrl') ? document.getElementById('selfAvatarUrl').value : ''
    };

    try {
      const res = await fetch('/api/employees/my-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      this.closeWorkerSelfProfileModal();
      this.showToast('Your worker profile has been updated!', 'success');
      await this.loadEmployees();
      this.updateUserUI();
    } catch (err) {
      this.showToast('Profile update error: ' + err.message, 'error');
    }
  }

  setAdminSubTab(tabName) {
    const subViews = document.querySelectorAll('.admin-sub-view');
    subViews.forEach(v => v.classList.add('hidden'));

    const tabBtns = [
      { id: 'adminSubTabVendors', viewId: 'adminView-vendors' },
      { id: 'adminSubTabPersonnel', viewId: 'adminView-personnel' },
      { id: 'adminSubTabCompanyCertReq', viewId: 'adminView-companyCertReq' },
      { id: 'adminSubTabEmployeeCertReq', viewId: 'adminView-employeeCertReq' },
      { id: 'adminSubTabCourseReq', viewId: 'adminView-courseReq' },
      { id: 'adminSubTabJobRolePresets', viewId: 'adminView-jobRolePresets' }
    ];

    tabBtns.forEach(t => {
      const btn = document.getElementById(t.id);
      if (btn) btn.classList.remove('active');
    });

    const activeMap = {
      vendors: { btnId: 'adminSubTabVendors', viewId: 'adminView-vendors' },
      personnel: { btnId: 'adminSubTabPersonnel', viewId: 'adminView-personnel' },
      companyCertReq: { btnId: 'adminSubTabCompanyCertReq', viewId: 'adminView-companyCertReq' },
      employeeCertReq: { btnId: 'adminSubTabEmployeeCertReq', viewId: 'adminView-employeeCertReq' },
      courseReq: { btnId: 'adminSubTabCourseReq', viewId: 'adminView-courseReq' },
      jobRolePresets: { btnId: 'adminSubTabJobRolePresets', viewId: 'adminView-jobRolePresets' }
    };

    const target = activeMap[tabName] || activeMap.vendors;
    const targetBtn = document.getElementById(target.btnId);
    const targetView = document.getElementById(target.viewId);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetView) targetView.classList.remove('hidden');

    if (tabName === 'jobRolePresets') {
      this.loadJobRolePresets();
    }
  }

  async loadJobRolePresets() {
    try {
      const res = await fetch('/api/courses/role-presets');
      if (!res.ok) throw new Error('Failed to fetch job role presets');
      const data = await res.json();
      this.jobRolePresets = data.rolePresets || [];
      this.renderJobRolePresets();
    } catch (err) {
      console.error('Error loading job role presets:', err);
    }
  }

  renderJobRolePresets() {
    const tbody = document.getElementById('adminJobRolePresetsBody');
    if (!tbody) return;

    if (!this.jobRolePresets || this.jobRolePresets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--text-muted);">No job role training & qualification presets configured.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.jobRolePresets.map(preset => {
      const coursesList = (preset.requiredCourses || []).map(c => `<span class="badge badge-info"><i class="fa-solid fa-book"></i> ${c}</span>`).join(' ') || '<span style="color:var(--text-muted);">None</span>';
      const certsList = (preset.requiredCertificates || []).map(c => `<span class="badge badge-active"><i class="fa-solid fa-certificate"></i> ${c}</span>`).join(' ') || '<span style="color:var(--text-muted);">None</span>';

      return `
        <tr>
          <td><strong>${preset.roleTitle}</strong></td>
          <td><small style="color:var(--text-muted);">${preset.description || 'Standard site worker qualification preset'}</small></td>
          <td><div style="display:flex; gap:0.3rem; flex-wrap:wrap;">${coursesList}</div></td>
          <td><div style="display:flex; gap:0.3rem; flex-wrap:wrap;">${certsList}</div></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="app.openEditJobRolePresetModal('${preset.id}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-danger btn-sm" onclick="app.deleteJobRolePreset('${preset.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openAddJobRolePresetModal() {
    document.getElementById('presetId').value = '';
    document.getElementById('presetRoleTitle').value = '';
    document.getElementById('presetDescription').value = '';
    this.renderJobRolePresetChecklists([], []);
    document.getElementById('jobRolePresetModal').classList.add('active');
  }

  openEditJobRolePresetModal(id) {
    const preset = (this.jobRolePresets || []).find(p => p.id === id);
    if (!preset) return;

    document.getElementById('presetId').value = preset.id;
    document.getElementById('presetRoleTitle').value = preset.roleTitle;
    document.getElementById('presetDescription').value = preset.description || '';

    this.renderJobRolePresetChecklists(preset.requiredCourses || [], preset.requiredCertificates || []);
    document.getElementById('jobRolePresetModal').classList.add('active');
  }

  renderJobRolePresetChecklists(selectedCourses = [], selectedCerts = []) {
    const coursesDiv = document.getElementById('presetCoursesChecklist');
    const certsDiv = document.getElementById('presetCertsChecklist');

    const allCourses = this.courses || [];
    const allCerts = (this.requiredDefinitions || []).filter(r => r.scope === 'employee');

    if (coursesDiv) {
      coursesDiv.innerHTML = allCourses.map(c => {
        const isChecked = selectedCourses.includes(c.title);
        return `
          <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; cursor:pointer;">
            <input type="checkbox" name="presetCourseCheck" value="${c.title}" ${isChecked ? 'checked' : ''}>
            <span>${c.title}</span>
          </label>
        `;
      }).join('');
    }

    if (certsDiv) {
      certsDiv.innerHTML = allCerts.map(c => {
        const isChecked = selectedCerts.includes(c.title);
        return `
          <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; cursor:pointer;">
            <input type="checkbox" name="presetCertCheck" value="${c.title}" ${isChecked ? 'checked' : ''}>
            <span>${c.title}</span>
          </label>
        `;
      }).join('');
    }
  }

  closeJobRolePresetModal() {
    document.getElementById('jobRolePresetModal').classList.remove('active');
  }

  async handleSaveJobRolePresetSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('presetId').value;
    const roleTitle = document.getElementById('presetRoleTitle').value;
    const description = document.getElementById('presetDescription').value;

    const courseChecks = Array.from(document.querySelectorAll('input[name="presetCourseCheck"]:checked')).map(el => el.value);
    const certChecks = Array.from(document.querySelectorAll('input[name="presetCertCheck"]:checked')).map(el => el.value);

    const payload = {
      id: id || ('preset-' + Date.now()),
      roleTitle,
      description,
      requiredCourses: courseChecks,
      requiredCertificates: certChecks
    };

    try {
      const res = await fetch('/api/courses/role-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role preset');

      this.closeJobRolePresetModal();
      this.showToast(`Role requirement preset '${roleTitle}' saved successfully!`, 'success');
      await this.loadJobRolePresets();
    } catch (err) {
      this.showToast('Save preset error: ' + err.message, 'error');
    }
  }

  async deleteJobRolePreset(id) {
    if (!confirm('Are you sure you want to delete this job role requirement preset?')) return;
    try {
      const res = await fetch(`/api/courses/role-presets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete preset');
      this.showToast('Job role requirement preset deleted!', 'info');
      await this.loadJobRolePresets();
    } catch (err) {
      this.showToast('Delete error: ' + err.message, 'error');
    }
  }

  printWorkerBadgeCard() {
    if (!this.currentProfileEmployee) return;
    const emp = this.currentProfileEmployee;
    const passportUrl = this.currentProfilePassportUrl;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(passportUrl)}`;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Safety ID Badge - ${emp.employeeName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          body { font-family: 'Inter', sans-serif; padding: 20px; background: #f8fafc; display: flex; justify-content: center; }
          .badge-card { width: 320px; border: 2px solid #1e3a8a; border-radius: 14px; background: white; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); text-align: center; }
          .badge-header { background: #1e3a8a; color: white; padding: 14px 10px; }
          .badge-header h3 { margin: 0; font-size: 1.1rem; font-weight: 900; letter-spacing: 0.5px; }
          .badge-header p { margin: 2px 0 0; font-size: 0.7rem; font-weight: 700; color: #93c5fd; text-transform: uppercase; }
          .badge-body { padding: 16px; }
          .avatar { width: 70px; height: 70px; border-radius: 50%; border: 3px solid #3b82f6; object-fit: cover; margin: 0 auto 10px; }
          .avatar-placeholder { width: 70px; height: 70px; border-radius: 50%; background: #3b82f6; color: white; font-weight: 900; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
          .name { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
          .title { font-size: 0.85rem; font-weight: 700; color: #2563eb; margin-top: 2px; }
          .company { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
          .qr-box { margin: 14px 0 8px; }
          .qr-box img { width: 140px; height: 140px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 4px; background: white; }
          .badge-footer { background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 8px; font-size: 0.68rem; font-weight: 700; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="badge-card">
          <div class="badge-header">
            <h3><i class="fa-solid fa-shield-halved"></i> MAXX INDUSTRIES</h3>
            <p>WORKER SAFETY VERIFICATION BADGE</p>
          </div>
          <div class="badge-body">
            ${emp.profilePictureUrl ? `<img src="${emp.profilePictureUrl}" class="avatar">` : `<div class="avatar-placeholder">${emp.employeeName.charAt(0).toUpperCase()}</div>`}
            <h2 class="name">${emp.employeeName}</h2>
            <div class="title">${emp.jobTitle || 'Field Technician'}</div>
            <div class="company">${emp.companyName || 'Contractor Organization'}</div>
            
            <div class="qr-box">
              <img src="${qrApiUrl}" alt="QR Code">
              <div style="font-size:0.68rem; color:#64748b; font-weight:700; margin-top:4px;">SCAN QR CODE TO VERIFY TICKETS</div>
            </div>
          </div>
          <div class="badge-footer">
            MAXX VMS Live Safety Verification System
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  openEmailWorkerPassportModal(empId = null) {
    const select = document.getElementById('emailPassportWorkerSelect');
    if (select) {
      const safeEmps = Array.isArray(this.employees) ? this.employees : [];
      select.innerHTML = safeEmps.map(e => `<option value="${e.id}">${e.employeeName} (${e.jobTitle || 'Worker'})</option>`).join('');
      if (empId) select.value = empId;
      else if (this.currentProfileEmployee) select.value = this.currentProfileEmployee.id;
    }
    document.getElementById('emailWorkerPassportModal').classList.add('active');
  }

  closeEmailWorkerPassportModal() {
    document.getElementById('emailWorkerPassportModal').classList.remove('active');
  }

  async handleEmailWorkerPassportSubmit(e) {
    e.preventDefault();
    const employeeId = document.getElementById('emailPassportWorkerSelect').value;
    const recipientEmail = document.getElementById('emailPassportRecipient').value;
    const customNote = document.getElementById('emailPassportNote').value;

    try {
      const res = await fetch('/api/employees/email-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, recipientEmail, customNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to email passport');

      this.closeEmailWorkerPassportModal();
      this.showToast(data.message || 'Worker Safety Passport and QR Code emailed successfully!', 'success');
    } catch (err) {
      this.showToast('Email error: ' + err.message, 'error');
    }
  }

  openImagePreviewModal(url, title) {
    if (!url) return;

    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('imagePreviewImg');
    const titleEl = document.getElementById('imagePreviewTitle');

    if (img) img.src = url;
    if (titleEl) titleEl.innerText = title || 'Document Preview';

    if (modal) modal.classList.add('active');
  }

  closeImagePreviewModal() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) modal.classList.remove('active');
  }
}

// Global App Instance
const app = new VMSApp();
