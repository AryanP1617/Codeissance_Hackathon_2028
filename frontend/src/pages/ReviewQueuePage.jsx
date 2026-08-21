import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { SectionHeading } from '../components/common/ui.jsx';
import { ConflictReviewCard } from '../components/ConflictReviewCard.jsx';
import { initialCustomers } from '../data/mockData';
import axiosClient from '../utils/api.js';

export function ReviewQueuePage({ role = 'DATA_STEWARD' }) {
  const [pendingReviews, setPendingReviews] = useState(
    initialCustomers.filter((c) => c.status === 'MANUAL_REVIEW')
  );
  const [loading, setLoading] = useState(false);

  // 1. GET: Fetch pending reviews from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    axiosClient
      .get('/review/get-pending-reviews')
      .then((res) => {
        const items = res.data?.data?.pendingReviews;
        if (isMounted && Array.isArray(items)) {
          // Normalize backend ReviewQueue documents into frontend card format
          const formatted = items.map((rev) => ({
            goldenId: rev.reviewId,
            matchConfidence: Math.round((rev.confidenceScore || 0) * 100),
            conflictField: rev.ambiguityReason,
            status: rev.status,
            sourceRecords: [
              {
                sourceSystem: rev.sourceRecordA?.sourceSystem,
                sourceId: rev.sourceRecordA?.sourceCustomerId,
                name: rev.sourceRecordA?.snapshot?.fullName || 'N/A',
                mobile: rev.sourceRecordA?.snapshot?.mobile || rev.sourceRecordA?.snapshot?.phone || '',
                email: rev.sourceRecordA?.snapshot?.email || '',
                value: 0,
              },
              {
                sourceSystem: rev.sourceRecordB?.sourceSystem,
                sourceId: rev.sourceRecordB?.sourceCustomerId,
                name: rev.sourceRecordB?.snapshot?.fullName || 'N/A',
                mobile: rev.sourceRecordB?.snapshot?.mobile || rev.sourceRecordB?.snapshot?.phone || '',
                email: rev.sourceRecordB?.snapshot?.email || '',
                value: 0,
              },
            ],
          }));
          setPendingReviews(formatted);
        }
      })
      .catch((err) => {
        console.warn('Backend review queue unavailable, using fallback:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. POST: Approve merge and combine candidate profiles
  const handleConfirmMerge = async (goldenId, survivingAttributes) => {
    // Optimistic UI update
    setPendingReviews((prev) => prev.filter((item) => item.goldenId !== goldenId));

    try {
      await axiosClient.post(`/review/${goldenId}/merge`, {
        reviewId: goldenId,
        notes: `Merged with attributes: ${JSON.stringify(survivingAttributes)}`,
      });
    } catch (error) {
      console.error('Failed to confirm merge:', error.message);
    }
  };

  // 3. POST: Reject merge and enforce separation of records
  const handleSplit = async (goldenId) => {
    // Optimistic UI update
    setPendingReviews((prev) => prev.filter((item) => item.goldenId !== goldenId));

    try {
      await axiosClient.post(`/review/${goldenId}/split`, {
        reviewId: goldenId,
        notes: 'Manual split confirmed by reviewer',
      });
    } catch (error) {
      console.error('Failed to reject split:', error.message);
    }
  };

  return (
    <div className="card" style={{ padding: 28 }}>
      <SectionHeading
        title="Duplicate & Conflict Resolution Queue"
        description="These accounts share matching details (like phone number) but have conflicting names or emails. Select surviving attributes and confirm resolution."
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-500)' }}>
          Loading pending reviews...
        </div>
      ) : pendingReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--success-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ShieldCheck size={26} color="var(--success-700)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 6px' }}>
            All caught up
          </p>
          <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: 0 }}>
            No unresolved customer records in the queue.
          </p>
        </div>
      ) : (
        pendingReviews.map((item) => (
          <ConflictReviewCard
            key={item.goldenId}
            item={item}
            isSteward={role !== 'RM'}
            onConfirmMerge={handleConfirmMerge}
            onSplit={handleSplit}
          />
        ))
      )}
    </div>
  );
}