import React from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Avatar, MonoTag, Chip, ConfidenceRing } from '../common/ui.jsx';
import { maskData } from '../../utils/masking';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function ProfileHeaderCard({ selectedCustomer, showMasked }) {
  return (
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
  );
}
