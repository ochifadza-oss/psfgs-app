import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../services/api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setData(res.data))
      .catch(() => {
        // Empty fallback when API unavailable
        setData({
          entity_name: '',
          audit: { total_findings: 0, open_findings: 0, overdue_findings: 0, repeat_findings: 0,
            audit_history: []},
          ifwe: { total_amount: 0, total_items: 0, open_items: 0 },
          budget: { total_budget: 0, total_spent: 0, utilization_pct: 0 },
          scm: { total_requisitions: 0, passed: 0, failed: 0, compliance_rate: 0 },
          consequence_management: { active_cases: 0 },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#5A6478' }}>Loading dashboard...</div>;
  if (!data) return <div>Error loading dashboard</div>;

  const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `R${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(0)}M`;
    if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
    return `R${n.toFixed(0)}`;
  };

  return (
    <div>
      <div className="ai-panel">
        <div className="ai-header">
          <span className="ai-badge">CLAUDE AI</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1F3864' }}>Governance Health Summary</span>
        </div>
        <div className="ai-text">
          Review your governance dashboard for current audit findings, IFWE balance, budget utilisation, and SCM compliance metrics. Use the modules to drill into specific areas.
          Current budget utilisation is at <strong>{data.budget.utilization_pct}%</strong> with {data.scm.compliance_rate}% SCM compliance rate.
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Audit Findings (2023/24)</div>
          <div className="stat-value">{data.audit.total_findings}</div>
          <div className="stat-sub stat-danger">{data.audit.overdue_findings} overdue &middot; {data.audit.repeat_findings} repeats</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accumulated IFWE Balance</div>
          <div className="stat-value">{fmt(data.ifwe.total_amount)}</div>
          <div className="stat-sub stat-danger">{data.ifwe.open_items} of {data.ifwe.total_items} items unresolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Budget Utilisation (2024/25)</div>
          <div className="stat-value">{data.budget.utilization_pct}%</div>
          <div className="stat-sub stat-info">{fmt(data.budget.total_spent)} of {fmt(data.budget.total_budget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SCM Compliance Rate</div>
          <div className="stat-value">{data.scm.compliance_rate}%</div>
          <div className="stat-sub stat-warn">{data.scm.failed} of {data.scm.total_requisitions} failed checks</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Audit Opinion History (5 Years)</span>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Opinion</th>
                  <th>Findings</th>
                  <th>Closed</th>
                  <th>Closure Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.audit_history.map((ay: any) => (
                  <tr key={ay.year}>
                    <td style={{ fontWeight: 600 }}>{ay.year}</td>
                    <td>
                      <span className={`badge ${ay.opinion === 'Qualified' ? 'badge-red' : ay.opinion === 'Clean' ? 'badge-green' : 'badge-gray'}`}>
                        {ay.opinion || 'In Progress'}
                      </span>
                    </td>
                    <td>{ay.total}</td>
                    <td>{ay.closed}</td>
                    <td>
                      <div className="flex-center gap-8">
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className={`progress-fill ${ay.total > 0 && ay.closed / ay.total > 0.5 ? 'fill-green' : 'fill-red'}`}
                               style={{ width: `${ay.total > 0 ? (ay.closed / ay.total * 100) : 0}%` }} />
                        </div>
                        <span className="text-sm text-muted">{ay.total > 0 ? Math.round(ay.closed / ay.total * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Risk Summary</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>Audit Readiness</span>
                <span className="badge badge-red">High Risk</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fill-red" style={{ width: '30%' }} /></div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>{data.audit.total_findings > 0 ? Math.round((data.audit.total_findings - data.audit.open_findings) / data.audit.total_findings * 100) : 0}% of findings closed &middot; {data.audit.overdue_findings} overdue items</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>IFWE Management</span>
                <span className="badge badge-red">Critical</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fill-red" style={{ width: '15%' }} /></div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>{fmt(data.ifwe.total_amount)} accumulated &middot; {data.ifwe.open_items} open items</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>Budget Control</span>
                <span className="badge badge-amber">Watch</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fill-amber" style={{ width: '60%' }} /></div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>Spending on track but Section 71 compliance issues</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>SCM Compliance</span>
                <span className="badge badge-red">High Risk</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fill-red" style={{ width: '40%' }} /></div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>{data.scm.compliance_rate}% pass rate &middot; ongoing irregular expenditure</div>
            </div>
            <div>
              <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>Consequence Management</span>
                <span className="badge badge-red">Critical</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fill-red" style={{ width: '10%' }} /></div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>{data.consequence_management.active_cases} active cases</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
