import { useState, useEffect } from 'react';
import { getS71Reports } from '../services/api';

export function Section71() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getS71Reports()
      .then(r => setReports(r.data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const onTime = reports.filter(r => r.days_after_month_end && r.days_after_month_end <= 10).length;
  const late = reports.filter(r => r.days_after_month_end && r.days_after_month_end > 10).length;

  return (
    <div>
      <div className="domain-bar domain-c" />
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Reports</div><div className="stat-value">{reports.length}</div></div>
        <div className="stat-card"><div className="stat-label">On Time (within 10 days)</div><div className="stat-value" style={{ color: 'var(--success)' }}>{onTime}</div></div>
        <div className="stat-card"><div className="stat-label">Late Submissions</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{late}</div></div>
        <div className="stat-card"><div className="stat-label">Compliance Target</div><div className="stat-value">10 days</div><div className="stat-sub text-muted">MFMA Section 71 requirement</div></div>
      </div>
      <div className="ai-panel">
        <div className="ai-header"><span className="ai-badge">CLAUDE AI</span><span style={{ fontSize: 12, fontWeight: 600 }}>Section 71 Analysis</span></div>
        <div className="ai-text">The Section 71 Auto-Generator produces monthly budget reports as prescribed by the MFMA. AI generates all NT-prescribed tables and narrative commentary for material variances automatically. Report preparation can be reduced from 2-3 weeks to <strong>under 4 hours</strong>.</div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Section 71 Monthly Reports</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Period</th><th>Status</th><th>Days After Month-End</th><th>Compliance</th><th>Submitted</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.report_id}>
                  <td style={{ fontWeight: 600 }}>{r.period}</td>
                  <td><span className={`badge ${r.status === 'Submitted' ? 'badge-green' : r.status === 'Late' ? 'badge-red' : 'badge-amber'}`}>{r.status?.replace(/_/g, ' ')}</span></td>
                  <td className="font-mono">{r.days_after_month_end || '-'}</td>
                  <td>{r.days_after_month_end ? (r.days_after_month_end <= 10 ? <span className="traffic tl-green" /> : <span className="traffic tl-red" />) : <span className="traffic tl-amber" />}</td>
                  <td className="text-sm">{r.submitted_date || 'Not yet submitted'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Empty fallback data
const demoReports: any[] = [];
