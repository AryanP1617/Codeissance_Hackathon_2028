import React, { useState } from 'react';
import { HighlightedDiff } from '../utils/diffHelper';
import {
  Check, X, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { Button, SourceBadge, MonoTag, ConfidenceRing } from './common/ui.jsx';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function ConflictReviewCard({ item, onConfirmMerge, onSplit, isSteward }) {
  const srcA = item.sourceRecords[0] || {};
  const srcB = item.sourceRecords[1] || {};

  const [showFullInfo, setShowFullInfo] = useState(false);

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

  const allFields = [
    { key: 'name', label: 'Full Name', valA: srcA.name || '', valB: srcB.name || '' },
    { key: 'mobile', label: 'Mobile Contact', valA: srcA.mobile || '', valB: srcB.mobile || '' },
    { key: 'email', label: 'Email Address', valA: srcA.email || '', valB: srcB.email || '' },
  ];

  // Distinguish conflicting attributes from matched attributes
  const unmatchedFields = allFields.filter((f) => String(f.valA).trim() !== String(f.valB).trim());
  const matchedFields = allFields.filter((f) => String(f.valA).trim() === String(f.valB).trim());

  return (
    <div className="card" style={{
      borderColor: 'var(--warning-line)',
      borderLeft: '4px solid var(--warning-500)',
      padding: 24,
      marginBottom: 20,
    }}>
      {/* Top Header Row */}
      <div className="header-row" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        borderBottom: '1px solid var(--line-100)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ConfidenceRing value={item.matchConfidence} size={46} />
          <div>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
              Entity Flagged #{item.goldenId}
            </span>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: '2px 0 0 0' }}>
              {item.conflictField || `Discrepancy detected across ${unmatchedFields.length} field(s)`}
            </h4>
          </div>
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
          <span style={{ fontSize: 13, color: 'var(--ink-400)', fontStyle: 'italic' }}>
            Reconciliation actions restricted to Data Stewards
          </span>
        )}
      </div>

      {/* Primary Section: ONLY Conflicting / Unmatched Attributes */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="mono" style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--warning-700)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <AlertTriangle size={14} color="var(--warning-500)" />
            UNRESOLVED DISCREPANCIES ({unmatchedFields.length}) — SELECT SURVIVING ATTRIBUTE
          </p>

          <Button
            variant="secondary"
            icon={showFullInfo ? ChevronUp : ChevronDown}
            onClick={() => setShowFullInfo(!showFullInfo)}
            style={{ fontSize: 12, padding: '5px 12px' }}
          >
            {showFullInfo ? 'Hide Matched Info' : `More Info (${matchedFields.length} Matched Attributes)`}
          </Button>
        </div>

        {/* Render Conflicting Rows */}
        {unmatchedFields.map((f) => (
          <div
            key={f.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 1fr',
              gap: 14,
              alignItems: 'center',
              background: 'var(--surface-sunk)',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--warning-line)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
              {f.label}
            </span>

            {/* Option Source A */}
            <div
              onClick={() => isSteward && handleSelect(f.key, 'srcA')}
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                cursor: isSteward ? 'pointer' : 'default',
                border: survivors[f.key] === 'srcA' ? '2px solid var(--brand-500)' : '1px solid var(--line-200)',
                backgroundColor: survivors[f.key] === 'srcA' ? 'var(--brand-050)' : 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13.5,
              }}
            >
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                  {srcA.sourceSystem}:{' '}
                </span>
                <span className="mono">
                  <HighlightedDiff valueA={f.valA} valueB={f.valB} displayFor="A" />
                </span>
              </div>
              {survivors[f.key] === 'srcA' && (
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--brand-700)', background: 'var(--brand-100)', padding: '2px 6px', borderRadius: 4 }}>
                  SURVIVOR
                </span>
              )}
            </div>

            {/* Option Source B */}
            <div
              onClick={() => isSteward && handleSelect(f.key, 'srcB')}
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                cursor: isSteward ? 'pointer' : 'default',
                border: survivors[f.key] === 'srcB' ? '2px solid var(--brand-500)' : '1px solid var(--line-200)',
                backgroundColor: survivors[f.key] === 'srcB' ? 'var(--brand-050)' : 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13.5,
              }}
            >
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                  {srcB.sourceSystem}:{' '}
                </span>
                <span className="mono">
                  <HighlightedDiff valueA={f.valA} valueB={f.valB} displayFor="B" />
                </span>
              </div>
              {survivors[f.key] === 'srcB' && (
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--brand-700)', background: 'var(--brand-100)', padding: '2px 6px', borderRadius: 4 }}>
                  SURVIVOR
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible "More Info": Matched Data & Holding Assets */}
      {showFullInfo && (
        <div style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--line-200)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {/* 1. Matched Attributes Breakdown */}
          {matchedFields.length > 0 && (
            <div>
              <p className="mono" style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--success-700)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <CheckCircle2 size={13} color="var(--success-500)" />
                VERIFIED MATCHED ATTRIBUTES ({matchedFields.length})
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matchedFields.map((f) => (
                  <div
                    key={f.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr 1fr',
                      gap: 14,
                      alignItems: 'center',
                      background: 'var(--surface-sunk)',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--line-100)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>
                      {f.label}
                    </span>

                    <div className="tile" style={{ padding: '8px 12px', fontSize: 13 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                        {srcA.sourceSystem}:{' '}
                      </span>
                      <span className="mono" style={{ color: 'var(--ink-900)' }}>
                        {f.valA}
                      </span>
                    </div>

                    <div className="tile" style={{ padding: '8px 12px', fontSize: 13 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                        {srcB.sourceSystem}:{' '}
                      </span>
                      <span className="mono" style={{ color: 'var(--ink-900)' }}>
                        {f.valB}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Disparate Silo Source Account Balances */}
          <div>
            <p className="mono" style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 8
            }}>
              SILO SOURCE PROVENANCE &amp; BALANCES
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="tile" style={{ padding: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SourceBadge system={srcA.sourceSystem} />
                  <MonoTag>{srcA.sourceId}</MonoTag>
                </div>
                <p style={{ margin: '8px 0 2px 0', fontSize: 13, color: 'var(--ink-500)' }}>
                  Name on File: <strong style={{ color: 'var(--ink-900)' }}>{srcA.name}</strong>
                </p>
                <p className="mono" style={{ margin: '4px 0 0 0', fontWeight: 700, color: 'var(--ink-900)', fontSize: 14 }}>
                  Book Asset Value: {inr(srcA.value)}
                </p>
              </div>

              <div className="tile" style={{ padding: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SourceBadge system={srcB.sourceSystem} />
                  <MonoTag>{srcB.sourceId}</MonoTag>
                </div>
                <p style={{ margin: '8px 0 2px 0', fontSize: 13, color: 'var(--ink-500)' }}>
                  Name on File: <strong style={{ color: 'var(--ink-900)' }}>{srcB.name}</strong>
                </p>
                <p className="mono" style={{ margin: '4px 0 0 0', fontWeight: 700, color: 'var(--ink-900)', fontSize: 14 }}>
                  Book Asset Value: {inr(srcB.value)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}