import React, { useState } from 'react';
import { HighlightedDiff } from '../utils/diffHelper';
import { Check, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button, SourceBadge, MonoTag, ConfidenceRing } from './ui.jsx';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function ConflictReviewCard({ item, onConfirmMerge, onSplit, isSteward }) {
  const srcA = item.sourceRecords[0] || {};
  const srcB = item.sourceRecords[1] || {};

  // Store which source's attribute survives in the Golden Record
  const [survivors, setSurvivors] = useState({
    name: 'srcA',
    mobile: 'srcA',
    email: 'srcA',
  });

  const handleSelect = (field, sourceKey) => {
    setSurvivors((prev) => ({ ...prev, [field]: sourceKey }));
  };

  const handleMergeCommit = () => {
    const chosenProfile = {
      fullName: survivors.name === 'srcA' ? srcA.name : srcB.name,
      mobile: survivors.mobile === 'srcA' ? srcA.mobile : srcB.mobile,
      email: survivors.email === 'srcA' ? srcA.email : srcB.email,
    };
    onConfirmMerge(item.goldenId, chosenProfile);
  };

  const fields = [
    { key: 'name', label: 'Full Name', valA: srcA.name, valB: srcB.name },
    { key: 'mobile', label: 'Mobile Contact', valA: srcA.mobile, valB: srcB.mobile },
    { key: 'email', label: 'Email Address', valA: srcA.email, valB: srcB.email },
  ];

  return (
    <div className="card" style={{
      borderColor: 'var(--warning-line)', borderLeft: '3px solid var(--warning-500)',
      padding: 20, marginBottom: 16,
    }}>
      {/* Header */}
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <ConfidenceRing value={item.matchConfidence} size={40} label="Match Score" />
          <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', margin: '12px 0 0 0' }}>
            {item.conflictField}
          </h4>
        </div>

        {isSteward ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="success" icon={Check} onClick={handleMergeCommit}>
              Combine Profiles with Selected Survivors
            </Button>
            <Button variant="outline-danger" icon={X} onClick={() => onSplit(item.goldenId)}>
              Keep Separate
            </Button>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--ink-400)', fontStyle: 'italic' }}>
            Reconciliation actions restricted to Data Stewards
          </span>
        )}
      </div>

      {/* Field-by-Field Selectable Precedence Matrix */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          SELECT SURVIVING ATTRIBUTES FOR GOLDEN RECORD
        </p>

        {fields.map((f) => {
          const hasDiff = f.valA !== f.valB;
          return (
            <div key={f.key} style={{
              display: 'grid', gridTemplateColumns: '130px 1fr 1fr', gap: 12,
              alignItems: 'center', background: 'var(--surface-sunk)', padding: '10px 12px',
              borderRadius: 6, border: '1px solid var(--line-100)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>
                {f.label}
              </span>

              {/* Option Source A */}
              <div
                onClick={() => isSteward && handleSelect(f.key, 'srcA')}
                style={{
                  padding: '8px 10px', borderRadius: 6, cursor: isSteward ? 'pointer' : 'default',
                  border: survivors[f.key] === 'srcA' ? '2px solid var(--brand-600)' : '1px solid var(--line-200)',
                  backgroundColor: survivors[f.key] === 'srcA' ? '#ffffff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                    {srcA.sourceSystem}:{' '}
                  </span>
                  <span className="mono">
                    <HighlightedDiff valueA={f.valA} valueB={f.valB} displayFor="A" />
                  </span>
                </div>
                {survivors[f.key] === 'srcA' && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-700)', background: 'var(--brand-050)', padding: '2px 5px', borderRadius: 4 }}>
                    SURVIVOR
                  </span>
                )}
              </div>

              {/* Option Source B */}
              <div
                onClick={() => isSteward && handleSelect(f.key, 'srcB')}
                style={{
                  padding: '8px 10px', borderRadius: 6, cursor: isSteward ? 'pointer' : 'default',
                  border: survivors[f.key] === 'srcB' ? '2px solid var(--brand-600)' : '1px solid var(--line-200)',
                  backgroundColor: survivors[f.key] === 'srcB' ? '#ffffff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                    {srcB.sourceSystem}:{' '}
                  </span>
                  <span className="mono">
                    <HighlightedDiff valueA={f.valA} valueB={f.valB} displayFor="B" />
                  </span>
                </div>
                {survivors[f.key] === 'srcB' && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-700)', background: 'var(--brand-050)', padding: '2px 5px', borderRadius: 4 }}>
                    SURVIVOR
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Balances Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-100)' }}>
        <div className="tile" style={{ padding: 10, fontSize: 12 }}>
          <SourceBadge system={srcA.sourceSystem} /> <MonoTag>{srcA.sourceId}</MonoTag>
          <p className="mono" style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--ink-900)' }}>
            Book Value: {inr(srcA.value)}
          </p>
        </div>
        <div className="tile" style={{ padding: 10, fontSize: 12 }}>
          <SourceBadge system={srcB.sourceSystem} /> <MonoTag>{srcB.sourceId}</MonoTag>
          <p className="mono" style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--ink-900)' }}>
            Book Value: {inr(srcB.value)}
          </p>
        </div>
      </div>
    </div>
  );
}