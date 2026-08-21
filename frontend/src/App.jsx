import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router';

import { Navbar } from './components/layout/Navbar.jsx';
import { TabNavigation } from './components/layout/TabNavigation.jsx';
import { AccessDeniedCard } from './components/common/AccessDeniedCard.jsx';
import { AuditLogModal } from './components/common/modals/AuditLogModal.jsx';
import { LoginModal } from './components/common/modals/LoginModal.jsx';

import { LoginPage } from './pages/LoginPage.jsx';
import { Customer360Page } from './pages/Customer360Page.jsx';
import { ReviewQueuePage } from './pages/ReviewQueuePage.jsx';
import { OpportunitiesPage } from './pages/OpportunitiesPage.jsx';
import { SiloSimulatorPage } from './pages/SiloSimulatorPage.jsx';
import { MatchSettingsPage } from './pages/MatchSettingsPage.jsx';

import { Users, AlertCircle, Sparkles, SlidersHorizontal, Cpu } from 'lucide-react';
import './styles/theme.css';

// Protected Route Wrapper
function ProtectedLayout({ children, isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainAppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('RM');

  // Theme & Masking State
  const [theme, setTheme] = useState('light');
  const [showMasked, setShowMasked] = useState(false);

  // Modal States
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleMasking = () => {
    setShowMasked((prev) => !prev);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setRole(user.role || 'RM');
    setIsAuthenticated(true);
    navigate('/360');
  };

  const handleFullLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setRole('RM');
    navigate('/');
  };

  const handleLoginSuccess = (elevatedRole) => {
    setRole(elevatedRole);
    if (currentUser) {
      setCurrentUser({ ...currentUser, role: elevatedRole });
    }
  };

  const canAccessTab = (tabId) => {
    if (role === 'ADMIN' || role === 'JUDGE') return true;
    if (role === 'DATA_STEWARD') return tabId !== 'RULES';
    if (role === 'RM') return tabId === '360' || tabId === 'OPPORTUNITIES';
    return false;
  };

  const tabs = [
    { id: '360', label: 'Customer Overview', icon: Users, path: '/360', count: null },
    { id: 'REVIEW', label: 'Needs Review', icon: AlertCircle, path: '/review', count: null, tone: 'warning' },
    { id: 'OPPORTUNITIES', label: 'Top Recommendations', icon: Sparkles, path: '/opportunities', count: null, tone: 'gold' },
    { id: 'SIMULATOR', label: 'Silo Simulator', icon: Cpu, path: '/simulator', count: null },
    { id: 'RULES', label: 'Match Settings', icon: SlidersHorizontal, path: '/rules', count: null },
  ];

  return (
    <div
      className="c360-app"
      data-theme={theme}
      style={{
        minHeight: '100vh',
        background: 'var(--canvas)',
        color: 'var(--ink-900)',
        fontFamily: 'var(--font-ui)',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      <Routes>
        {/* Default Route -> Login Page */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/360" replace />
            ) : (
              <LoginPage
                onLogin={handleLogin}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            )
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedLayout isAuthenticated={isAuthenticated}>
              <Navbar
                role={role}
                currentUser={currentUser}
                theme={theme}
                showMasked={showMasked}
                auditCount={0}
                onToggleTheme={toggleTheme}
                onToggleMasking={toggleMasking}
                onOpenAudit={() => setIsAuditModalOpen(true)}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onLogout={handleFullLogout}
              />

              <TabNavigation
                tabs={tabs}
                canAccessTab={canAccessTab}
              />

              <main style={{ maxWidth: 1360, margin: '28px auto', padding: '0 32px 56px' }}>
                <Routes>
                  <Route
                    path="/360"
                    element={
                      canAccessTab('360') ? (
                        <Customer360Page showMasked={showMasked} />
                      ) : (
                        <AccessDeniedCard
                          onOpenLogin={() => setIsLoginModalOpen(true)}
                          onReturnOverview={() => navigate('/360')}
                        />
                      )
                    }
                  />

                  <Route
                    path="/review"
                    element={
                      canAccessTab('REVIEW') ? (
                        <ReviewQueuePage role={role} />
                      ) : (
                        <AccessDeniedCard
                          onOpenLogin={() => setIsLoginModalOpen(true)}
                          onReturnOverview={() => navigate('/360')}
                        />
                      )
                    }
                  />

                  <Route
                    path="/opportunities"
                    element={
                      canAccessTab('OPPORTUNITIES') ? (
                        <OpportunitiesPage />
                      ) : (
                        <AccessDeniedCard
                          onOpenLogin={() => setIsLoginModalOpen(true)}
                          onReturnOverview={() => navigate('/360')}
                        />
                      )
                    }
                  />

                  <Route
                    path="/simulator"
                    element={
                      canAccessTab('SIMULATOR') ? (
                        <SiloSimulatorPage />
                      ) : (
                        <AccessDeniedCard
                          onOpenLogin={() => setIsLoginModalOpen(true)}
                          onReturnOverview={() => navigate('/360')}
                        />
                      )
                    }
                  />

                  <Route
                    path="/rules"
                    element={
                      canAccessTab('RULES') ? (
                        <MatchSettingsPage role={role} />
                      ) : (
                        <AccessDeniedCard
                          onOpenLogin={() => setIsLoginModalOpen(true)}
                          onReturnOverview={() => navigate('/360')}
                        />
                      )
                    }
                  />

                  <Route path="*" element={<Navigate to="/360" replace />} />
                </Routes>
              </main>
            </ProtectedLayout>
          }
        />
      </Routes>

      {/* Compliance Audit Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={[]}
      />

      {/* Privileged Portal Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default function App() {
  return <MainAppShell />;
}