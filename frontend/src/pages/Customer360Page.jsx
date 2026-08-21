import React, { useState, useEffect } from 'react';
import { CustomerSidebar } from '../components/customer360/CustomerSidebar.jsx';
import { ProfileHeaderCard } from '../components/customer360/ProfileHeaderCard.jsx';
import { ConnectedAccounts } from '../components/customer360/ConnectedAccounts.jsx';
import { MatchCriteriaGrid } from '../components/customer360/MatchCriteriaGrid.jsx';
import axiosClient from '../utils/api.js';
import { CheckCircle2, AlertTriangle, X, UserX } from 'lucide-react';

const STATUS_META = {
  AUTO_MERGED: { label: 'Verified profile', tone: 'success', icon: CheckCircle2 },
  MANUAL_REVIEW: { label: 'Action needed', tone: 'warning', icon: AlertTriangle },
  PARTIALLY_RESOLVED: { label: 'Action needed', tone: 'warning', icon: AlertTriangle },
  SPLIT_REVIEW: { label: 'Action needed', tone: 'warning', icon: AlertTriangle },
  SPLIT_REJECTED: { label: 'Kept separate', tone: 'neutral', icon: X },
};

function formatCustomer(c) {
  if (!c) return null;
  const breakdown = c.totalRelationshipValue?.breakdown || c.breakdown || {};

  const getSourceValue = (system, ref) => {
    const sys = system?.toUpperCase();
    if (sys === 'EQUITY' && breakdown.equity) return breakdown.equity;
    if (sys === 'MUTUAL_FUNDS' && breakdown.mutualFunds) return breakdown.mutualFunds;
    if (sys === 'INSURANCE' && breakdown.insurance) return breakdown.insurance;
    if (sys === 'LOANS' && breakdown.loans) return breakdown.loans;
    if (sys === 'WEALTH' && breakdown.wealth) return breakdown.wealth;

    const h = ref?.holdingsData || {};
    return h.portfolioValue || h.totalNavValue || h.sumAssured || h.outstandingAmount || h.aum || 0;
  };

  return {
    goldenId: c.goldenCustomerId || c._id || 'N/A',
    fullName: c.personalProfile?.fullName || c.fullName || 'Unnamed Customer',
    city: c.personalProfile?.city || c.city || 'Unspecified',
    segment: (c.totalRelationshipValue?.totalValue || c.totalRelationshipValue || 0) > 1000000 ? 'Private Wealth' : 'Affluent',
    totalRelationshipValue: c.totalRelationshipValue?.totalValue ?? c.totalRelationshipValue ?? 0,
    breakdown,
    pan: c.primaryIdentifiers?.pan || c.pan || 'NOT_PROVIDED',
    mobile: c.personalProfile?.primaryPhone || c.mobile || 'NOT_PROVIDED',
    email: c.personalProfile?.primaryEmail || c.email || 'NOT_PROVIDED',
    matchConfidence: c.matchConfidence || Math.round(
      (c.linkedSourceRecords || []).reduce((acc, r) => acc + (r.confidenceScore || 1), 0) /
      Math.max(1, (c.linkedSourceRecords || []).length) * 100
    ) || 95,
    status: c.matchStatus === 'AUTO_MERGED' || c.status === 'ACTIVE' ? 'AUTO_MERGED' : 'MANUAL_REVIEW',
    hasConflict: (c.attributeConflicts || []).length > 0 || !!c.hasConflict,
    conflictField: (c.attributeConflicts || []).map(conf => `${conf.attribute} discrepancy`).join(', ') || c.conflictField || null,
    matchCriteria: c.matchCriteria || [
      { field: 'PAN', type: 'Deterministic', score: c.primaryIdentifiers?.pan ? 100 : 0, passed: !!c.primaryIdentifiers?.pan, weight: 50 },
      { field: 'Mobile', type: 'Deterministic', score: c.personalProfile?.primaryPhone ? 100 : 0, passed: !!c.personalProfile?.primaryPhone, weight: 25 },
      { field: 'Email', type: 'Probabilistic', score: c.personalProfile?.primaryEmail ? 85 : 0, passed: !!c.personalProfile?.primaryEmail, weight: 15 },
      { field: 'Name', type: 'Fuzzy', score: 95, passed: true, weight: 10 },
    ],
    sourceRecords: (c.linkedSourceRecords || []).map((r) => {
      const srcRef = r.sourceRecordRef || {};
      const raw = srcRef.rawAttributes || {};
      return {
        sourceSystem: r.sourceSystem,
        sourceId: r.sourceCustomerId,
        name: raw.fullName || c.personalProfile?.fullName || c.fullName,
        email: raw.email || c.personalProfile?.primaryEmail || c.email,
        mobile: raw.mobile || c.personalProfile?.primaryPhone || c.mobile,
        value: getSourceValue(r.sourceSystem, srcRef),
      };
    }).concat(c.sourceRecords || []),
  };
}

export function Customer360Page({ showMasked = false }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [detailedCustomer, setDetailedCustomer] = useState(null);
  const [holdingsFilter, setHoldingsFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIST');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Assigned Customers List
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    axiosClient.get('/customers/get-customers')
      .then((res) => {
        const fetchedList = res.data?.data?.customers || [];
        if (isMounted) {
          const formattedList = fetchedList.map(formatCustomer).filter(Boolean);
          setCustomers(formattedList);
          if (formattedList.length > 0) {
            setSelectedCustomerId(formattedList[0].goldenId);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch customer list:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Selected Customer 360 Dossier
  useEffect(() => {
    if (!selectedCustomerId) return;

    axiosClient.get(`/customers/get-customers/${selectedCustomerId}`)
      .then((res) => {
        if (res.data?.data) {
          setDetailedCustomer(formatCustomer(res.data.data));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch 360 profile:', err.message);
      });
  }, [selectedCustomerId]);

  if (loading) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-500)' }}>
        Loading customer dossiers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="card" style={{ padding: '64px 28px', textAlign: 'center' }}>
        <UserX size={44} color="var(--ink-400)" style={{ margin: '0 auto 14px' }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 8px 0' }}>
          No Assigned Customers
        </h3>
        <p style={{ fontSize: 14.5, color: 'var(--ink-500)', margin: 0 }}>
          Your RM account currently has no assigned Golden Customer records.
        </p>
      </div>
    );
  }

  const activeCustomer = detailedCustomer?.goldenId === selectedCustomerId
    ? detailedCustomer
    : customers.find((c) => c.goldenId === selectedCustomerId) || customers[0];

  const filteredSourceRecords = (activeCustomer?.sourceRecords || []).filter((src) => {
    if (holdingsFilter === 'ALL') return true;
    return src.sourceSystem === holdingsFilter;
  });

  return (
    <div className="grid-360" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
      <CustomerSidebar
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={setSelectedCustomerId}
        statusMeta={STATUS_META}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ProfileHeaderCard
          selectedCustomer={activeCustomer}
          showMasked={showMasked}
        />

        <ConnectedAccounts
          selectedCustomer={activeCustomer}
          viewMode={viewMode}
          setViewMode={setViewMode}
          holdingsFilter={holdingsFilter}
          setHoldingsFilter={setHoldingsFilter}
          filteredSourceRecords={filteredSourceRecords}
          showMasked={showMasked}
        />

        {activeCustomer?.matchCriteria?.length > 0 && (
          <MatchCriteriaGrid selectedCustomer={activeCustomer} />
        )}
      </div>
    </div>
  );
}