import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, RefreshCw, Check, ArrowRight, Lightbulb, Zap, AlertCircle } from 'lucide-react';
import { Chip, MonoTag, Button } from '../common/ui.jsx';
import axiosClient from '../../utils/api.js';

export function AiCard({ goldenCustomerId, customer = {} }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pitched, setPitched] = useState(false);

  const fetchAiInsight = async () => {
    if (!goldenCustomerId) return;
    setLoading(true);
    setError(null);
    setPitched(false);

    try {
      const res = await axiosClient.get(`/opportunities/ai-insight/${goldenCustomerId}`);
      if (res.data?.data) {
        setInsight(res.data.data);
      } else {
        throw new Error('No insight payload returned');
      }
    } catch (err) {
      console.warn('AI insight endpoint error, using fallback gap analysis:', err.message);
      // Fallback recommendation logic based on portfolio gaps
      const totalVal = customer.totalRelationshipValue || 0;
      const breakdown = customer.breakdown || {};
      let fallbackLead = 'Systematic Investment Plan (SIP)';
      let fallbackReason = `Customer has ₹${totalVal.toLocaleString('en-IN')} total relationship value. Recommending dollar-cost averaging into mutual funds to balance risk.`;

      if (totalVal > 1000000 && !breakdown.wealth) {
        fallbackLead = 'Dedicated Portfolio Management Services (PMS)';
        fallbackReason = `High net worth relationship value of ₹${totalVal.toLocaleString('en-IN')} with zero wealth advisory allocation. Prime candidate for PMS migration.`;
      } else if (breakdown.equity > 250000 && !breakdown.insurance) {
        fallbackLead = 'Comprehensive Term Life Cover (₹1 Cr)';
        fallbackReason = `Substantial equity asset exposure (₹${breakdown.equity.toLocaleString('en-IN')}) with zero life insurance coverage detected. Protection gap trigger.`;
      }

      setInsight({
        goldenCustomerId,
        lead: fallbackLead,
        reason: fallbackReason,
        isFallback: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset insight state when customer changes so user clicks "Generate" explicitly
  useEffect(() => {
    setInsight(null);
    setPitched(false);
    setError(null);
  }, [goldenCustomerId]);

  const handlePitch = () => {
    setPitched(true);
  };

  return (
    <div className="card" style={{
      padding: 24,
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--brand-050) 100%)',
      border: '1px solid var(--brand-200)',
      borderRadius: 12,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Subtle Glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 140, height: 140,
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', filter: 'blur(20px)',
      }} />

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: insight ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: 0 }}>
                AI-Powered Cross-Sell Solution
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '2px 0 0 0' }}>
              Real-time portfolio vulnerability &amp; next-best-opportunity engine
            </p>
          </div>
        </div>

        {insight && (
          <button
            onClick={fetchAiInsight}
            disabled={loading}
            title="Re-run AI Analysis"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              fontSize: 12, fontWeight: 600,
              border: '1px solid var(--line-300)',
              background: 'var(--surface)', color: 'var(--ink-700)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Analyzing...' : 'Re-generate'}</span>
          </button>
        )}
      </div>

      {/* Body Content */}
      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--brand-700)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Sparkles size={16} className="spin" />
          <span>Generating AI pitch solution using LLM engine...</span>
        </div>
      ) : insight ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Solution Pitch Title Box */}
          <div style={{
            padding: '14px 18px',
            background: 'var(--surface)',
            borderRadius: 8,
            border: '1px solid var(--brand-100)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recommended Pitch Solution
              </span>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)', margin: '4px 0 0 0' }}>
                {insight.lead}
              </h4>
            </div>
            <MonoTag>Target ID: {goldenCustomerId}</MonoTag>
          </div>

          {/* Strategic Rationale Explanation */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 8,
            borderLeft: '3px solid var(--brand-600)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Lightbulb size={14} color="var(--brand-700)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-800)' }}>Strategic AI Rationale</span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-700)', lineHeight: 1.5, margin: 0 }}>
              {insight.reason}
            </p>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
            <Button
              variant={pitched ? 'success' : 'primary'}
              icon={pitched ? Check : ArrowRight}
              onClick={handlePitch}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              {pitched ? 'Solution Pitched to Client' : 'Pitch Solution to Client'}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: 16,
          padding: '18px 20px',
          background: 'var(--surface)',
          borderRadius: 8,
          border: '1px dashed var(--brand-200)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', margin: 0 }}>
              Generate AI Recommendation
            </h4>
            <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '2px 0 0 0' }}>
              Run deep portfolio gap analysis to generate pitch lead &amp; strategic rationale.
            </p>
          </div>

          <Button
            variant="primary"
            icon={Sparkles}
            onClick={fetchAiInsight}
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            Generate AI Solution
          </Button>
        </div>
      )}
    </div>
  );
}

export default AiCard;
