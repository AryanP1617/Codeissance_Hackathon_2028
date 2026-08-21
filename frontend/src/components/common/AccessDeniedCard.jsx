import React from 'react';
import { ShieldX } from 'lucide-react';
import { Button } from './ui.jsx';

export function AccessDeniedCard({ onOpenLogin, onReturnOverview }) {
  return (
    <div className="card" style={{ padding: '56px 28px', textAlign: 'center' }}>
      <ShieldX size={44} color="var(--danger-700)" style={{ margin: '0 auto 14px' }} />
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 8px 0' }}>
        Access Restricted
      </h3>
      <p style={{ fontSize: 14.5, color: 'var(--ink-500)', margin: '0 0 20px 0' }}>
        This module requires Data Steward or Administrator authorization.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <Button variant="primary" onClick={onOpenLogin}>
          Login to Privileged Portal
        </Button>
        <Button variant="secondary" onClick={onReturnOverview}>
          Return to Overview
        </Button>
      </div>
    </div>
  );
}
