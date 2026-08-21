import React from 'react';
import { Target, Sun, Moon, FileText, Eye, EyeOff, Lock, LogOut } from 'lucide-react';

export function Navbar({
  role,
  currentUser,
  theme,
  showMasked,
  auditCount,
  onToggleTheme,
  onToggleMasking,
  onOpenAudit,
  onOpenLogin,
  onLogout,
}) {
  return (
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

        {/* Controls: Theme Toggle, Audit Trail, PII Masking, & Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
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
          {role !== 'RM' && (
            <button
              onClick={onOpenAudit}
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
                {auditCount}
              </span>
            </button>
          )}

          {/* PII Masking Toggle */}
          <button
            onClick={onToggleMasking}
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

            <button
              onClick={onLogout}
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
  );
}
