import React from 'react';
import { useNavigate, useLocation } from 'react-router';

export function TabNavigation({ tabs, canAccessTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--line-200)',
      padding: '0 36px',
      display: 'flex',
      gap: 32,
      overflowX: 'auto',
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isSelected = location.pathname === tab.path || (location.pathname === '/' && tab.path === '/360');
        const isAllowed = canAccessTab ? canAccessTab(tab.id) : true;

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`tab ${isSelected ? 'is-active' : ''}`}
            style={{ opacity: isAllowed ? 1 : 0.45, cursor: 'pointer' }}
          >
            <Icon size={16} strokeWidth={2.2} />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`chip chip-${tab.tone === 'warning' ? 'warning' : tab.tone === 'gold' ? 'gold' : 'neutral'} mono`}
                style={{ fontSize: 11, padding: '2px 7px' }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
