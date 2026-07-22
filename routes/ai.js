const express = require('express');
const router = express.Router();
const db = require('../database');

// Local Rule-Based AI Engine for Safety & Compliance (No API Key Required)
router.post('/chat', (req, res) => {
  try {
    const { prompt, vendorId } = req.body;
    const cleanPrompt = (prompt || '').toLowerCase().trim();

    const vendor = vendorId ? db.getVendorById(vendorId) : null;
    const prequals = db.read().prequalifications || [];
    const prequal = vendor ? prequals.find(p => p.vendorId === vendor.id) : null;
    const certs = vendor ? db.getCertificatesByVendorId(vendor.id) : [];
    const employees = vendor ? db.getEmployeesByVendorId(vendor.id) : [];
    const personnelCerts = vendor ? db.getPersonnelCertificatesByVendorId(vendor.id) : [];

    let aiResponse = '';

    // 1. Company Compliance Analysis Query
    if (cleanPrompt.includes('analyze') || cleanPrompt.includes('audit') || cleanPrompt.includes('status') || cleanPrompt.includes('health')) {
      if (!vendor) {
        aiResponse = `🤖 **MAXX Safety AI Audit Diagnosis**:\n\nPlease select a specific contractor company or open a company profile to run an instant AI safety audit. I will analyze 3-year TRIR/EMR incident rates, WCB/COR clearance credentials, and worker safety tickets!`;
      } else {
        const missingItems = [];
        if (!vendor.gstNumber || vendor.gstNumber === 'N/A') missingItems.push('GST/HST Business Number');
        if (!vendor.taxWcbNumber || vendor.taxWcbNumber === 'N/A') missingItems.push('WCB / WSIB Account Clearance #');
        if (!vendor.corNumber || vendor.corNumber === 'N/A') missingItems.push('COR / SECOR Safety Certificate #');

        const expiredCerts = certs.filter(c => c.computedStatus === 'expired');
        const expiringCerts = certs.filter(c => c.computedStatus === 'expiring_soon');
        const expiredWorkers = personnelCerts.filter(pc => pc.computedStatus === 'expired');

        const trir = (prequal && prequal.partC && prequal.partC.records && prequal.partC.records[0]) ? prequal.partC.records[0].trir : 0;
        const emr = (prequal && prequal.partC && prequal.partC.records && prequal.partC.records[0]) ? prequal.partC.records[0].emr : 1.0;

        aiResponse = `🤖 **MAXX Safety AI Audit Diagnosis for ${vendor.companyName}**:\n\n` +
          `• **Operating Jurisdiction**: ${vendor.country || 'Canada'}\n` +
          `• **Safety Rating**: TRIR: ${trir.toFixed(2)} | EMR: ${emr}\n` +
          `• **Pre-Qualification Status**: ${prequal ? prequal.status.toUpperCase() : 'NOT SUBMITTED'}\n` +
          `• **Active Company Certificates**: ${certs.length} uploaded (${expiringCerts.length} expiring soon, ${expiredCerts.length} expired)\n` +
          `• **Registered Workers Roster**: ${employees.length} workers (${expiredWorkers.length} expired worker cards)\n\n`;

        if (missingItems.length > 0 || expiredCerts.length > 0 || expiredWorkers.length > 0) {
          aiResponse += `⚠️ **AI Recommended Actions for Compliance Approval**:\n`;
          if (missingItems.length > 0) aiResponse += `1. Submit missing organization credentials: ${missingItems.join(', ')}.\n`;
          if (expiredCerts.length > 0) aiResponse += `2. Upload renewed company certificates for ${expiredCerts.map(c => c.title).join(', ')}.\n`;
          if (expiredWorkers.length > 0) aiResponse += `3. Request renewed tickets for workers with expired qualifications.\n`;
        } else {
          aiResponse += `✅ **AI Verification**: All primary compliance checks look solid! Company is ready for Part F Operations & HSE sign-off.`;
        }
      }
    }
    // 2. Canadian WCB / COR Guidelines Query
    else if (cleanPrompt.includes('cor') || cleanPrompt.includes('wcb') || cleanPrompt.includes('canada') || cleanPrompt.includes('h2s')) {
      aiResponse = `🇨🇦 **Canadian Safety & Compliance AI Guide**:\n\n` +
        `• **WCB / WSIB Clearance**: Required for all Canadian job sites. Must list MAXX Industries Ltd with Waiver of Subrogation.\n` +
        `• **COR / SECOR Certificate**: Issued by Energy Safety Canada or provincial safety associations to verify a audited Health & Safety Management System.\n` +
        `• **H2S Alive Certification**: Mandatory 3-year Energy Safety Canada ticket required for high-hazard oilfield and facility entry.\n` +
        `• **CSTS-2020**: Construction Safety Training System standard required across western Canadian industrial worksites.`;
    }
    // 3. USA OSHA / EMR Guidelines Query
    else if (cleanPrompt.includes('osha') || cleanPrompt.includes('emr') || cleanPrompt.includes('trir') || cleanPrompt.includes('usa')) {
      aiResponse = `🇺🇸 **USA OSHA & Incident Rate AI Guide**:\n\n` +
        `• **TRIR (Total Recordable Injury Rate)**: Calculated as \`(Total Recordable Cases × 200,000) / Hours Worked\`. Baseline benchmark is < 1.00.\n` +
        `• **EMR (Experience Modification Rate)**: Rate rating provided by NCCI or insurance carrier. An EMR ≤ 1.00 reflects satisfactory safety performance.\n` +
        `• **OSHA 10/30-Hour Cards**: Required for all US site workers performing general industry or construction operations.\n` +
        `• **DOT 49 CFR Part 199/40**: Mandates anti-drug and alcohol testing policies for drivers and transport operators.`;
    }
    // 4. Default Interactive Response
    else {
      aiResponse = `🤖 **MAXX Safety AI Assistant**:\n\n` +
        `I am your built-in local Compliance & Audit AI Copilot! Here are things I can help you with:\n\n` +
        `1. *"Analyze current company audit"* - Run an instant safety risk diagnosis.\n` +
        `2. *"Explain Canadian COR and WCB requirements"* - Guide to Canadian regulatory standards.\n` +
        `3. *"How is TRIR and EMR calculated?"* - Overview of US OSHA incident rate benchmarks.\n` +
        `4. *"What certificates are required for workers?"* - Guide to delegated worker safety tickets.`;
    }

    res.json({ response: aiResponse });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to process AI chat request' });
  }
});

module.exports = router;
