import React from 'react';
import { Layers, ListFilter, Network } from 'lucide-react';
import { SectionHeading, SourceBadge, MonoTag } from '../common/ui.jsx';
import { LineageGraph } from './LineageGraph.jsx';
import { maskData } from '../../utils/masking';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function ConnectedAccounts({
  selectedCustomer,
  viewMode,
  setViewMode,
  holdingsFilter,
  setHoldingsFilter,
  filteredSourceRecords,
  showMasked,
}) {
  return (
    <div className="card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
        <div>
          <SectionHeading icon={Layers} title="Connected Accounts & Investments" />
          <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: '-12px 0 0 0' }}>
            Source provenance across Equity, Mutual Funds, Insurance, Loans &amp; Wealth.
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--surface-sunk)', padding: 3, borderRadius: 6, border: '1px solid var(--line-200)' }}>
          <button
            onClick={() => setViewMode('LIST')}
            className={`segment ${viewMode === 'LIST' ? 'is-active' : ''}`}
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <ListFilter size={14} /> List View
          </button>
          <button
            onClick={() => setViewMode('GRAPH')}
            className={`segment ${viewMode === 'GRAPH' ? 'is-active' : ''}`}
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Network size={14} /> Visual Lineage Tree
          </button>
        </div>
      </div>

      {viewMode === 'LIST' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'ALL', label: 'All Silos' },
            { id: 'EQUITY', label: 'Equity' },
            { id: 'MUTUAL_FUNDS', label: 'Mutual Funds' },
            { id: 'INSURANCE', label: 'Insurance' },
            { id: 'LOANS', label: 'Loans' },
            { id: 'WEALTH', label: 'Wealth Mgmt' },
          ].map((silo) => {
            const isSelected = holdingsFilter === silo.id;
            return (
              <button
                key={silo.id}
                onClick={() => setHoldingsFilter(silo.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  border: isSelected ? '1px solid var(--brand-600)' : '1px solid var(--line-200)',
                  backgroundColor: isSelected ? 'var(--brand-050)' : 'var(--surface)',
                  color: isSelected ? 'var(--brand-700)' : 'var(--ink-700)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {silo.label}
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'GRAPH' ? (
        <LineageGraph customer={selectedCustomer} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredSourceRecords.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
              No accounts held in <strong>{holdingsFilter}</strong> for this customer.
            </div>
          ) : (
            filteredSourceRecords.map((src) => (
              <div key={src.sourceId} className="tile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px' }}>
                <div>
                  <SourceBadge system={src.sourceSystem} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '8px 0 3px 0' }}>
                    {src.name} <MonoTag>{src.sourceId}</MonoTag>
                  </p>
                  <p className="mono" style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
                    {maskData(src.email, 'EMAIL', showMasked)} · {maskData(src.mobile, 'MOBILE', showMasked)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Account Value</span>
                  <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', margin: '3px 0 0 0' }}>
                    {inr(src.value)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
