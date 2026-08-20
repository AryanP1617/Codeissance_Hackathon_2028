import React, { useState } from 'react';
import {
  Sparkles, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  ChevronDown, ChevronUp, Layers, RefreshCw, PlusCircle, Database, Check
} from 'lucide-react';
import { MonoTag, Chip, Button, SourceBadge, ConfidenceRing, SectionHeading } from './ui.jsx';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Levenshtein similarity for Name fuzzy matching
function calculateSimilarity(str1 = '', str2 = '') {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 85;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

export function SiloSimulator({ rules, onCommitNewCustomer }) {
  // Silo A Input State
  const [siloA, setSiloA] = useState({
    system: 'EQUITY',
    sourceId: 'EQ-9921',
    name: 'Aditya Sharma',
    pan: 'ABCPS1234K',
    mobile: '9820011223',
    email: 'aditya.sharma@invest.in',
    value: 1500000,
  });

  // Silo B Input State
  const [siloB, setSiloB] = useState({
    system: 'INSURANCE',
    sourceId: 'IN-4410',
    name: 'Aditya K. Sharma',
    pan: 'ABCPS1234K',
    mobile: '9820011223',
    email: 'aditya.personal@gmail.com',
    value: 800000,
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [committedToast, setCommittedToast] = useState(false);

  // Demo presets for live judge demonstration
  const handleLoadPreset = (presetType) => {
    setCommittedToast(false);
    if (presetType === 'EMAIL_CONFLICT') {
      setSiloA({
        system: 'EQUITY',
        sourceId: 'EQ-8001',
        name: 'Rohan Verma',
        pan: 'ABCPS9988M',
        mobile: '9811122334',
        email: 'rohan.verma@corp.com',
        value: 1250000,
      });
      setSiloB({
        system: 'MUTUAL_FUNDS',
        sourceId: 'MF-3320',
        name: 'Rohan Verma',
        pan: 'ABCPS9988M',
        mobile: '9811122334',
        email: 'r.verma88@gmail.com',
        value: 450000,
      });
    } else if (presetType === 'NAME_TYPO') {
      setSiloA({
        system: 'LOANS',
        sourceId: 'LN-504',
        name: 'Rajesh K. Gupta',
        pan: 'GUPTR4455Q',
        mobile: '9876543210',
        email: 'rajesh.gupta@fin.in',
        value: 2200000,
      });
      setSiloB({
        system: 'WEALTH',
        sourceId: 'WM-109',
        name: 'Rajesh Kumar Gupta',
        pan: 'GUPTR4455Q',
        mobile: '9876543210',
        email: 'rajesh.gupta@fin.in',
        value: 3500000,
      });
    } else {
      // Disjoint record
      setSiloA({
        system: 'LOANS',
        sourceId: 'LN-771',
        name: 'Sunil Nair',
        pan: 'NAIRS3322P',
        mobile: '9822233344',
        email: 'sunil.nair@mail.com',
        value: 900000,
      });
      setSiloB({
        system: 'INSURANCE',
        sourceId: 'IN-908',
        name: 'Anil Nair',
        pan: 'NOT_PROVIDED',
        mobile: '9899988877',
        email: 'anil.nair@other.com',
        value: 300000,
      });
    }
  };

  // Run the Heuristic Scoring Engine
  const runSimulation = () => {
    setCommittedToast(false);

    // 1. Attribute scores
    const panScore = (siloA.pan && siloB.pan && siloA.pan.trim().toUpperCase() === siloB.pan.trim().toUpperCase()) ? 100 : 0;
    const mobileScore = (siloA.mobile && siloB.mobile && siloA.mobile.trim() === siloB.mobile.trim()) ? 100 : 0;
    const emailScore = (siloA.email && siloB.email && siloA.email.trim().toLowerCase() === siloB.email.trim().toLowerCase()) ? 100 : (siloA.email && siloB.email && siloA.email.split('@')[0] === siloB.email.split('@')[0]) ? 70 : 0;
    const nameScore = calculateSimilarity(siloA.name, siloB.name);

    // 2. Weights lookup
    const panW = rules.panWeight || 50;
    const mobileW = rules.mobileWeight || 25;
    const emailW = rules.emailWeight || 15;
    const nameW = rules.nameWeight || 10;

    // 3. Composite score
    const totalScore = Math.round(
      (panScore * panW + mobileScore * mobileW + emailScore * emailW + nameScore * nameW) / 100
    );

    // 4. Decision threshold classification
    let status = 'SPLIT_REJECTED';
    let decisionText = 'Keep Separate (Low Confidence)';
    let decisionTone = 'danger';

    if (totalScore >= rules.autoMergeThreshold) {
      status = 'AUTO_MERGED';
      decisionText = 'Auto-Merge Stitching (Deterministic High-Fidelity)';
      decisionTone = 'success';
    } else if (totalScore >= rules.manualReviewThreshold) {
      status = 'MANUAL_REVIEW';
      decisionText = 'Route to Data Steward Review Queue';
      decisionTone = 'warning';
    }

    const allAttributes = [
      {
        field: 'PAN Number',
        valA: siloA.pan || 'N/A',
        valB: siloB.pan || 'N/A',
        isMatch: panScore === 100,
        score: panScore,
        weight: panW,
      },
      {
        field: 'Mobile Number',
        valA: siloA.mobile || 'N/A',
        valB: siloB.mobile || 'N/A',
        isMatch: mobileScore === 100,
        score: mobileScore,
        weight: mobileW,
      },
      {
        field: 'Email Address',
        valA: siloA.email || 'N/A',
        valB: siloB.email || 'N/A',
        isMatch: emailScore === 100,
        score: emailScore,
        weight: emailW,
      },
      {
        field: 'Customer Name',
        valA: siloA.name || 'N/A',
        valB: siloB.name || 'N/A',
        isMatch: nameScore >= 95,
        score: nameScore,
        weight: nameW,
      },
    ];

    const unmatchedAttributes = allAttributes.filter((attr) => !attr.isMatch);

    setSimulationResult({
      totalScore,
      status,
      decisionText,
      decisionTone,
      allAttributes,
      unmatchedAttributes,
      combinedRelationshipValue: Number(siloA.value || 0) + Number(siloB.value || 0),
    });
  };

  const handleCommitRecord = () => {
    if (!simulationResult) return;
    const newGoldenId = `GC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCustomer = {
      goldenId: newGoldenId,
      fullName: siloA.name,
      city: 'Mumbai',
      segment: simulationResult.combinedRelationshipValue > 1000000 ? 'Private Wealth' : 'Affluent',
      totalRelationshipValue: simulationResult.combinedRelationshipValue,
      pan: siloA.pan || siloB.pan,
      mobile: siloA.mobile || siloB.mobile,
      email: siloA.email,
      matchConfidence: simulationResult.totalScore,
      status: simulationResult.status,
      hasConflict: simulationResult.unmatchedAttributes.length > 0,
      conflictField: simulationResult.unmatchedAttributes.length > 0
        ? `Discrepancy detected across: ${simulationResult.unmatchedAttributes.map((u) => u.field).join(', ')}`
        : null,
      matchCriteria: simulationResult.allAttributes.map((attr) => ({
        field: attr.field.split(' ')[0],
        type: attr.field === 'Name' ? 'Fuzzy' : 'Deterministic',
        score: attr.score,
        passed: attr.isMatch,
        weight: attr.weight,
      })),
      sourceRecords: [
        {
          sourceSystem: siloA.system,
          sourceId: siloA.sourceId,
          name: siloA.name,
          email: siloA.email,
          mobile: siloA.mobile,
          value: Number(siloA.value || 0),
        },
        {
          sourceSystem: siloB.system,
          sourceId: siloB.sourceId,
          name: siloB.name,
          email: siloB.email,
          mobile: siloB.mobile,
          value: Number(siloB.value || 0),
        },
      ],
    };

    onCommitNewCustomer(newCustomer);
    setCommittedToast(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header card with simulation presets */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <SectionHeading
              icon={Sparkles}
              title="Multi-Silo Record Matching & Discrepancy Simulator"
              description="Simulate identical or fragmented customer accounts arriving from distinct lines of business. Test heuristic confidence scores and isolate only the conflicting attributes."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
              Load Demo Presets:
            </span>
            <button
              onClick={() => handleLoadPreset('EMAIL_CONFLICT')}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: 'var(--surface-sunk)', border: '1px solid var(--line-200)',
                color: 'var(--ink-700)', cursor: 'pointer'
              }}
            >
              Email Discrepancy
            </button>
            <button
              onClick={() => handleLoadPreset('NAME_TYPO')}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: 'var(--surface-sunk)', border: '1px solid var(--line-200)',
                color: 'var(--ink-700)', cursor: 'pointer'
              }}
            >
              Name Fuzzy Match
            </button>
            <button
              onClick={() => handleLoadPreset('DISJOINT')}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: 'var(--surface-sunk)', border: '1px solid var(--line-200)',
                color: 'var(--ink-700)', cursor: 'pointer'
              }}
            >
              Distinct / Disjoint
            </button>
          </div>
        </div>

        {/* Input Form: Silo A vs Silo B */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 14 }}>
          {/* Silo A Card */}
          <div className="tile" style={{ padding: 18, borderTop: '3px solid var(--brand-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
                Source Record 1 (Silo A)
              </span>
              <select
                value={siloA.system}
                onChange={(e) => setSiloA({ ...siloA, system: e.target.value })}
                style={{
                  padding: '4px 8px', fontSize: 12, fontWeight: 600,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  background: 'var(--surface)', color: 'var(--ink-900)'
                }}
              >
                <option value="EQUITY">EQUITY</option>
                <option value="MUTUAL_FUNDS">MUTUAL_FUNDS</option>
                <option value="INSURANCE">INSURANCE</option>
                <option value="LOANS">LOANS</option>
                <option value="WEALTH">WEALTH</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={siloA.name}
                  onChange={(e) => setSiloA({ ...siloA, name: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={siloA.pan}
                    onChange={(e) => setSiloA({ ...siloA, pan: e.target.value.toUpperCase() })}
                    className="mono"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={siloA.mobile}
                    onChange={(e) => setSiloA({ ...siloA, mobile: e.target.value })}
                    className="mono"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={siloA.email}
                    onChange={(e) => setSiloA({ ...siloA, email: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    Holding Value (₹)
                  </label>
                  <input
                    type="number"
                    value={siloA.value}
                    onChange={(e) => setSiloA({ ...siloA, value: e.target.value })}
                    className="mono"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Silo B Card */}
          <div className="tile" style={{ padding: 18, borderTop: '3px solid var(--gold-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
                Source Record 2 (Silo B)
              </span>
              <select
                value={siloB.system}
                onChange={(e) => setSiloB({ ...siloB, system: e.target.value })}
                style={{
                  padding: '4px 8px', fontSize: 12, fontWeight: 600,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  background: 'var(--surface)', color: 'var(--ink-900)'
                }}
              >
                <option value="EQUITY">EQUITY</option>
                <option value="MUTUAL_FUNDS">MUTUAL_FUNDS</option>
                <option value="INSURANCE">INSURANCE</option>
                <option value="LOANS">LOANS</option>
                <option value="WEALTH">WEALTH</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={siloB.name}
                  onChange={(e) => setSiloB({ ...siloB, name: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={siloB.pan}
                    onChange={(e) => setSiloB({ ...siloB, pan: e.target.value.toUpperCase() })}
                    className="mono"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={siloB.mobile}
                    onChange={(e) => setSiloB({ ...siloB, mobile: e.target.value })}
                    className="mono"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={siloB.email}
                    onChange={(e) => setSiloB({ ...siloB, email: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 3 }}>
                    Holding Value (₹)
                  </label>
                  <input
                    type="number"
                    value={siloB.value}
                    onChange={(e) => setSiloB({ ...siloB, value: e.target.value })}
                    className="mono"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line-300)', background: 'var(--surface)', color: 'var(--ink-900)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            icon={RefreshCw}
            onClick={runSimulation}
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            Run Heuristic Match Scoring
          </Button>
        </div>
      </div>

      {/* Simulation Result Presentation */}
      {simulationResult && (
        <div className="card" style={{ padding: 24, borderLeft: `4px solid var(--${simulationResult.decisionTone}-500)` }}>
          {/* Header Score Overview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--line-200)', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ConfidenceRing value={simulationResult.totalScore} size={54} />
              <div>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                  Simulated Engine Verdict
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', margin: '2px 0 0 0' }}>
                  {simulationResult.decisionText}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="secondary"
                icon={showFullInfo ? ChevronUp : ChevronDown}
                onClick={() => setShowFullInfo(!showFullInfo)}
              >
                {showFullInfo ? 'Hide Detailed Info' : 'More Info (Full Breakdown)'}
              </Button>
              <Button
                variant="success"
                icon={Check}
                onClick={handleCommitRecord}
              >
                Ingest to Live Directory
              </Button>
            </div>
          </div>

          {committedToast && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 6,
              background: 'var(--success-100)', color: 'var(--success-700)',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle2 size={16} /> Record successfully ingested into directory. Check "Customer Overview" or "Needs Review".
            </div>
          )}

          {/* Primary View: ONLY Unmatched / Conflicting Attributes */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={17} color="var(--warning-500)" />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', margin: 0 }}>
                Unmatched &amp; Conflicting Attributes ({simulationResult.unmatchedAttributes.length})
              </h4>
            </div>

            {simulationResult.unmatchedAttributes.length === 0 ? (
              <div style={{ padding: 16, borderRadius: 6, background: 'var(--surface-sunk)', border: '1px solid var(--line-200)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="var(--success-500)" />
                <span style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 600 }}>
                  Perfect Deterministic Match — All evaluated identity attributes match 100% with zero discrepancies.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {simulationResult.unmatchedAttributes.map((attr) => (
                  <div
                    key={attr.field}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr 1fr 100px',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: 'var(--surface-sunk)',
                      border: '1px solid var(--warning-line)',
                      borderLeft: '4px solid var(--warning-500)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
                        {attr.field}
                      </span>
                      <p className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', margin: '2px 0 0 0' }}>
                        Weight: {attr.weight}%
                      </p>
                    </div>

                    <div className="tile" style={{ padding: '8px 12px', fontSize: 13 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                        {siloA.system}:
                      </span>
                      <p className="mono" style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#DC2626' }}>
                        {attr.valA}
                      </p>
                    </div>

                    <div className="tile" style={{ padding: '8px 12px', fontSize: 13 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>
                        {siloB.system}:
                      </span>
                      <p className="mono" style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#D97706' }}>
                        {attr.valB}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning-700)' }}>
                        {attr.score}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expandable Section: "More Info" Full Record & Holding Breakdown */}
          {showFullInfo && (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line-200)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 10px 0' }}>
                  Complete Multi-Attribute Evaluation Matrix
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {simulationResult.allAttributes.map((attr) => (
                    <div
                      key={attr.field}
                      className="tile"
                      style={{ padding: 14, borderTop: `3px solid ${attr.isMatch ? 'var(--success-500)' : 'var(--warning-500)'}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-900)' }}>{attr.field}</span>
                        {attr.isMatch ? <CheckCircle2 size={15} color="var(--success-500)" /> : <XCircle size={15} color="var(--warning-500)" />}
                      </div>
                      <p className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', margin: '4px 0 2px 0' }}>
                        Weight: {attr.weight}%
                      </p>
                      <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: 0 }}>
                        {attr.score}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combined Projected Relationship Value */}
              <div className="tile" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase' }}>
                    Projected Golden Relationship Value
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--ink-700)', margin: '2px 0 0 0' }}>
                    Combined asset balance across {siloA.system} ({inr(siloA.value)}) and {siloB.system} ({inr(siloB.value)})
                  </p>
                </div>
                <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-700)' }}>
                  {inr(simulationResult.combinedRelationshipValue)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
