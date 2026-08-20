import React, { useState } from 'react';
import {
  Target, Shield, KeyRound, Lock, Eye, EyeOff, ArrowRight,
  Sun, Moon, Users, CheckCircle2, ShieldCheck, Sparkles, Cpu, Layers
} from 'lucide-react';
import { Button, Chip } from './ui.jsx';

export function LoginPage({ onLogin, theme, toggleTheme }) {
  const [selectedRole, setSelectedRole] = useState('DATA_STEWARD');
  const [username, setUsername] = useState('steward.alex@wealthbank.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleConfigs = {
    RELATIONSHIP_MANAGER: {
      title: 'Relationship Manager',
      icon: Users,
      badge: 'Client Facing',
      description: 'Access Customer 360 dossiers, total relationship values, and AI Next-Best-Opportunity pitches.',
      defaultUsername: 'rm.sarah@wealthbank.com',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    },
    DATA_STEWARD: {
      title: 'Data Steward',
      icon: Shield,
      badge: 'Identity Governance',
      description: 'Resolve duplicate identity queues, reconcile conflicting records, and run silo simulations.',
      defaultUsername: 'steward.alex@wealthbank.com',
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
    },
    ADMIN: {
      title: 'Administrator',
      icon: KeyRound,
      badge: 'Full Operations',
      description: 'Configure matching algorithm weights, confidence boundaries, and re-execute resolution engines.',
      defaultUsername: 'admin.lead@wealthbank.com',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    },
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setUsername(roleConfigs[roleKey].defaultUsername);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin({
        role: selectedRole,
        username: username || roleConfigs[selectedRole].defaultUsername,
      });
      setIsSubmitting(false);
    }, 300);
  };

  const handleQuickPreset = (roleKey) => {
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin({
        role: roleKey,
        username: roleConfigs[roleKey].defaultUsername,
      });
      setIsSubmitting(false);
    }, 200);
  };

  const activeConfig = roleConfigs[selectedRole];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: theme === 'dark' ? '#070C16' : '#F8FAFC',
      color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-ui)',
      transition: 'background-color 0.2s ease, color 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '20%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '15%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', filter: 'blur(70px)',
      }} />

      {/* Top Header Bar */}
      <header style={{
        backgroundColor: '#0B1220',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
          }}>
            <Target size={22} color="#ffffff" strokeWidth={2.4} />
          </div>
          <div>
            <h1 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Customer 360 &amp; NBO Engine
            </h1>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
              Enterprise Identity Resolution &amp; Data Stewardship Portal
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
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
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        zIndex: 5,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.05fr',
          gap: '32px',
          alignItems: 'stretch',
        }}>

          {/* Left Panel: Platform Showcase */}
          <div className="card" style={{
            padding: '36px 32px',
            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3)',
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, backgroundColor: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', color: '#3B82F6', fontSize: '12px', fontWeight: 700, marginBottom: 18 }}>
                <ShieldCheck size={14} /> Unified Financial Data Platform
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
                Stitch identities, resolve conflicts, and drive sales.
              </h2>
              <p style={{ fontSize: '14.5px', color: theme === 'dark' ? '#94A3B8' : '#64748B', lineHeight: 1.6, margin: '0 0 28px 0' }}>
                Connect disparate financial silos into deterministic Golden Records with real-time heuristic scoring and automated stewardship.
              </p>

              {/* Feature Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Layers size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0 }}>Multi-Silo Profile Stitching</h4>
                    <p style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '3px 0 0 0' }}>
                      Unify Equity, Mutual Funds, Loans, Wealth &amp; Insurance accounts into 360° views.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(251, 191, 36, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Sparkles size={18} color="#F59E0B" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0 }}>Next-Best-Opportunity Engine</h4>
                    <p style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '3px 0 0 0' }}>
                      Automatically surface high-margin investment pitches to Relationship Managers.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Cpu size={18} color="#22C55E" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0 }}>Immutable Audit &amp; PII Shield</h4>
                    <p style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '3px 0 0 0' }}>
                      Zero-trust data masking with tamper-evident security logging for compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Certifications */}
            <div style={{
              paddingTop: '20px',
              marginTop: '28px',
              borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: theme === 'dark' ? '#64748B' : '#94A3B8',
            }}>
              <span>🛡️ ISO 27001 Certified</span>
              <span>🔒 256-Bit Encrypted</span>
              <span>⚡ v2.8 High Throughput</span>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="card" style={{
            padding: '36px 32px',
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(226, 232, 240, 1)',
            borderRadius: '16px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                  Sign in to your Portal
                </h3>
                <p style={{ fontSize: '13.5px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: 0 }}>
                  Select your authorization scope and enter credentials.
                </p>
              </div>

              {/* Role Scope Selection Cards */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#CBD5E1' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                  Select Persona Scope
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(roleConfigs).map(([roleKey, cfg]) => {
                    const IconComp = cfg.icon;
                    const isSelected = selectedRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleRoleSelect(roleKey)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid #2563EB'
                            : theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                          backgroundColor: isSelected
                            ? (theme === 'dark' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.06)')
                            : (theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC'),
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: cfg.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff', flexShrink: 0
                        }}>
                          <IconComp size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: theme === 'dark' ? '#F8FAFC' : '#0F172A' }}>
                              {cfg.title}
                            </span>
                            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#2563EB' : (theme === 'dark' ? '#94A3B8' : '#64748B') }}>
                              {cfg.badge}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                            {cfg.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Controls */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#CBD5E1' : '#475569', marginBottom: 6 }}>
                    Enterprise User ID
                  </label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      borderRadius: '8px',
                      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                      color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#CBD5E1' : '#475569', marginBottom: 6 }}>
                    Security Token / Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 14px',
                        fontSize: '13.5px',
                        borderRadius: '8px',
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                        backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                        color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                    />
                    Remember session (24h)
                  </label>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    marginTop: 4,
                  }}
                >
                  {isSubmitting ? 'Authenticating...' : `Enter as ${activeConfig.title}`} <ArrowRight size={16} />
                </Button>
              </form>
            </div>

            {/* Quick Demo Mode Shortcuts */}
            <div style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            }}>
              <p className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center', letterSpacing: '0.06em' }}>
                ⚡ Fast Demo Login Presets
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('RELATIONSHIP_MANAGER')}
                  style={{
                    padding: '8px 6px', fontSize: '11.5px', fontWeight: 600,
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                    borderRadius: '6px', cursor: 'pointer', color: theme === 'dark' ? '#E2E8F0' : '#334155',
                    textAlign: 'center'
                  }}
                >
                  RM Persona ➔
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('DATA_STEWARD')}
                  style={{
                    padding: '8px 6px', fontSize: '11.5px', fontWeight: 600,
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                    borderRadius: '6px', cursor: 'pointer', color: theme === 'dark' ? '#E2E8F0' : '#334155',
                    textAlign: 'center'
                  }}
                >
                  Steward ➔
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('ADMIN')}
                  style={{
                    padding: '8px 6px', fontSize: '11.5px', fontWeight: 600,
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                    borderRadius: '6px', cursor: 'pointer', color: theme === 'dark' ? '#E2E8F0' : '#334155',
                    textAlign: 'center'
                  }}
                >
                  Admin ➔
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
