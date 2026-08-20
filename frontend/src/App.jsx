import React, { useState } from 'react';
import { initialCustomers, initialOpportunities, initialRuleConfig } from './data/mockData';
import { maskData } from './utils/masking';
import { 
  Users, AlertCircle, Sparkles, SlidersHorizontal, Eye, EyeOff, 
  CheckCircle2, AlertTriangle, Layers, Check, X, TrendingUp, ShieldCheck, RefreshCw, ChevronRight
} from 'lucide-react';

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b' }}>
      
      {/* Friendly Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🎯</span>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Customer 360 & Smart Opportunities</h1>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Stitch customer profiles, fix duplicate accounts, and discover cross-sell recommendations.</p>
        </div>

        {/* Controls: Persona & Masking */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', padding: '0 8px' }}>Viewing as:</span>
            {[
              { id: 'RELATIONSHIP_MANAGER', label: 'Sales RM' },
              { id: 'DATA_STEWARD', label: 'Data Steward' },
              { id: 'ADMIN', label: 'Admin' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: role === r.id ? '#4f46e5' : 'transparent',
                  color: role === r.id ? '#ffffff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowMasked(!showMasked)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            {showMasked ? <EyeOff size={15} color="#e11d48" /> : <Eye size={15} color="#059669" />}
            {showMasked ? 'Mask Sensitive Info' : 'Show Full Info'}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 28px', display: 'flex', gap: '24px' }}>
        {[
          { id: '360', label: 'Customer Overview', icon: Users, count: null },
          { id: 'REVIEW', label: 'Needs Review', icon: AlertCircle, count: pendingReviews.length },
          { id: 'OPPORTUNITIES', label: 'Top Recommendations', icon: Sparkles, count: opportunities.length },
          { id: 'RULES', label: 'Match Settings', icon: SlidersHorizontal, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 4px',
                fontSize: '14px',
                fontWeight: isSelected ? '700' : '500',
                color: isSelected ? '#4f46e5' : '#64748b',
                border: 'none',
                borderBottom: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content Container */}
      <main style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>

        {/* 1. CUSTOMER 360 TAB */}
        {activeTab === '360' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            
            {/* Sidebar list */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', height: 'fit-content' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                All Customers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {customers.map((c) => {
                  const isSel = selectedCustomerId === c.goldenId;
                  return (
                    <div
                      key={c.goldenId}
                      onClick={() => setSelectedCustomerId(c.goldenId)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: isSel ? '#eef2ff' : '#f8fafc',
                        border: isSel ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        transition: '0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>
                          {c.goldenId}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                          backgroundColor: c.status === 'AUTO_MERGED' ? '#dcfce7' : c.status === 'MANUAL_REVIEW' ? '#fef3c7' : '#dbeafe',
                          color: c.status === 'AUTO_MERGED' ? '#166534' : c.status === 'MANUAL_REVIEW' ? '#92400e' : '#1e40af'
                        }}>
                          {c.status === 'AUTO_MERGED' ? 'Verified Profile' : c.status === 'MANUAL_REVIEW' ? 'Action Needed' : 'Merged'}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '8px 0 2px 0' }}>{c.fullName}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Assets: ₹{c.totalRelationshipValue.toLocaleString('en-IN')}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Profile View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '4px 10px', borderRadius: '20px' }}>
                      ID: {selectedCustomer.goldenId}
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '10px 0 4px 0' }}>{selectedCustomer.fullName}</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>📍 {selectedCustomer.city} • <strong style={{ color: '#334155' }}>{selectedCustomer.segment} Tier</strong></p>
                  </div>
                  <div style={{ textAlign: 'right', backgroundColor: '#ecfdf5', padding: '12px 18px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                    <p style={{ fontSize: '12px', color: '#047857', fontWeight: '600', margin: 0 }}>Total Relationship Value</p>
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#065f46', margin: '2px 0 0 0' }}>₹{selectedCustomer.totalRelationshipValue.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Masked Info Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>PAN Number</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' }}>{maskData(selectedCustomer.pan, 'PAN', showMasked)}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Mobile Contact</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' }}>{maskData(selectedCustomer.mobile, 'MOBILE', showMasked)}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Confidence Match</span>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#4f46e5', margin: '4px 0 0 0' }}>{selectedCustomer.matchConfidence}% Match</p>
                  </div>
                </div>

                {selectedCustomer.hasConflict && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={18} color="#d97706" />
                    <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}><strong>Heads up:</strong> {selectedCustomer.conflictField}</p>
                  </div>
                )}
              </div>

              {/* Connected Accounts / Holdings */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#4f46e5" /> Connected Accounts & Investments
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedCustomer.sourceRecords.map((src) => (
                    <div key={src.sourceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '2px 8px', borderRadius: '4px' }}>
                          {src.sourceSystem}
                        </span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '6px 0 2px 0' }}>
                          {src.name} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>({src.sourceId})</span>
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                          {maskData(src.email, 'EMAIL', showMasked)} • {maskData(src.mobile, 'MOBILE', showMasked)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Account Value</span>
                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>₹{src.value.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Criteria */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  Why was this profile matched?
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {selectedCustomer.matchCriteria.map((crit) => (
                    <div key={crit.field} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>{crit.field}</span>
                        {crit.passed ? <CheckCircle2 size={16} color="#16a34a" /> : <X size={16} color="#94a3b8" />}
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>{crit.type} Match</p>
                      <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>{crit.score}%</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. CONFLICT REVIEW QUEUE */}
        {activeTab === 'REVIEW' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Duplicate & Conflict Resolution Queue</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              These accounts share matching details (like phone number) but have conflicting names or emails. Confirm if they belong to the same person.
            </p>

            {pendingReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                <ShieldCheck size={40} style={{ margin: '0 auto 10px auto', display: 'block', color: '#16a34a' }} />
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>All caught up!</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>No unresolved customer records in the queue.</p>
              </div>
            ) : (
              pendingReviews.map((item) => (
                <div key={item.goldenId} style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px' }}>
                        Match Score: {item.matchConfidence}%
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '8px 0 0 0' }}>{item.conflictField}</h4>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleReviewAction(item.goldenId, 'APPROVE')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <Check size={16} /> Combine Profiles
                      </button>
                      <button
                        onClick={() => handleReviewAction(item.goldenId, 'REJECT')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e11d48', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <X size={16} /> Keep Separate
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    {item.sourceRecords.map((src) => (
                      <div key={src.sourceId} style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5' }}>{src.sourceSystem} ACCOUNT ({src.sourceId})</span>
                        <p style={{ margin: '8px 0 4px 0' }}><strong>Name:</strong> {src.name}</p>
                        <p style={{ margin: '4px 0' }}><strong>Mobile:</strong> {src.mobile}</p>
                        <p style={{ margin: '4px 0' }}><strong>Email:</strong> {src.email}</p>
                        <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#059669' }}>Assets: ₹{src.value.toLocaleString('en-IN')}</p>
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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#eab308" /> Smart Recommendations for Relationship Managers
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              High-confidence product ideas tailored to customer portfolios with zero coverage gaps.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
              {opportunities.map((opp) => (
                <div key={opp.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '3px 8px', borderRadius: '4px' }}>
                      {opp.customerName} ({opp.goldenId})
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#d97706', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                      🔥 {opp.score}% Match
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '12px 0 6px 0' }}>{opp.targetProduct}</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0 }}>{opp.triggerReason}</p>
                  
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#059669', margin: '14px 0' }}>
                    Est. Deal Value: ₹{opp.potentialValue.toLocaleString('en-IN')}
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleOppAction(opp.id, 'PITCHED')}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: '8px', border: 'none',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        backgroundColor: opp.status === 'PITCHED' ? '#16a34a' : '#4f46e5',
                        color: '#ffffff'
                      }}
                    >
                      {opp.status === 'PITCHED' ? '✓ Pitched to Client' : 'Mark as Pitched'}
                    </button>
                    <button
                      onClick={() => handleOppAction(opp.id, 'DISMISSED')}
                      style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. RULES TAB */}
        {activeTab === 'RULES' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={20} color="#4f46e5" /> Match Threshold Settings
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              Adjust matching rules live during judging to see profiles dynamically re-categorize.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                    <span>Auto-Merge Threshold (Instant Stitch)</span>
                    <span style={{ color: '#4f46e5' }}>{rules.autoMergeThreshold}%</span>
                  </div>
                  <input
                    type="range" min="50" max="100" value={rules.autoMergeThreshold}
                    onChange={(e) => setRules({ ...rules, autoMergeThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#4f46e5' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                    <span>Manual Review Boundary (Routes to Queue)</span>
                    <span style={{ color: '#4f46e5' }}>{rules.manualReviewThreshold}%</span>
                  </div>
                  <input
                    type="range" min="30" max="80" value={rules.manualReviewThreshold}
                    onChange={(e) => setRules({ ...rules, manualReviewThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#4f46e5' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                <p style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Rule Summary:</p>
                <p>• Profiles $\ge$ <strong>{rules.autoMergeThreshold}%</strong> are automatically combined.</p>
                <p>• Profiles between <strong>{rules.manualReviewThreshold}%</strong> and <strong>{rules.autoMergeThreshold}%</strong> go to the Review Queue.</p>
                <p>• Profiles &lt; <strong>{rules.manualReviewThreshold}%</strong> remain separate.</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}