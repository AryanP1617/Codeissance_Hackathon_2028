import React, { useState } from 'react';
import { Cpu, Plus, Layers, ArrowRight, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { SectionHeading, Button, MonoTag, Chip } from './common/ui.jsx';

export function SiloSimulator({ rules = {}, onCommitNewCustomer }) {
  const [formData, setFormData] = useState({
    fullName: 'Rahul K. Verma',
    pan: 'CVERM9012L',
    mobile: '9811122233',
    email: 'r.verma@fintech.in',
    city: 'Delhi NCR',
    siloSystem: 'EQUITY',
    value: 500000,
  });

  const [simulatedResult, setSimulatedResult] = useState(null);

  const calculateScore = () => {
    const panWeight = rules.panWeight || 50;
    const mobileWeight = rules.mobileWeight || 25;
    const emailWeight = rules.emailWeight || 15;
    const nameWeight = rules.nameWeight || 10;

    let score = 0;
    const criteria = [];

    // PAN match check
    if (formData.pan && formData.pan !== 'NOT_PROVIDED') {
      score += (100 * panWeight) / 100;
      criteria.push({ field: 'PAN', type: 'Deterministic', score: 100, passed: true, weight: panWeight });
    } else {
      criteria.push({ field: 'PAN', type: 'Deterministic', score: 0, passed: false, weight: panWeight });
    }

    // Mobile match check
    if (formData.mobile) {
      score += (100 * mobileWeight) / 100;
      criteria.push({ field: 'Mobile', type: 'Deterministic', score: 100, passed: true, weight: mobileWeight });
    } else {
      criteria.push({ field: 'Mobile', type: 'Deterministic', score: 0, passed: false, weight: mobileWeight });
    }

    // Email check
    if (formData.email) {
      score += (80 * emailWeight) / 100;
      criteria.push({ field: 'Email', type: 'Probabilistic', score: 80, passed: true, weight: emailWeight });
    }

    // Name check
    if (formData.fullName) {
      score += (90 * nameWeight) / 100;
      criteria.push({ field: 'Name', type: 'Fuzzy', score: 90, passed: true, weight: nameWeight });
    }

    const finalConfidence = Math.round(score);
    const autoMergeThreshold = rules.autoMergeThreshold || 85;
    const manualReviewThreshold = rules.manualReviewThreshold || 60;

    let status = 'AUTO_MERGED';
    if (finalConfidence >= autoMergeThreshold) {
      status = 'AUTO_MERGED';
    } else if (finalConfidence >= manualReviewThreshold) {
      status = 'MANUAL_REVIEW';
    } else {
      status = 'SPLIT_REJECTED';
    }

    const result = {
      goldenId: `GC-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: formData.fullName,
      city: formData.city,
      segment: 'Affluent',
      totalRelationshipValue: Number(formData.value) || 350000,
      pan: formData.pan,
      mobile: formData.mobile,
      email: formData.email,
      matchConfidence: finalConfidence,
      status,
      hasConflict: status === 'MANUAL_REVIEW',
      conflictField: status === 'MANUAL_REVIEW' ? 'Unresolved email domain variance across silos' : null,
      matchCriteria: criteria,
      sourceRecords: [
        {
          sourceSystem: formData.siloSystem,
          sourceId: `${formData.siloSystem.slice(0, 2)}-${Math.floor(100 + Math.random() * 900)}`,
          name: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          value: Number(formData.value) || 350000,
        },
      ],
    };

    setSimulatedResult(result);
  };

  const handleCommit = () => {
    if (simulatedResult && onCommitNewCustomer) {
      onCommitNewCustomer(simulatedResult);
    }
  };

  return (
    <div className="card" style={{ padding: 28 }}>
      <SectionHeading
        icon={Cpu}
        title="Multi-Silo Ingestion & Identity Stitch Simulator"
        description="Ingest a new raw record from a financial silo and observe real-time resolution scoring against active rule configurations."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Form Column */}
        <form
          onSubmit={(e) => { e.preventDefault(); calculateScore(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                PAN Number
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Mobile Number
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Originating Silo System
              </label>
              <select
                value={formData.siloSystem}
                onChange={(e) => setFormData({ ...formData, siloSystem: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              >
                <option value="EQUITY">Equity Core DB</option>
                <option value="MUTUAL_FUNDS">Mutual Funds Registry</option>
                <option value="INSURANCE">Insurance System</option>
                <option value="LOANS">Lending Platform</option>
                <option value="WEALTH">Wealth Management</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Asset Value (₹ INR)
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <Button variant="primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: 11, marginTop: 6 }}>
            Run Real-Time Resolution Engine
          </Button>
        </form>

        {/* Output Results Column */}
        <div className="tile" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--ink-900)', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Simulation Output Engine
            </p>

            {!simulatedResult ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-400)', fontSize: 13 }}>
                Fill in the record fields and click <strong>Run Real-Time Resolution Engine</strong> to preview identity stitching.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <MonoTag>Golden ID: {simulatedResult.goldenId}</MonoTag>
                  <Chip
                    tone={simulatedResult.status === 'AUTO_MERGED' ? 'success' : simulatedResult.status === 'MANUAL_REVIEW' ? 'warning' : 'neutral'}
                  >
                    {simulatedResult.status.replace('_', ' ')}
                  </Chip>
                </div>

                <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--line-200)' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink-900)' }}>
                    {simulatedResult.fullName}
                  </p>
                  <p className="mono" style={{ fontSize: 13, color: 'var(--brand-700)', fontWeight: 700, margin: 0 }}>
                    Confidence Score: {simulatedResult.matchConfidence}%
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {simulatedResult.matchCriteria.map((c) => (
                    <div key={c.field} style={{ fontSize: 12, padding: '6px 10px', background: 'var(--surface-sunk)', borderRadius: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink-700)' }}>{c.field}: </span>
                      <span className="mono" style={{ color: c.passed ? 'var(--success-700)' : 'var(--danger-700)', fontWeight: 700 }}>
                        {c.score}% ({c.passed ? 'Pass' : 'Fail'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {simulatedResult && (
            <Button variant="primary" onClick={handleCommit} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              Commit Golden Record to State ➔
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
