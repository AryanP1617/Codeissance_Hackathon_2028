import React, { useState, useEffect } from 'react';
import { initialCustomers, initialOpportunities, initialRuleConfig } from './data/mockData';
import { maskData } from './utils/masking';
import { ConflictReviewCard } from './components/ConflictReviewCard.jsx';
import { AuditLogModal } from './components/AuditLogModal.jsx';
import { LineageGraph } from './components/LineageGraph.jsx';
import { LoginModal } from './components/LoginModal.jsx';
import { SiloSimulator } from './components/SiloSimulator.jsx';
import { LoginPage } from './components/LoginPage.jsx';
import './styles/theme.css';
import {
  Users, AlertCircle, Sparkles, SlidersHorizontal, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Layers, Check, X, ShieldCheck,
  RefreshCw, MapPin, Flame, Search, Settings, Target, ShieldX,
  FileText, ShieldAlert, Network, ListFilter, Lock, LogOut, Shield,
  Sun, Moon, Cpu
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

const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-1001',
    timestamp: '2026-08-20 17:10:22',
    actor: 'SYSTEM_DAEMON',
    actionType: 'RULE_UPDATE',
    targetId: null,
    details: 'Initial heuristics baseline weights initialized (PAN: 50%, Mobile: 25%, Email: 15%, Name: 10%)',
  },
  {
    id: 'LOG-1002',
    timestamp: '2026-08-20 17:11:05',
    actor: 'SYSTEM_DAEMON',
    actionType: 'ENGINE_RECALCULATE',
    targetId: 'GC-1001',
    details: 'Golden Record GC-1001 verified across Equity, Mutual Funds & Wealth sources (96% Confidence)',
  },
  {
    id: 'LOG-1003',
    timestamp: '2026-08-20 17:12:40',
    actor: 'SYSTEM_DAEMON',
    actionType: 'IDENTITY_SPLIT',
    targetId: 'GC-1003',
    details: 'Conflicting names (Rohan Verma vs Rahul Verma) routed to Data Stewardship Queue (62% Confidence)',
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('RELATIONSHIP_MANAGER');
  const [activeTab, setActiveTab] = useState('360');
  const [theme, setTheme] = useState('light');
  const [showMasked, setShowMasked] = useState(false);
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState('GC-1001');
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [rules, setRules] = useState(initialRuleConfig);
  const [recalcFeedback, setRecalcFeedback] = useState(false);

  // Holdings Filter & View Mode State
  const [holdingsFilter, setHoldingsFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIST');

  // Audit Logs & Auth Modal States
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Bind theme to HTML document element for global CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    logSecurityEvent('THEME_TOGGLE', `User switched appearance to ${nextTheme.toUpperCase()} mode`);
  };

  const selectedCustomer = customers.find((c) => c.goldenId === selectedCustomerId) || customers[0];
  const pendingReviews = customers.filter((c) => c.status === 'MANUAL_REVIEW');

  const totalWeight = (rules.panWeight || 0) + (rules.mobileWeight || 0) + (rules.emailWeight || 0) + (rules.nameWeight || 0);

  const filteredSourceRecords = (selectedCustomer.sourceRecords || []).filter((src) => {
    if (holdingsFilter === 'ALL') return true;
    return src.sourceSystem === holdingsFilter;
  });

  const logSecurityEvent = (actionType, details, targetId = null) => {
    const newEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: role,
      actionType,
      targetId,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleLogin = ({ role: newRole, username }) => {
    setRole(newRole);
    setCurrentUser({ username, role: newRole });
    setIsAuthenticated(true);
    logSecurityEvent('AUTH_LOGIN', `Session established for ${username} (${newRole})`);
  };

  const handleFullLogout = () => {
    logSecurityEvent('AUTH_LOGOUT', `Session ended for ${currentUser?.username || role}`);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setRole('RELATIONSHIP_MANAGER');
    setActiveTab('360');
  };

  const handleLoginSuccess = (elevatedRole) => {
    setRole(elevatedRole);
    if (currentUser) {
      setCurrentUser({ ...currentUser, role: elevatedRole });
    }
    logSecurityEvent('AUTH_LOGIN', `Privileged session established for role: ${elevatedRole}`);
  };

  const handleLogout = () => {
    logSecurityEvent('AUTH_LOGOUT', `Privileged session ended for role: ${role}`);
    setRole('RELATIONSHIP_MANAGER');
    if (activeTab === 'REVIEW' || activeTab === 'RULES' || activeTab === 'SIMULATOR') {
      setActiveTab('360');
    }
  };

  const canAccessTab = (tabId) => {
    if (role === 'ADMIN') return true;
    if (role === 'DATA_STEWARD') return tabId !== 'RULES';
    if (role === 'RELATIONSHIP_MANAGER') return tabId === '360' || tabId === 'OPPORTUNITIES';
    return false;
  };

  const toggleMasking = () => {
    const nextState = !showMasked;
    setShowMasked(nextState);
    logSecurityEvent(
      nextState ? 'PII_UNMASK' : 'PII_MASK',
      nextState ? 'Privileged unmask access invoked on customer dossier' : 'Masked sensitive identity fields restored',
      selectedCustomerId
    );
  };

  const handleConfirmMerge = (goldenId, survivingAttributes) => {
    setCustomers(customers.map((c) => {
      if (c.goldenId === goldenId) {
        return {
          ...c,
          fullName: survivingAttributes.fullName || c.fullName,
          mobile: survivingAttributes.mobile || c.mobile,
          email: survivingAttributes.email || c.email,
          status: 'MANUALLY_MERGED',
          hasConflict: false,
          matchConfidence: 92,
        };
      }
      return c;
    }));

    logSecurityEvent(
      'MANUAL_MERGE',
      `Manual profile reconciliation confirmed with survivor: "${survivingAttributes.fullName}"`,
      goldenId
    );
  };

  const handleSplit = (goldenId) => {
    setCustomers(customers.map((c) => {
      if (c.goldenId === goldenId) {
        return {
          ...c,
          status: 'SPLIT_REJECTED',
          matchConfidence: 35,
        };
      }
      return c;
    }));

    logSecurityEvent(
      'IDENTITY_SPLIT',
      'Data conflict rejected; accounts partitioned as distinct identities',
      goldenId
    );
  };

  const handleOppAction = (oppId, action) => {
    setOpportunities(opportunities.map((o) => (o.id === oppId ? { ...o, status: action } : o)));
  };

  const handleCommitNewCustomer = (newCust) => {
    setCustomers([newCust, ...customers]);
    setSelectedCustomerId(newCust.goldenId);
    logSecurityEvent(
      'SIMULATION_INGEST',
      `New simulated multi-silo record ingested with ID: ${newCust.goldenId} (${newCust.status})`,
      newCust.goldenId
    );
  };

  const handleLiveRecalculate = () => {
    if (role !== 'ADMIN') return;

    setCustomers(customers.map((c) => {
      let computedScore = 0;
      const updatedCriteria = (c.matchCriteria || []).map((crit) => {
        let weight = rules.nameWeight;
        if (crit.field === 'PAN') weight = rules.panWeight;
        if (crit.field === 'Mobile') weight = rules.mobileWeight;
        if (crit.field === 'Email') weight = rules.emailWeight;

        computedScore += (crit.score * weight) / 100;
        return { ...crit, weight };
      });

      const finalConfidence = Math.round(computedScore);
      let newStatus = c.status;

      if (finalConfidence >= rules.autoMergeThreshold) {
        newStatus = 'AUTO_MERGED';
      } else if (finalConfidence >= rules.manualReviewThreshold) {
        newStatus = 'MANUAL_REVIEW';
      } else {
        newStatus = 'SPLIT_REJECTED';
      }

      return {
        ...c,
        matchConfidence: finalConfidence,
        status: newStatus,
        matchCriteria: updatedCriteria,
      };
    }));

    logSecurityEvent(
      'ENGINE_RECALCULATE',
      `Engine recalculated against AutoMerge ≥${rules.autoMergeThreshold}% & Review ≥${rules.manualReviewThreshold}%`
    );

    setRecalcFeedback(true);
    setTimeout(() => setRecalcFeedback(false), 3000);
  };

  const tabs = [
    { id: '360', label: 'Customer Overview', icon: Users, count: null },
    { id: 'REVIEW', label: 'Needs Review', icon: AlertCircle, count: pendingReviews.length, tone: 'warning' },
    { id: 'OPPORTUNITIES', label: 'Top Recommendations', icon: Sparkles, count: opportunities.filter((o) => o.status === 'PENDING').length, tone: 'gold' },
    { id: 'SIMULATOR', label: 'Silo Simulator', icon: Cpu, count: null },
    { id: 'RULES', label: 'Match Settings', icon: SlidersHorizontal, count: null },
  ];

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div
      className="c360-app"
      data-theme={theme}
      style={{
        minHeight: '100vh',
        background: 'var(--canvas)',
        color: 'var(--ink-900)',
        fontFamily: 'var(--font-ui)',
        transition: 'background-color 0.2s ease, color 0.2s ease'
      }}
    >

      {/* ============ Top Navigation Bar ============ */}
      <header style={{
        backgroundColor: '#0B1220',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '18px 36px',
        color: '#E7ECF7',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '76px',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          {/* Brand & Product Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
              flexShrink: 0
            }}>
              <Target size={24} color="#ffffff" strokeWidth={2.4} />
            </div>

            <div>
              <h1 style={{
                fontSize: '23px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                Customer 360 &amp; NBO Engine
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#94A3B8',
                margin: '4px 0 0 0',
                fontWeight: 400,
              }}>
                Stitch customer profiles, resolve duplicate accounts, and surface cross-sell recommendations.
              </p>
            </div>
          </div>

          {/* Controls: Theme Toggle, Audit Trail, PII Masking, & Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Dark / Light Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: theme === 'dark' ? '#FBBF24' : '#E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Audit Trail Badge */}
            {role !== 'RELATIONSHIP_MANAGER' && (
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="btn-quiet"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: '13.5px',
                  fontWeight: 600,
                  padding: '9px 16px',
                  borderRadius: 6
                }}
              >
                <FileText size={15} color="#38bdf8" />
                <span>Audit Trail</span>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  borderRadius: '10px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {auditLogs.length}
                </span>
              </button>
            )}

            {/* PII Masking Toggle */}
            <button
              onClick={toggleMasking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 16px',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backgroundColor: showMasked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: showMasked ? '#FCA5A5' : '#E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {showMasked ? <EyeOff size={15} color="#F87171" /> : <Eye size={15} color="#94A3B8" />}
              <span>{showMasked ? 'Mask sensitive info' : 'Show full info'}</span>
            </button>

            {/* Session User Profile & Sign Out */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.16)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: role === 'ADMIN' ? '#7C3AED' : role === 'DATA_STEWARD' ? '#0EA5E9' : '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontSize: '11px', fontWeight: 700,
              }}>
                {role === 'ADMIN' ? 'AD' : role === 'DATA_STEWARD' ? 'DS' : 'RM'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
                  {currentUser?.username?.split('@')[0] || 'User Session'}
                </span>
                <span className="mono" style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 700, marginTop: 2 }}>
                  {role.replace('_', ' ')}
                </span>
              </div>

              {role === 'RELATIONSHIP_MANAGER' && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Elevate role scope"
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '4px',
                  }}
                >
                  <Lock size={12} /> Switch Scope
                </button>
              )}

              <button
                onClick={handleFullLogout}
                title="Sign out of portal"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#FCA5A5',
                  borderRadius: '6px',
                  padding: '5px 9px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px',
                }}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============ Nav Tabs ============ */}
      <nav style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--line-200)', padding: '0 36px', display: 'flex', gap: 32, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const isAllowed = canAccessTab(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${isSelected ? 'is-active' : ''}`}
              style={{ opacity: isAllowed ? 1 : 0.45 }}
            >
              <Icon size={16} strokeWidth={2.2} />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`chip chip-${tab.tone === 'warning' ? 'warning' : tab.tone === 'gold' ? 'gold' : 'neutral'} mono`} style={{ fontSize: 11, padding: '2px 7px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ============ Main Content ============ */}
      <main style={{ maxWidth: 1360, margin: '28px auto', padding: '0 32px 56px' }}>

        {/* Access Denied Guard */}
        {!canAccessTab(activeTab) && (
          <div className="card" style={{ padding: '56px 28px', textAlign: 'center' }}>
            <ShieldX size={44} color="var(--danger-700)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 8px 0' }}>Access Restricted</h3>
            <p style={{ fontSize: 14.5, color: 'var(--ink-500)', margin: '0 0 20px 0' }}>
              This module requires Data Steward or Administrator authorization.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button variant="primary" onClick={() => setIsLoginModalOpen(true)}>
                Login to Privileged Portal
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab('360')}>
                Return to Overview
              </Button>
            </div>
          </div>
        )}

        {/* 1. CUSTOMER 360 TAB */}
        {canAccessTab(activeTab) && activeTab === '360' && (
          <div className="grid-360" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

            {/* Sidebar list */}
            <div className="card" style={{ padding: 18 }}>
              <h3 className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.06em' }}>
                All Customers ({customers.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '10px 0 3px 0' }}>{c.fullName}</p>
                      <p className="mono" style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
                        {inr(c.totalRelationshipValue)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Profile View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Profile Card */}
              <div className="card" style={{ padding: 28 }}>
                <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Avatar name={selectedCustomer.fullName} size={52} />
                    <div>
                      <MonoTag>ID {selectedCustomer.goldenId}</MonoTag>
                      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-900)', margin: '8px 0 6px 0', letterSpacing: '-0.02em' }}>
                        {selectedCustomer.fullName}
                      </h2>
                      <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} /> {selectedCustomer.city}
                        <span style={{ color: 'var(--line-300)' }}>•</span>
                        <Chip tone="gold">{selectedCustomer.segment} Tier</Chip>
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', background: 'var(--brand-050)', padding: '14px 20px', borderRadius: 8, border: '1px solid var(--brand-100)' }}>
                    <p style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Total Relationship Value
                    </p>
                    <p className="mono" style={{ fontSize: 27, fontWeight: 700, color: 'var(--brand-900)', margin: '3px 0 0 0' }}>
                      {inr(selectedCustomer.totalRelationshipValue)}
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid-info-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 26, paddingTop: 20, borderTop: '1px solid var(--line-100)' }}>
                  <div className="tile" style={{ padding: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>PAN Number</span>
                    <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '6px 0 0 0' }}>
                      {maskData(selectedCustomer.pan, 'PAN', showMasked)}
                    </p>
                  </div>
                  <div className="tile" style={{ padding: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mobile Contact</span>
                    <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '6px 0 0 0' }}>
                      {maskData(selectedCustomer.mobile, 'MOBILE', showMasked)}
                    </p>
                  </div>
                  <div className="tile" style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Confidence Match</span>
                    </div>
                    <ConfidenceRing value={selectedCustomer.matchConfidence} size={48} />
                  </div>
                </div>

                {selectedCustomer.hasConflict && (
                  <div style={{
                    marginTop: 18, padding: '14px 18px', backgroundColor: 'var(--surface)',
                    border: '1px solid var(--warning-line)', borderLeft: '3px solid var(--warning-500)',
                    borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <AlertTriangle size={18} color="var(--warning-500)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 14, color: 'var(--ink-700)', margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--warning-700)' }}>Data conflict — </strong>
                      {selectedCustomer.conflictField}
                    </p>
                  </div>
                )}
              </div>

              {/* Connected Accounts / Holdings + Multi-System Filter & Visual Graph Toggle */}
              <div className="card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                  <div>
                    <SectionHeading icon={Layers} title="Connected Accounts & Investments" />
                    <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: '-12px 0 0 0' }}>
                      Source provenance across Equity, Mutual Funds, Insurance, Loans &amp; Wealth.
                    </p>
                  </div>

                  <div style={{ display: 'flex', background: 'var(--surface-sunk)', padding: 3, borderRadius: 6, border: '1px solid var(--line-200)' }}>
                    <button
                      onClick={() => setViewMode('LIST')}
                      className={`segment ${viewMode === 'LIST' ? 'is-active' : ''}`}
                      style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <ListFilter size={14} /> List View
                    </button>
                    <button
                      onClick={() => setViewMode('GRAPH')}
                      className={`segment ${viewMode === 'GRAPH' ? 'is-active' : ''}`}
                      style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Network size={14} /> Visual Lineage Tree
                    </button>
                  </div>
                </div>

                {viewMode === 'LIST' && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                    {[
                      { id: 'ALL', label: 'All Silos' },
                      { id: 'EQUITY', label: 'Equity' },
                      { id: 'MUTUAL_FUNDS', label: 'Mutual Funds' },
                      { id: 'INSURANCE', label: 'Insurance' },
                      { id: 'LOANS', label: 'Loans' },
                      { id: 'WEALTH', label: 'Wealth Mgmt' },
                    ].map((silo) => {
                      const isSelected = holdingsFilter === silo.id;
                      return (
                        <button
                          key={silo.id}
                          onClick={() => setHoldingsFilter(silo.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            border: isSelected ? '1px solid var(--brand-600)' : '1px solid var(--line-200)',
                            backgroundColor: isSelected ? 'var(--brand-050)' : 'var(--surface)',
                            color: isSelected ? 'var(--brand-700)' : 'var(--ink-700)',
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                          }}
                        >
                          {silo.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'GRAPH' ? (
                  <LineageGraph customer={selectedCustomer} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredSourceRecords.length === 0 ? (
                      <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
                        No accounts held in <strong>{holdingsFilter}</strong> for this customer.
                      </div>
                    ) : (
                      filteredSourceRecords.map((src) => (
                        <div key={src.sourceId} className="tile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px' }}>
                          <div>
                            <SourceBadge system={src.sourceSystem} />
                            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '8px 0 3px 0' }}>
                              {src.name} <MonoTag>{src.sourceId}</MonoTag>
                            </p>
                            <p className="mono" style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
                              {maskData(src.email, 'EMAIL', showMasked)} · {maskData(src.mobile, 'MOBILE', showMasked)}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Account Value</span>
                            <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', margin: '3px 0 0 0' }}>
                              {inr(src.value)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Match Criteria */}
              <div className="card" style={{ padding: 26 }}>
                <SectionHeading title="Why was this profile matched?" description="Field-level comparison across every source system linked to this golden record." />
                <div className="grid-criteria-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {selectedCustomer.matchCriteria.map((crit) => (
                    <div key={crit.field} className="tile" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{crit.field}</span>
                        {crit.passed
                          ? <CheckCircle2 size={16} color="var(--success-500)" />
                          : <X size={16} color="var(--ink-300)" />}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '6px 0 0 0' }}>{crit.type} match ({crit.weight}%)</p>
                      <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '4px 0 0 0' }}>{crit.score}%</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. CONFLICT REVIEW QUEUE */}
        {canAccessTab(activeTab) && activeTab === 'REVIEW' && (
          <div className="card" style={{ padding: 28 }}>
            <SectionHeading
              title="Duplicate & Conflict Resolution Queue"
              description="These accounts share matching details (like phone number) but have conflicting names or emails. Select surviving attributes and confirm resolution."
            />

            {pendingReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: 'var(--success-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <ShieldCheck size={26} color="var(--success-700)" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 6px' }}>All caught up</p>
                <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: 0 }}>No unresolved customer records in the queue.</p>
              </div>
            ) : (
              pendingReviews.map((item) => (
                <ConflictReviewCard
                  key={item.goldenId}
                  item={item}
                  isSteward={role !== 'RELATIONSHIP_MANAGER'}
                  onConfirmMerge={handleConfirmMerge}
                  onSplit={handleSplit}
                />
              ))
            )}
          </div>
        )}

        {/* 3. NEXT-BEST-OPPORTUNITIES TAB */}
        {canAccessTab(activeTab) && activeTab === 'OPPORTUNITIES' && (
          <div className="card" style={{ padding: 28 }}>
            <SectionHeading
              icon={Sparkles}
              title="Smart Recommendations for Relationship Managers"
              description="High-confidence product ideas tailored to customer portfolios with zero coverage gaps."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
              {opportunities.map((opp) => (
                <div key={opp.id} className="tile" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)' }}>
                      {opp.customerName} <MonoTag>{opp.goldenId}</MonoTag>
                    </span>
                    <Chip tone="gold" icon={Flame}>{opp.score}% Match</Chip>
                  </div>

                  <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', margin: '16px 0 8px 0' }}>{opp.targetProduct}</h4>
                  <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.5, margin: 0 }}>{opp.triggerReason}</p>

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
          </div>
        )}

        {/* 4. SILO SIMULATOR TAB */}
        {canAccessTab(activeTab) && activeTab === 'SIMULATOR' && (
          <SiloSimulator
            rules={rules}
            onCommitNewCustomer={handleCommitNewCustomer}
          />
        )}

        {/* 5. RULES TAB */}
        {canAccessTab(activeTab) && activeTab === 'RULES' && (
          <div className="card" style={{ padding: 28 }}>
            <SectionHeading
              icon={SlidersHorizontal}
              title="Identity Stitching & Business Rule Configurator"
              description="Adjust individual attribute matching weights and threshold boundaries dynamically to execute live runtime identity re-scoring."
            />

            <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                
                {/* 1. Attribute Weights Section */}
                <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--line-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <p style={{ fontWeight: 700, color: 'var(--ink-900)', margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Attribute Match Weights
                    </p>
                    <span className="mono" style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 4,
                      backgroundColor: totalWeight === 100 ? 'var(--brand-050)' : 'var(--warning-line)',
                      color: totalWeight === 100 ? 'var(--brand-700)' : 'var(--warning-700)',
                      border: `1px solid ${totalWeight === 100 ? 'var(--brand-100)' : 'var(--warning-500)'}`
                    }}>
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

                {/* 2. Confidence Threshold Boundaries */}
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

                {/* 3. Apply & Trigger Recalculate Button */}
                {role === 'ADMIN' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Button
                      variant="primary"
                      icon={RefreshCw}
                      onClick={handleLiveRecalculate}
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

              {/* Execution Policy Summary Card */}
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
        )}

      </main>

      {/* ============ Compliance Audit Modal ============ */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
      />

      {/* ============ Privileged Portal Login Modal ============ */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}