import React from 'react';
import { MonoTag, Chip } from '../common/ui.jsx';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function CustomerSidebar({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  statusMeta,
}) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.06em' }}>
        All Customers ({customers.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {customers.map((c) => {
          const isSel = selectedCustomerId === c.goldenId;
          const meta = statusMeta[c.status] || statusMeta.AUTO_MERGED;
          return (
            <button
              key={c.goldenId}
              onClick={() => onSelectCustomer(c.goldenId)}
              className={`customer-row ${isSel ? 'is-selected' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <MonoTag>{c.goldenId}</MonoTag>
                <Chip tone={meta.tone} icon={meta.icon}>{meta.label}</Chip>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '10px 0 3px 0' }}>{c.fullName}</p>
              <p className="mono" style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
                {inr(c.totalRelationshipValue)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
