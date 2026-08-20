import React, { useState } from 'react';
import { initialCustomers, initialOpportunities, initialRuleConfig } from './data/mockData';
import { maskData } from './utils/masking';
import './styles/theme.css';
import {
  Users, AlertCircle, Sparkles, SlidersHorizontal, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Layers, Check, X, ShieldCheck,
  RefreshCw, MapPin, Flame, Search, Settings, Target,
} from 'lucide-react';
import {
  Chip, MonoTag, Button, SourceBadge, ConfidenceRing, Avatar,
  RangeSlider, SectionHeading,
} from './components/ui.jsx';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

const STATUS_META = {
  AUTO_MERGED: { label: 'Verified profile', tone: 'success', icon: CheckCircle2 },
  MANUAL_REVIEW: { label: 'Action needed', tone: 'warning', icon: AlertTriangle },
  MANUALLY_MERGED: { label: 'Merged', tone: 'brand', icon: CheckCircle2 },
  SPLIT_REJECTED: { label: 'Kept separate', tone: 'neutral', icon: X },
};

export default function App() {
  const [role, setRole] = useState('RELATIONSHIP_MANAGER');
  const [activeTab, setActiveTab] = useState('360');
  const [showMasked, setShowMasked] = useState(false);
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState('GC-1001');
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [rules, setRules] = useState(initialRuleConfig);

  const selectedCustomer = customers.find((c) => c.goldenId === selectedCustomerId) || customers[0];
  const pendingReviews = customers.filter((c) => c.status === 'MANUAL_REVIEW');

  const handleReviewAction = (goldenId, action) => {
    setCustomers(customers.map((c) => {
      if (c.goldenId === goldenId) {
        return {
          ...c,
          status: action === 'APPROVE' ? 'MANUALLY_MERGED' : 'SPLIT_REJECTED',
          matchConfidence: action === 'APPROVE' ? 92 : 35,
        };
      }
      return c;
    }));
  };

  const handleOppAction = (oppId, action) => {
    setOpportunities(opportunities.map((o) => (o.id === oppId ? { ...o, status: action } : o)));
  };

  const roleOptions = [
    { id: 'RELATIONSHIP_MANAGER', label: 'Sales RM' },
    { id: 'DATA_STEWARD', label: 'Data Steward' },
    { id: 'ADMIN', label: 'Admin' },
  ];

  const tabs = [
    { id: '360', label: 'Customer Overview', icon: Users, count: null },
    { id: 'REVIEW', label: 'Needs Review', icon: AlertCircle, count: pendingReviews.length, tone: 'warning' },
    { id: 'OPPORTUNITIES', label: 'Top Recommendations', icon: Sparkles, count: opportunities.filter((o) => o.status === 'PENDING').length, tone: 'gold' },
    { id: 'RULES', label: 'Match Settings', icon: SlidersHorizontal, count: null },
  ];

  return (
    <div className="c360-app" style={{ minHeight: '100vh', background: 'var(--canvas)', color: 'var(--ink-900)', fontFamily: 'var(--font-ui)' }}>

      {/* ============ Global utility bar ============ */}
      <div style={{
        background: 'var(--brand-900)', color: '#E7ECF7', padding: '8px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5, background: 'var(--brand-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Target size={13} color="#fff" strokeWidth={2.4} />
          </div>
          <span className="mono" style={{ letterSpacing: '0.06em', color: '#AEBEDD', fontWeight: 500 }}>
            WEALTH OPS CONSOLE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#B9E6CB' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3FB37F', display: 'inline-block' }} />
            Production
          </span>
          <button className="btn-quiet" style={{
            background: 'transparent', border: 'none', color: '#AEBEDD', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '2px 4px',
          }}>
            <RefreshCw size={12} /> Synced 2m ago
          </button>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)' }} />
          <Search size={14} color="#AEBEDD" />
          <Settings size={14} color="#AEBEDD" />
          <Avatar name="RM" size={22} tone="ink" />
        </div>
      </div>

      {/* ============ Page header ============ */}
      <header style={{
        backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--line-200)',
        padding: '20px 28px',
      }}>
        <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 600, color: 'var(--ink-900)', margin: 0, fontFamily: 'var(--font-display)' }}>
              Customer 360 &amp; Smart Opportunities
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '4px 0 0 0' }}>
              Stitch customer profiles, resolve duplicate accounts, and surface cross-sell recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-sunk)', padding: 3, borderRadius: 8, border: '1px solid var(--line-200)' }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', padding: '0 8px', letterSpacing: '0.03em' }}>
                VIEWING AS
              </span>
              {roleOptions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`segment ${role === r.id ? 'is-active' : ''}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              icon={showMasked ? EyeOff : Eye}
              onClick={() => setShowMasked(!showMasked)}
              style={{ color: showMasked ? 'var(--danger-700)' : 'var(--ink-700)' }}
            >
              {showMasked ? 'Mask sensitive info' : 'Show full info'}
            </Button>
          </div>
        </div>
      </header>

      {/* ============ Nav tabs ============ */}
      <nav style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--line-200)', padding: '0 28px', display: 'flex', gap: 28, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${isSelected ? 'is-active' : ''}`}>
              <Icon size={15} strokeWidth={2.2} />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`chip chip-${tab.tone === 'warning' ? 'warning' : tab.tone === 'gold' ? 'gold' : 'neutral'} mono`} style={{ fontSize: 10, padding: '1px 6px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ============ Content ============ */}
      <main style={{ maxWidth: 1320, margin: '24px auto', padding: '0 28px 48px' }}>

        {/* 1. CUSTOMER 360 TAB */}
        {activeTab === '360' && (
          <div className="grid-360" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

            {/* Sidebar list */}
            <div className="card" style={{ padding: 16 }}>
              <h3 className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.06em' }}>
                All Customers ({customers.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customers.map((c) => {
                  const isSel = selectedCustomerId === c.goldenId;
                  const meta = STATUS_META[c.status] || STATUS_META.AUTO_MERGED;
                  return (
                    <button
                      key={c.goldenId}
                      onClick={() => setSelectedCustomerId(c.goldenId)}
                      className={`customer-row ${isSel ? 'is-selected' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <MonoTag>{c.goldenId}</MonoTag>
                        <Chip tone={meta.tone} icon={meta.icon}>{meta.label}</Chip>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', margin: '9px 0 2px 0' }}>{c.fullName}</p>
                      <p className="mono" style={{ fontSize: 12, color: 'var(--ink-500)', margin: 0 }}>
                        {inr(c.totalRelationshipValue)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Profile View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Profile Card */}
              <div className="card" style={{ padding: 24 }}>
                <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <Avatar name={selectedCustomer.fullName} size={48} />
                    <div>
                      <MonoTag>ID {selectedCustomer.goldenId}</MonoTag>
                      <h2 style={{ fontSize: 23, fontWeight: 600, color: 'var(--ink-900)', margin: '8px 0 4px 0', fontFamily: 'var(--font-display)' }}>
                        {selectedCustomer.fullName}
                      </h2>
                      <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} /> {selectedCustomer.city}
                        <span style={{ color: 'var(--line-300)' }}>•</span>
                        <Chip tone="gold">{selectedCustomer.segment} Tier</Chip>
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', background: 'var(--brand-050)', padding: '12px 18px', borderRadius: 8, border: '1px solid var(--brand-100)' }}>
                    <p style={{ fontSize: 11, color: 'var(--brand-700)', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Total Relationship Value
                    </p>
                    <p className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--brand-900)', margin: '2px 0 0 0' }}>
                      {inr(selectedCustomer.totalRelationshipValue)}
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid-info-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line-100)' }}>
                  <div className="tile" style={{ padding: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>PAN Number</span>
                    <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', margin: '5px 0 0 0' }}>
                      {maskData(selectedCustomer.pan, 'PAN', showMasked)}
                    </p>
                  </div>
                  <div className="tile" style={{ padding: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mobile Contact</span>
                    <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', margin: '5px 0 0 0' }}>
                      {maskData(selectedCustomer.mobile, 'MOBILE', showMasked)}
                    </p>
                  </div>
                  <div className="tile" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Confidence Match</span>
                    </div>
                    <ConfidenceRing value={selectedCustomer.matchConfidence} size={44} />
                  </div>
                </div>

                {selectedCustomer.hasConflict && (
                  <div style={{
                    marginTop: 16, padding: '12px 16px', backgroundColor: 'var(--surface)',
                    border: '1px solid var(--warning-line)', borderLeft: '3px solid var(--warning-500)',
                    borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <AlertTriangle size={16} color="var(--warning-500)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: 'var(--ink-700)', margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--warning-700)' }}>Data conflict — </strong>
                      {selectedCustomer.conflictField}
                    </p>
                  </div>
                )}
              </div>

              {/* Connected Accounts / Holdings */}
              <div className="card" style={{ padding: 22 }}>
                <SectionHeading icon={Layers} title="Connected Accounts & Investments" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedCustomer.sourceRecords.map((src) => (
                    <div key={src.sourceId} className="tile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                      <div>
                        <SourceBadge system={src.sourceSystem} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', margin: '7px 0 2px 0' }}>
                          {src.name} <MonoTag>{src.sourceId}</MonoTag>
                        </p>
                        <p className="mono" style={{ fontSize: 12, color: 'var(--ink-500)', margin: 0 }}>
                          {maskData(src.email, 'EMAIL', showMasked)} · {maskData(src.mobile, 'MOBILE', showMasked)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>Account Value</span>
                        <p className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', margin: '2px 0 0 0' }}>
                          {inr(src.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Criteria */}
              <div className="card" style={{ padding: 22 }}>
                <SectionHeading title="Why was this profile matched?" description="Field-level comparison across every source system linked to this golden record." />
                <div className="grid-criteria-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {selectedCustomer.matchCriteria.map((crit) => (
                    <div key={crit.field} className="tile" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>{crit.field}</span>
                        {crit.passed
                          ? <CheckCircle2 size={15} color="var(--success-500)" />
                          : <X size={15} color="var(--ink-300)" />}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--ink-500)', margin: '5px 0 0 0' }}>{crit.type} match</p>
                      <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', margin: '3px 0 0 0' }}>{crit.score}%</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. CONFLICT REVIEW QUEUE */}
        {activeTab === 'REVIEW' && (
          <div className="card" style={{ padding: 24 }}>
            <SectionHeading
              title="Duplicate & Conflict Resolution Queue"
              description="These accounts share matching details (like phone number) but have conflicting names or emails. Confirm whether they belong to the same person."
            />

            {pendingReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--success-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <ShieldCheck size={24} color="var(--success-700)" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', margin: '0 0 4px' }}>All caught up</p>
                <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>No unresolved customer records in the queue.</p>
              </div>
            ) : (
              pendingReviews.map((item) => (
                <div key={item.goldenId} className="card" style={{
                  borderColor: 'var(--warning-line)', borderLeft: '3px solid var(--warning-500)',
                  padding: 20, marginBottom: 16,
                }}>
                  <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <ConfidenceRing value={item.matchConfidence} size={40} label="Match Score" />
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', margin: '12px 0 0 0' }}>{item.conflictField}</h4>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <Button variant="success" icon={Check} onClick={() => handleReviewAction(item.goldenId, 'APPROVE')}>
                        Combine Profiles
                      </Button>
                      <Button variant="outline-danger" icon={X} onClick={() => handleReviewAction(item.goldenId, 'REJECT')}>
                        Keep Separate
                      </Button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
                    {item.sourceRecords.map((src) => (
                      <div key={src.sourceId} className="tile" style={{ padding: 14, fontSize: 13 }}>
                        <SourceBadge system={src.sourceSystem} />
                        <span style={{ marginLeft: 8 }}><MonoTag>{src.sourceId}</MonoTag></span>
                        <p style={{ margin: '10px 0 4px 0', color: 'var(--ink-700)' }}><strong style={{ color: 'var(--ink-900)' }}>Name:</strong> {src.name}</p>
                        <p className="mono" style={{ margin: '4px 0', color: 'var(--ink-700)' }}>{src.mobile}</p>
                        <p className="mono" style={{ margin: '4px 0', color: 'var(--ink-700)' }}>{src.email}</p>
                        <p className="mono" style={{ margin: '8px 0 0 0', fontWeight: 600, color: 'var(--ink-900)' }}>Assets: {inr(src.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. NEXT-BEST-OPPORTUNITIES TAB */}
        {activeTab === 'OPPORTUNITIES' && (
          <div className="card" style={{ padding: 24 }}>
            <SectionHeading
              icon={Sparkles}
              title="Smart Recommendations for Relationship Managers"
              description="High-confidence product ideas tailored to customer portfolios with zero coverage gaps."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {opportunities.map((opp) => (
                <div key={opp.id} className="tile" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-700)' }}>
                      {opp.customerName} <MonoTag>{opp.goldenId}</MonoTag>
                    </span>
                    <Chip tone="gold" icon={Flame}>{opp.score}% Match</Chip>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', margin: '14px 0 6px 0' }}>{opp.targetProduct}</h4>
                  <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5, margin: 0 }}>{opp.triggerReason}</p>

                  <p className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', margin: '16px 0' }}>
                    Est. Deal Value: {inr(opp.potentialValue)}
                  </p>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant={opp.status === 'PITCHED' ? 'success' : 'primary'}
                      icon={opp.status === 'PITCHED' ? Check : undefined}
                      onClick={() => handleOppAction(opp.id, 'PITCHED')}
                      style={{ flex: 1 }}
                    >
                      {opp.status === 'PITCHED' ? 'Pitched to client' : 'Mark as Pitched'}
                    </Button>
                    <Button variant="secondary" onClick={() => handleOppAction(opp.id, 'DISMISSED')}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. RULES TAB */}
        {activeTab === 'RULES' && (
          <div className="card" style={{ padding: 24 }}>
            <SectionHeading
              icon={SlidersHorizontal}
              title="Match Threshold Settings"
              description="Adjust matching rules to see how profiles are dynamically re-categorized."
            />

            <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--ink-700)' }}>
                    <span>Auto-Merge Threshold (Instant Stitch)</span>
                    <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.autoMergeThreshold}%</span>
                  </div>
                  <RangeSlider
                    min={50}
                    max={100}
                    value={rules.autoMergeThreshold}
                    onChange={(e) => setRules({ ...rules, autoMergeThreshold: Number(e.target.value) })}
                    trackTone="var(--success-500)"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--ink-700)' }}>
                    <span>Manual Review Boundary (Routes to Queue)</span>
                    <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.manualReviewThreshold}%</span>
                  </div>
                  <RangeSlider
                    min={30}
                    max={80}
                    value={rules.manualReviewThreshold}
                    onChange={(e) => setRules({ ...rules, manualReviewThreshold: Number(e.target.value) })}
                    trackTone="var(--warning-500)"
                  />
                </div>
              </div>

              <div className="tile" style={{ padding: 18, fontSize: 13, color: 'var(--ink-700)' }}>
                <p style={{ fontWeight: 700, color: 'var(--ink-900)', marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rule Summary
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="status-dot" style={{ background: 'var(--success-500)' }} />
                    Profiles <span className="mono" style={{ fontWeight: 700 }}>&ge; {rules.autoMergeThreshold}%</span> are automatically combined.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="status-dot" style={{ background: 'var(--warning-500)' }} />
                    Profiles between <span className="mono" style={{ fontWeight: 700 }}>{rules.manualReviewThreshold}%</span> and <span className="mono" style={{ fontWeight: 700 }}>{rules.autoMergeThreshold}%</span> go to the review queue.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="status-dot" style={{ background: 'var(--ink-300)' }} />
                    Profiles <span className="mono" style={{ fontWeight: 700 }}>&lt; {rules.manualReviewThreshold}%</span> remain separate.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
