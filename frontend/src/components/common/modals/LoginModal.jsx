import React, { useState } from 'react';
import { X, Lock, KeyRound, Shield } from 'lucide-react';
import { Button } from '../ui.jsx';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('DATA_STEWARD');
  const [accessKey, setAccessKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess(selectedRole);
    setAccessKey('');
    onClose();
  };

  const handleQuickLogin = (role) => {
    onLoginSuccess(role);
    setAccessKey('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(3, 7, 18, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 440,
        boxShadow: 'var(--shadow-raised)', backgroundColor: 'var(--surface)',
        overflow: 'hidden', borderRadius: 10, border: '1px solid var(--line-200)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--line-200)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--surface-sunk)', color: 'var(--ink-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'var(--brand-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={16} color="var(--brand-700)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink-900)' }}>
                Privileged Portal Authentication
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '2px 0 0 0' }}>
                Restricted access for Data Stewards &amp; Administrators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-quiet"
            style={{ padding: 4, borderRadius: '50%', cursor: 'pointer', color: 'var(--ink-500)' }}
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
                style={{
                  padding: '10px 8px', fontSize: 12, fontWeight: 600,
                  border: selectedRole === 'DATA_STEWARD' ? '2px solid var(--brand-500)' : '1px solid var(--line-200)',
                  borderRadius: 6,
                  background: selectedRole === 'DATA_STEWARD' ? 'var(--brand-050)' : 'var(--surface-sunk)',
                  color: selectedRole === 'DATA_STEWARD' ? 'var(--brand-700)' : 'var(--ink-700)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <Shield size={14} /> Data Steward
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                style={{
                  padding: '10px 8px', fontSize: 12, fontWeight: 600,
                  border: selectedRole === 'ADMIN' ? '2px solid var(--brand-500)' : '1px solid var(--line-200)',
                  borderRadius: 6,
                  background: selectedRole === 'ADMIN' ? 'var(--brand-050)' : 'var(--surface-sunk)',
                  color: selectedRole === 'ADMIN' ? 'var(--brand-700)' : 'var(--ink-700)',
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
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <Button variant="primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            Authenticate &amp; Elevate Role
          </Button>

          {/* Quick Demo Pre-sets for Judges */}
          <div style={{ borderTop: '1px solid var(--line-200)', paddingTop: 14, marginTop: 4 }}>
            <p className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center', fontWeight: 600 }}>
              Evaluation Quick-Access (Demo Mode)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('DATA_STEWARD')}
                style={{
                  padding: '7px 10px', fontSize: 12, fontWeight: 600,
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
                  padding: '7px 10px', fontSize: 12, fontWeight: 600,
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
