import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import { SectionHeading, RangeSlider, Button } from '../components/common/ui.jsx';
import { initialRuleConfig } from '../data/mockData';
import axiosClient from '../utils/api.js';

export function MatchSettingsPage({ role = 'ADMIN' }) {
  const [rules, setRules] = useState(initialRuleConfig);
  const [recalcFeedback, setRecalcFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRuleId, setActiveRuleId] = useState('RULE_IDENTITY_DEFAULT');

  // 1. GET: Fetch active matching rules from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    axiosClient
      .get('/config/get-all-config-rules?category=IDENTITY_MATCHING')
      .then((res) => {
        const matchingRule = res.data?.data?.rules?.[0];
        if (isMounted && matchingRule) {
          setActiveRuleId(matchingRule.ruleId || matchingRule._id);
          const mc = matchingRule.matchingConfig || {};
          const w = mc.attributeWeights || {};

          setRules({
            panWeight: Math.round((w.pan ?? 0.5) * 100),
            mobileWeight: Math.round((w.phone ?? 0.25) * 100),
            emailWeight: Math.round((w.email ?? 0.15) * 100),
            nameWeight: Math.round((w.fullName ?? 0.10) * 100),
            autoMergeThreshold: Math.round((mc.autoMergeThreshold ?? 0.85) * 100),
            manualReviewThreshold: Math.round((mc.reviewQueueMinThreshold ?? 0.60) * 100),
          });
        }
      })
      .catch((err) => {
        console.warn('Backend config unavailable, using fallback:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalWeight =
    (rules.panWeight || 0) +
    (rules.mobileWeight || 0) +
    (rules.emailWeight || 0) +
    (rules.nameWeight || 0);

  // 2. PATCH: Update rules and trigger server-side re-evaluation
  const handleLiveRecalculate = async () => {
    if (role !== 'ADMIN') return;

    try {
      await axiosClient.patch(`/config/${activeRuleId}`, {
        matchingConfig: {
          autoMergeThreshold: rules.autoMergeThreshold / 100,
          reviewQueueMinThreshold: rules.manualReviewThreshold / 100,
          attributeWeights: {
            pan: rules.panWeight / 100,
            phone: rules.mobileWeight / 100,
            email: rules.emailWeight / 100,
            fullName: rules.nameWeight / 100,
          },
        },
      });

      setRecalcFeedback(true);
      setTimeout(() => setRecalcFeedback(false), 3000);
    } catch (error) {
      console.error('Failed to update config and recalculate:', error.message);
    }
  };

  return (
    <div className="card" style={{ padding: 28 }}>
      <SectionHeading
        icon={SlidersHorizontal}
        title="Identity Stitching & Business Rule Configurator"
        description="Adjust individual attribute matching weights and threshold boundaries dynamically to execute live runtime identity re-scoring."
      />

      <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {/* Attribute Weights Section */}
          <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--line-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ fontWeight: 700, color: 'var(--ink-900)', margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Attribute Match Weights
              </p>
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 4,
                  backgroundColor: totalWeight === 100 ? 'var(--brand-050)' : 'var(--warning-line)',
                  color: totalWeight === 100 ? 'var(--brand-700)' : 'var(--warning-700)',
                  border: `1px solid ${totalWeight === 100 ? 'var(--brand-100)' : 'var(--warning-500)'}`,
                }}
              >
                Total: {totalWeight}% {totalWeight === 100 ? '(Valid)' : '(Must equal 100%)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>
                  <span>PAN Exact Match Weight</span>
                  <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.panWeight || 0}%</span>
                </div>
                <RangeSlider
                  min={0}
                  max={100}
                  value={rules.panWeight || 0}
                  disabled={role !== 'ADMIN'}
                  onChange={(e) => setRules({ ...rules, panWeight: Number(e.target.value) })}
                  trackTone="var(--brand-700)"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>
                  <span>Mobile Number Match Weight</span>
                  <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.mobileWeight || 0}%</span>
                </div>
                <RangeSlider
                  min={0}
                  max={100}
                  value={rules.mobileWeight || 0}
                  disabled={role !== 'ADMIN'}
                  onChange={(e) => setRules({ ...rules, mobileWeight: Number(e.target.value) })}
                  trackTone="var(--brand-700)"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>
                  <span>Email Match Weight</span>
                  <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.emailWeight || 0}%</span>
                </div>
                <RangeSlider
                  min={0}
                  max={100}
                  value={rules.emailWeight || 0}
                  disabled={role !== 'ADMIN'}
                  onChange={(e) => setRules({ ...rules, emailWeight: Number(e.target.value) })}
                  trackTone="var(--brand-700)"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>
                  <span>Name Fuzzy Match Weight</span>
                  <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.nameWeight || 0}%</span>
                </div>
                <RangeSlider
                  min={0}
                  max={100}
                  value={rules.nameWeight || 0}
                  disabled={role !== 'ADMIN'}
                  onChange={(e) => setRules({ ...rules, nameWeight: Number(e.target.value) })}
                  trackTone="var(--brand-700)"
                />
              </div>
            </div>
          </div>

          {/* Decision Boundaries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p style={{ fontWeight: 700, color: 'var(--ink-900)', margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Confidence Decision Boundaries
            </p>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>
                <span>Auto-Merge Threshold (Instant Stitch)</span>
                <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.autoMergeThreshold}%</span>
              </div>
              <RangeSlider
                min={50}
                max={100}
                value={rules.autoMergeThreshold}
                disabled={role !== 'ADMIN'}
                onChange={(e) => setRules({ ...rules, autoMergeThreshold: Number(e.target.value) })}
                trackTone="var(--success-500)"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>
                <span>Manual Review Boundary (Routes to Queue)</span>
                <span className="mono" style={{ color: 'var(--brand-700)' }}>{rules.manualReviewThreshold}%</span>
              </div>
              <RangeSlider
                min={30}
                max={80}
                value={rules.manualReviewThreshold}
                disabled={role !== 'ADMIN'}
                onChange={(e) => setRules({ ...rules, manualReviewThreshold: Number(e.target.value) })}
                trackTone="var(--warning-500)"
              />
            </div>
          </div>

          {/* Action Button */}
          {role === 'ADMIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                variant="primary"
                icon={RefreshCw}
                onClick={handleLiveRecalculate}
                disabled={totalWeight !== 100}
                style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '15px' }}
              >
                Apply &amp; Recalculate Engine
              </Button>
              {recalcFeedback && (
                <p className="mono" style={{ fontSize: 13, color: 'var(--success-700)', textAlign: 'center', margin: 0 }}>
                  ✓ Identity resolution engine re-executed successfully
                </p>
              )}
            </div>
          )}
        </div>

        {/* Policy Summary */}
        <div className="tile" style={{ padding: 22, fontSize: 14, color: 'var(--ink-700)', height: 'fit-content' }}>
          <p style={{ fontWeight: 700, color: 'var(--ink-900)', marginBottom: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Execution Policy Matrix
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="status-dot" style={{ background: 'var(--success-500)', marginTop: 6 }} />
              <div>
                <strong style={{ color: 'var(--ink-900)' }}>Auto-Merge (Confidence &ge; {rules.autoMergeThreshold}%):</strong>
                <p style={{ margin: '3px 0 0 0', color: 'var(--ink-500)', fontSize: 13 }}>
                  Deterministic &amp; high-fidelity probabilistic matches are automatically consolidated into single Golden Records.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="status-dot" style={{ background: 'var(--warning-500)', marginTop: 6 }} />
              <div>
                <strong style={{ color: 'var(--ink-900)' }}>Manual Review Band ({rules.manualReviewThreshold}% – {rules.autoMergeThreshold - 1}%):</strong>
                <p style={{ margin: '3px 0 0 0', color: 'var(--ink-500)', fontSize: 13 }}>
                  Ambiguous identity pairs with conflicting attributes are flagged and dispatched to the Data Steward Review Queue.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="status-dot" style={{ background: 'var(--ink-300)', marginTop: 6 }} />
              <div>
                <strong style={{ color: 'var(--ink-900)' }}>Separate Profiles (&lt; {rules.manualReviewThreshold}%):</strong>
                <p style={{ margin: '3px 0 0 0', color: 'var(--ink-500)', fontSize: 13 }}>
                  Records below the confidence boundary are preserved as distinct, unstitched customer identities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}