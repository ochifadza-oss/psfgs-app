import { useState, useEffect } from 'react';
import { getBudgets, getBVMStats } from '../services/api';

export function BudgetMonitor() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBudgets({ financial_year: '2024/25' }), getBVMStats('2024/25')])
      .then(([b, s]) => { setBudgets(b.data); setStats(s.data); })
      .catch(() => { setBudgets([]); setStats({ total_budget: 0, total_spent: 0, total_commitment: 0, available: 0, utilization_pct: 0, overspent_votes: 0, total_votes: 0 }); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `R${(n / 1_000_000).toFixed(1)}M`;
  const pct = (spent: number, budget: number) => budget > 0 ? Math.round(spent / budget * 100) : 0;

  return (
    <div>
      <div className="domain-bar domain-b" />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Adjusted Budget</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.total_budget) : '-'}</div>
          <div className="stat-sub stat-info">FY 2024/25</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Year-to-Date Expenditure</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.total_spent) : '-'}</div>
          <div className="stat-sub stat-info">{stats?.utilization_pct || 0}% utilised</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Commitments</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.total_commitment) : '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Budget</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.available) : '-'}</div>
          <div className="stat-sub stat-warn">{stats?.overspent_votes || 0} votes over-spending</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Budget vs Actual by Vote - FY 2024/25</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vote</th>
                <th>Directorate</th>
                <th>Type</th>
                <th>Adjusted Budget</th>
                <th>YTD Spend</th>
                <th>Commitment</th>
                <th>Available</th>
                <th>Utilisation</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => {
                const util = pct(b.actual_spend, b.adjusted_budget);
                const isOver = b.ytd_variance_pct > 5;
                return (
                  <tr key={b.budget_id}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{b.vote_code}</td>
                    <td className="text-sm">{b.vote_description || b.directorate}</td>
                    <td><span className={`badge ${b.budget_type === 'Capital' ? 'badge-purple' : 'badge-blue'}`}>{b.budget_type}</span></td>
                    <td className="font-mono text-right">{fmt(b.adjusted_budget)}</td>
                    <td className="font-mono text-right">{fmt(b.actual_spend)}</td>
                    <td className="font-mono text-right">{fmt(b.commitment)}</td>
                    <td className="font-mono text-right">{fmt(b.available_budget)}</td>
                    <td>
                      <div className="flex-center gap-8">
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className={`progress-fill ${util > 80 ? 'fill-red' : util > 50 ? 'fill-amber' : 'fill-green'}`}
                               style={{ width: `${Math.min(util, 100)}%` }} />
                        </div>
                        <span className="text-sm">{util}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isOver ? 'badge-red' : b.ytd_variance_pct < -3 ? 'badge-amber' : 'badge-green'}`}>
                        {b.ytd_variance_pct > 0 ? '+' : ''}{b.ytd_variance_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {budgets.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 700, background: '#F8FAFB' }}>
                  <td colSpan={3}>TOTAL</td>
                  <td className="font-mono text-right">{fmt(budgets.reduce((s, b) => s + b.adjusted_budget, 0))}</td>
                  <td className="font-mono text-right">{fmt(budgets.reduce((s, b) => s + b.actual_spend, 0))}</td>
                  <td className="font-mono text-right">{fmt(budgets.reduce((s, b) => s + b.commitment, 0))}</td>
                  <td className="font-mono text-right">{fmt(budgets.reduce((s, b) => s + b.available_budget, 0))}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// Empty fallback data
const demoBudgets: any[] = [];
const demoStats = { total_budget: 0, total_spent: 0, total_commitment: 0, available: 0, utilization_pct: 0, overspent_votes: 0, total_votes: 0 };
