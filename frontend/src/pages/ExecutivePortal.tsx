import { useState } from 'react';

export function ExecutivePortal() {
  return (
    <div>
      <div className="domain-bar domain-c" />
      <div className="ai-panel">
        <div className="ai-header"><span className="ai-badge">CLAUDE AI</span><span style={{ fontSize: 12, fontWeight: 600 }}>Monthly Governance Briefing - October 2024</span></div>
        <div className="ai-text">
          <p style={{ marginBottom: 8 }}><strong>Municipal Manager & Mayor Briefing:</strong></p>
          <p style={{ marginBottom: 8 }}>This portal provides a consolidated governance health overview across all domains. Review the domain cards below for current risk ratings and key metrics.</p>
          <p style={{ marginBottom: 8 }}>Use the individual modules for detailed drill-down into audit findings, IFWE register, budget monitoring, SCM compliance, consequence management, and reporting.</p>
          <p>AI-generated insights will appear here once data is loaded from the backend.</p>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header"><span className="card-title">Domain A: Audit Readiness</span></div>
          <div className="card-body">
            <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-sm">Overall Health</span>
              <span className="badge badge-red">High Risk</span>
            </div>
            <div className="progress-bar mb-16"><div className="progress-fill fill-red" style={{ width: '25%' }} /></div>
            <div className="text-sm text-muted">Review audit findings status</div>
            <div className="text-sm text-muted">Check FAR reconciliation progress</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Domain B: Financial Control</span></div>
          <div className="card-body">
            <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-sm">Overall Health</span>
              <span className="badge badge-amber">Watch</span>
            </div>
            <div className="progress-bar mb-16"><div className="progress-fill fill-amber" style={{ width: '55%' }} /></div>
            <div className="text-sm text-muted">Review IFWE register balance</div>
            <div className="text-sm text-muted">Monitor budget utilisation</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Domain C: Reporting</span></div>
          <div className="card-body">
            <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-sm">Overall Health</span>
              <span className="badge badge-amber">Improving</span>
            </div>
            <div className="progress-bar mb-16"><div className="progress-fill fill-amber" style={{ width: '50%' }} /></div>
            <div className="text-sm text-muted">S71 compliance target: 10 days</div>
            <div className="text-sm text-muted">Review KPI achievement status</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><span className="card-title">Domain D: Compliance & Risk</span></div>
        <div className="card-body">
          <div className="grid-3">
            <div>
              <div className="text-sm" style={{ fontWeight: 600, marginBottom: 8 }}>SCM Compliance</div>
              <div className="stat-value" style={{ fontSize: 28 }}>-</div>
              <div className="text-sm stat-danger">Pass rate on pre-transaction checks</div>
            </div>
            <div>
              <div className="text-sm" style={{ fontWeight: 600, marginBottom: 8 }}>Consequence Management</div>
              <div className="stat-value" style={{ fontSize: 28 }}>-</div>
              <div className="text-sm stat-danger">Active cases</div>
            </div>
            <div>
              <div className="text-sm" style={{ fontWeight: 600, marginBottom: 8 }}>Policy Compliance</div>
              <div className="stat-value" style={{ fontSize: 28 }}>-</div>
              <div className="text-sm stat-warn">Review policy register status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
