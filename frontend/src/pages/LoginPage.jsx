import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Target, Eye, EyeOff, ArrowRight, Sun, Moon,
  ShieldCheck, Sparkles, Cpu, Layers, AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/ui.jsx';
import axiosClient from '../utils/api.js';

export function LoginPage({ onLogin, theme, toggleTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axiosClient.post('/users/login', { email, password });
      const payload = response.data?.data || response.data || response;
      const userObj = payload.user || payload;

      if (payload.accessToken) {
        localStorage.setItem('accessToken', payload.accessToken);
      }

      onLogin({
        email: userObj.email || email,
        role: userObj.role || 'RM',
        ...userObj,
      });

      navigate('/360');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Enter your enterprise user credentials to access the console.
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#CBD5E1' : '#475569', marginBottom: 6 }}>
                    Enterprise Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password..."
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
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={16} />
                </Button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
