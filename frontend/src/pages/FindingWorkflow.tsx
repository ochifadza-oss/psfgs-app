export function FindingWorkflow() {
  const stages = [
    {
      id: 1, status: 'New', color: '#2E75B6', bg: '#EEF5FC',
      icon: '📋', actor: 'AGSA / Internal Audit',
      role: 'Auditor / System Admin',
      email: 'audit@buffalocity.gov.za',
      description: 'Audit finding is raised from the AG Management Letter or internal audit report and captured in the system.',
      actions: ['Capture AG reference number', 'Classify finding type & severity', 'Attach source document', 'Set financial impact'],
      duration: 'Day 1',
    },
    {
      id: 2, status: 'Assigned', color: '#1F3864', bg: '#E8EDF5',
      icon: '👤', actor: 'City Manager / CFO',
      role: 'Accounting Officer',
      email: 'cm@buffalocity.gov.za',
      description: 'Accounting Officer assigns the finding to the responsible directorate manager with a due date for resolution.',
      actions: ['Select responsible directorate', 'Assign to specific official', 'Set resolution due date', 'Issue written directive'],
      duration: 'Day 1–3',
    },
    {
      id: 3, status: 'In_Progress', color: '#7F5A00', bg: '#FFF8E6',
      icon: '⚙️', actor: 'Directorate Manager',
      role: 'Manager / Director',
      email: 'manager.eis@buffalocity.gov.za',
      description: 'Responsible directorate takes corrective action — policy changes, recoveries, process improvements, or training.',
      actions: ['Implement corrective actions', 'Document root cause analysis', 'Prepare action plan', 'Update progress weekly'],
      duration: 'Day 3–60',
    },
    {
      id: 4, status: 'Evidence_Submitted', color: '#1D6A72', bg: '#EBF7F8',
      icon: '📎', actor: 'Directorate Officer',
      role: 'Officer',
      email: 'officer.eis@buffalocity.gov.za',
      description: 'Supporting evidence is compiled and submitted — invoices, policy documents, training certificates, journal entries.',
      actions: ['Upload supporting documents', 'Submit remediation report', 'Provide proof of payment/recovery', 'Sign off checklist'],
      duration: 'Day 60–75',
    },
    {
      id: 5, status: 'Under_Review', color: '#3D2F7A', bg: '#F2EFF9',
      icon: '🔍', actor: 'Internal Audit / CFO',
      role: 'Auditor / CFO',
      email: 'director.ia@buffalocity.gov.za',
      description: 'Internal Audit independently reviews the submitted evidence and validates that the corrective action is adequate.',
      actions: ['Review evidence completeness', 'Test effectiveness of controls', 'Verify financial recovery', 'Issue audit review memo'],
      duration: 'Day 75–85',
    },
    {
      id: 6, status: 'Closed', color: '#1A6B3C', bg: '#eef8f2',
      icon: '✅', actor: 'City Manager / CFO',
      role: 'Accounting Officer / CFO',
      email: 'cfo@buffalocity.gov.za',
      description: 'Finding is formally closed after Internal Audit confirms adequate remediation. AG notified for clearance in next audit.',
      actions: ['Sign closure certificate', 'Update AG response register', 'Notify AGSA of resolution', 'Archive on record'],
      duration: 'Day 85–90',
    },
  ];

  const escalation = {
    status: 'Overdue',
    color: '#8B2500', bg: '#FFF0EC',
    icon: '⚠️',
    description: 'Finding not resolved within 90 days — automatic escalation to Accounting Officer, then to Council MPAC.',
    actions: ['Email alert to AO & CFO', 'MPAC notification', 'Consequence management referral', 'AG interim management letter'],
  };

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #1F3864 0%, #2E75B6 100%)', color: '#fff' }}>
        <div style={{ padding: '8px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Audit Finding Lifecycle — Engineering & Infrastructure Services</h2>
          <p style={{ fontSize: 12, opacity: 0.85 }}>
            End-to-end workflow from AGSA identification through to formal closure · MFMA Section 32 & 131 Compliant
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 11 }}>
            <span>📅 Target resolution: <strong>90 days</strong></span>
            <span>📁 Directorate: <strong>Engineering &amp; Infrastructure (EIS)</strong></span>
            <span>⚖️ Legislative basis: <strong>MFMA, AGSA findings protocol</strong></span>
          </div>
        </div>
      </div>

      {/* Main flow */}
      <div style={{ position: 'relative' }}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', gap: 0, marginBottom: 0 }}>

            {/* Timeline spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: stage.color,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, boxShadow: `0 0 0 4px ${stage.bg}`, zIndex: 1, flexShrink: 0,
              }}>
                {stage.id}
              </div>
              {i < stages.length - 1 && (
                <div style={{ width: 3, flex: 1, minHeight: 32, background: `linear-gradient(${stage.color}, ${stages[i+1].color})`, margin: '4px 0' }} />
              )}
            </div>

            {/* Stage card */}
            <div style={{ flex: 1, marginLeft: 16, marginBottom: 16 }}>
              <div className="card" style={{ borderLeft: `4px solid ${stage.color}`, padding: 0 }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: stage.bg, borderRadius: '8px 8px 0 0' }}>
                  <span style={{ fontSize: 22 }}>{stage.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: stage.color }}>Stage {stage.id}: {stage.status.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: stage.color, color: '#fff' }}>{stage.duration}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#5A6478', marginTop: 2 }}>
                      <strong>Actor:</strong> {stage.actor} &nbsp;·&nbsp;
                      <strong>Role:</strong> {stage.role} &nbsp;·&nbsp;
                      <span style={{ fontFamily: 'monospace' }}>{stage.email}</span>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: '#3A4255', marginBottom: 10, lineHeight: 1.6 }}>{stage.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {stage.actions.map((a, ai) => (
                        <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: '#5A6478' }}>
                          <span style={{ color: stage.color, fontWeight: 700, marginTop: 1 }}>✓</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Login badge */}
                  <div style={{ flexShrink: 0, background: '#F4F6F9', borderRadius: 8, padding: '10px 14px', fontSize: 11, minWidth: 180 }}>
                    <div style={{ fontWeight: 600, color: '#1F3864', marginBottom: 6 }}>🔐 Test Login</div>
                    <div style={{ color: '#5A6478', marginBottom: 2 }}>{stage.email}</div>
                    <div style={{ color: '#8B93A7' }}>Password: Admin@2026!</div>
                    <div style={{ marginTop: 8, padding: '4px 8px', background: stage.color, color: '#fff', borderRadius: 4, textAlign: 'center', fontSize: 10, fontWeight: 600 }}>
                      {stage.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Escalation branch */}
        <div style={{ display: 'flex', gap: 0, marginTop: 8 }}>
          <div style={{ width: 56, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 3, height: '100%', background: escalation.color, opacity: 0.3 }} />
          </div>
          <div style={{ flex: 1, marginLeft: 16 }}>
            <div className="card" style={{ borderLeft: `4px solid ${escalation.color}`, background: escalation.bg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 22 }}>{escalation.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: escalation.color, marginBottom: 4 }}>
                    ESCALATION PATH — Status: Overdue (&gt;90 days without resolution)
                  </div>
                  <p style={{ fontSize: 12, color: '#5A6478', marginBottom: 8 }}>{escalation.description}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {escalation.actions.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: escalation.color }}>
                        <span style={{ fontWeight: 700 }}>!</span> {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User directory table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">All Directorate Test Accounts — Password: Admin@2026!</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Directorate</th>
                <th>Role</th>
                <th>Full Name</th>
                <th>Email / Username</th>
                <th>Stage in Workflow</th>
              </tr>
            </thead>
            <tbody>
              {[
                { dir: 'Internal Audit', role: 'Auditor', name: 'N. Jikeka', email: 'audit@buffalocity.gov.za', stage: 'Stage 1 – Capture' },
                { dir: 'City Manager', role: 'Accounting Officer', name: 'A. Sihlahla', email: 'cm@buffalocity.gov.za', stage: 'Stage 2 – Assign' },
                { dir: 'EIS', role: 'Director', name: 'M. Cekiso', email: 'director.eis@buffalocity.gov.za', stage: 'Stage 3 – In Progress' },
                { dir: 'EIS', role: 'Manager', name: 'S. Dlulane', email: 'manager.eis@buffalocity.gov.za', stage: 'Stage 3 – In Progress' },
                { dir: 'EIS', role: 'Officer', name: 'R. Mbeki', email: 'officer.eis@buffalocity.gov.za', stage: 'Stage 4 – Submit Evidence' },
                { dir: 'Internal Audit', role: 'Director (CAE)', name: 'V. Nolutshungu', email: 'director.ia@buffalocity.gov.za', stage: 'Stage 5 – Review' },
                { dir: 'Internal Audit', role: 'Auditor', name: 'P. Nondzaba', email: 'auditor2.ia@buffalocity.gov.za', stage: 'Stage 5 – Review' },
                { dir: 'CFO', role: 'CFO', name: 'L. Ngcobondwana', email: 'cfo@buffalocity.gov.za', stage: 'Stage 6 – Close' },
                { dir: 'Corporate Services', role: 'Director', name: 'L. Booi', email: 'director.cs@buffalocity.gov.za', stage: 'Stage 3 – CS findings' },
                { dir: 'Corporate Services', role: 'Manager', name: 'Y. Siwisa', email: 'manager.cs@buffalocity.gov.za', stage: 'Stage 3 – CS findings' },
                { dir: 'Corporate Services', role: 'Officer', name: 'K. Mjoli', email: 'officer.cs@buffalocity.gov.za', stage: 'Stage 4 – CS evidence' },
                { dir: 'Public Health', role: 'Director', name: 'Dr. A. Tika', email: 'director.ph@buffalocity.gov.za', stage: 'Stage 3 – PH findings' },
                { dir: 'Public Health', role: 'Manager', name: 'N. Mgidi', email: 'manager.ph@buffalocity.gov.za', stage: 'Stage 3 – PH findings' },
                { dir: 'Public Health', role: 'Officer', name: 'T. Plaatjie', email: 'officer.ph@buffalocity.gov.za', stage: 'Stage 4 – PH evidence' },
                { dir: 'Development Planning', role: 'Director', name: 'M. Ntloko', email: 'director.dp@buffalocity.gov.za', stage: 'Stage 3 – DP findings' },
                { dir: 'Human Settlements', role: 'Director', name: 'E. Ntlantsana', email: 'director.hs@buffalocity.gov.za', stage: 'Stage 3 – HS findings' },
                { dir: 'Public Safety', role: 'Director', name: 'I. Mzazi', email: 'director.ps@buffalocity.gov.za', stage: 'Stage 3 – PS findings' },
                { dir: 'SCM', role: 'Director', name: 'O. Mzaliswa', email: 'director.scm@buffalocity.gov.za', stage: 'Stage 3 – SCM findings' },
              ].map((u, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12 }}>{u.dir}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{u.role}</span></td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{u.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.email}</td>
                  <td style={{ fontSize: 11, color: '#5A6478' }}>{u.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
