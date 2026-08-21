import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Check } from 'lucide-react';
import { SectionHeading, MonoTag, Chip, Button } from '../components/common/ui.jsx';
import { initialOpportunities } from '../data/mockData';
import axiosClient from '../utils/api.js';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [loading, setLoading] = useState(false);

  // 1. GET: Fetch live opportunities from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    axiosClient
      .get('/opportunities/get-opportunities')
      .then((res) => {
        const items = res.data?.data?.opportunities;
        if (isMounted && Array.isArray(items) && items.length > 0) {
          // Normalize backend NBOOpportunity model to frontend card format
          const formatted = items.map((opp) => ({
            id: opp.opportunityId || opp._id,
            goldenId: opp.goldenCustomer?.goldenCustomerId || 'GC-N/A',
            customerName: opp.goldenCustomer?.personalProfile?.fullName || 'Customer',
            targetProduct: opp.targetProduct,
            triggerReason:
              opp.explainabilityLog?.gapIdentified ||
              opp.reasonCodes?.[0]?.description ||
              'Identified portfolio coverage gap.',
            score: opp.priorityScore || 50,
            potentialValue: opp.potentialValue || 0,
            status: opp.status === 'CONTACTED' ? 'PITCHED' : opp.status,
          }));
          setOpportunities(formatted);
        }
      })
      .catch((err) => {
        console.warn('Backend opportunities unavailable, using fallback:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. PATCH: Update status when RM pitches or dismisses an opportunity
  const handleOppAction = async (oppId, action) => {
    // Optimistic UI state update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, status: action } : o))
    );

    const backendStatus = action === 'PITCHED' ? 'CONTACTED' : action;

    try {
      await axiosClient.patch(`/opportunities/${oppId}/status`, {
        status: backendStatus,
        notes: `Opportunity ${action.toLowerCase()} via RM console.`,
      });
    } catch (error) {
      console.error('Failed to update opportunity status:', error.message);
    }
  };

  return (
    <div className="card" style={{ padding: 28 }}>
      <SectionHeading
        icon={Sparkles}
        title="Smart Recommendations for Relationship Managers"
        description="High-confidence product ideas tailored to customer portfolios with zero coverage gaps."
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-500)' }}>
          Loading recommendations...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
          {opportunities.map((opp) => (
            <div key={opp.id} className="tile" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)' }}>
                  {opp.customerName} <MonoTag>{opp.goldenId}</MonoTag>
                </span>
                <Chip tone="gold" icon={Flame}>{opp.score}% Match</Chip>
              </div>

              <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', margin: '16px 0 8px 0' }}>
                {opp.targetProduct}
              </h4>
              <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.5, margin: 0 }}>
                {opp.triggerReason}
              </p>

              <p className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: '18px 0' }}>
                Est. Deal Value: {inr(opp.potentialValue)}
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
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
      )}
    </div>
  );
}