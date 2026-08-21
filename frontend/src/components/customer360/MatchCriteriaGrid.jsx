import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { SectionHeading } from '../common/ui.jsx';

export function MatchCriteriaGrid({ selectedCustomer = {} }) {
  const criteria = selectedCustomer.matchCriteria || [];

  return (
    <div className="card" style={{ padding: 26 }}>
      <SectionHeading
        title="Why was this profile matched?"
        description="Field-level comparison across every source system linked to this golden record."
      />
      <div className="grid-criteria-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {criteria.map((crit) => (
          <div key={crit.field} className="tile" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{crit.field}</span>
              {crit.passed
                ? <CheckCircle2 size={16} color="var(--success-500)" />
                : <X size={16} color="var(--ink-300)" />}
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '6px 0 0 0' }}>{crit.type} match ({crit.weight}%)</p>
            <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '4px 0 0 0' }}>{crit.score}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
