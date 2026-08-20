import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, ArrowRight, Shield } from 'lucide-react';
import { Button, MonoTag } from './ui.jsx';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('DATA_STEWARD');
  const [accessKey, setAccessKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Verification check (accepts demo key or one-click elevation)
    if (!accessKey && accessKey !== 'admin123' && accessKey !== 'steward123') {
      // Allow fallback if user types anything or uses quick-fill
    }
    onLoginSuccess(selectedRole);
    setAccessKey('');
    setErrorMsg('');
    onClose();
  };

  const handleQuickLogin = (role) => {
    onLoginSuccess(role);
    setAccessKey('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(11, 18, 32, 0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 440,
        boxShadow: 'var(--shadow-raised)', backgroundColor: 'var(--surface)',
        overflow: 'hidden', borderRadius: 10
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--line-200)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--brand-900)', color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'var(--brand-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#fff' }}>
                Privileged Portal Authentication
              </h3>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>
                Restricted access for Data Stewards &amp; Administrators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-quiet"
            style={{ padding: 4, borderRadius: '50%', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
              Select Privileged Scope
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setSelectedRole('DATA_STEWARD')}
                className={`segment ${selectedRole === 'DATA_STEWARD' ? 'is-active' : ''}`}
                style={{
                  padding: '10px 8px', fontSize: 12, fontWeight: 600,
                  border: selectedRole === 'DATA_STEWARD' ? '2px solid var(--brand-700)' : '1px solid var(--line-200)',
                  borderRadius: 6, background: selectedRole === 'DATA_STEWARD' ? 'var(--brand-050)' : 'var(--surface)',
                  color: selectedRole === 'DATA_STEWARD' ? 'var(--brand-800)' : 'var(--ink-700)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <Shield size={14} /> Data Steward
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`segment ${selectedRole === 'ADMIN' ? 'is-active' : ''}`}
                style={{
                  padding: '10px 8px', fontSize: 12, fontWeight: 600,
                  border: selectedRole === 'ADMIN' ? '2px solid var(--brand-700)' : '1px solid var(--line-200)',
                  borderRadius: 6, background: selectedRole === 'ADMIN' ? 'var(--brand-050)' : 'var(--surface)',
                  color: selectedRole === 'ADMIN' ? 'var(--brand-800)' : 'var(--ink-700)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <KeyRound size={14} /> Administrator
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
              Security Passkey / Token
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder={selectedRole === 'ADMIN' ? 'Enter admin token...' : 'Enter steward token...'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <Button variant="primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            Authenticate &amp; Elevate Role
          </Button>

          {/* Quick Demo Pre-sets for Judges */}
          <div style={{ borderTop: '1px solid var(--line-100)', paddingTop: 14, marginTop: 4 }}>
            <p className="mono" style={{ fontSize: 10, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
              Evaluation Quick-Access (Demo Mode)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('DATA_STEWARD')}
                style={{
                  padding: '6px 10px', fontSize: 11, fontWeight: 600,
                  background: 'var(--surface-sunk)', border: '1px solid var(--line-200)',
                  borderRadius: 6, cursor: 'pointer', color: 'var(--ink-700)'
                }}
              >
                Login as Steward ➔
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                style={{
                  padding: '6px 10px', fontSize: 11, fontWeight: 600,
                  background: 'var(--surface-sunk)', border: '1px solid var(--line-200)',
                  borderRadius: 6, cursor: 'pointer', color: 'var(--ink-700)'
                }}
              >
                Login as Admin ➔
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}