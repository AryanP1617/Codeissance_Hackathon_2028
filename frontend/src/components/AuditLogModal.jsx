import React, { useState } from 'react';
import { X, ShieldAlert, FileText, Filter, Search, ShieldCheck } from 'lucide-react';
import { MonoTag, Chip, Button } from './ui.jsx';

const ACTION_TONE_MAP = {
  PII_UNMASK: 'warning',
  PII_MASK: 'neutral',
  MANUAL_MERGE: 'success',
  IDENTITY_SPLIT: 'danger',
  RULE_UPDATE: 'brand',
  ENGINE_RECALCULATE: 'brand',
};

export function AuditLogModal({ isOpen, onClose, logs = [] }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterType === 'ALL' || log.actionType === filterType;
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(11, 18, 32, 0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 840, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'var(--shadow-raised)', backgroundColor: 'var(--surface)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--line-200)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'var(--brand-050)', border: '1px solid var(--brand-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldAlert size={18} color="var(--brand-700)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', margin: 0 }}>
                Compliance &amp; Security Audit Trail
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: '2px 0 0 0' }}>
                Immutable event log tracking PII unmasking, identity merges, and rule adjustments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-quiet"
            style={{ padding: 6, borderRadius: '50%', cursor: 'pointer' }}
          >
            <X size={18} color="var(--ink-500)" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid var(--line-200)',
          backgroundColor: 'var(--surface-sunk)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <Search size={14} color="var(--ink-400)" />
            <input
              type="text"
              placeholder="Search by actor, entity ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', border: 'none', background: 'transparent',
                fontSize: 12, color: 'var(--ink-900)', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} color="var(--ink-400)" />
            {['ALL', 'PII_UNMASK', 'MANUAL_MERGE', 'IDENTITY_SPLIT', 'RULE_UPDATE'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`segment ${filterType === type ? 'is-active' : ''}`}
                style={{ fontSize: 11, padding: '4px 8px' }}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Entries Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-400)' }}>
              <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No audit events found matching the criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredLogs.map((item) => (
                <div
                  key={item.id}
                  className="tile"
                  style={{
                    padding: '12px 14px', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', gap: 14
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <Chip tone={ACTION_TONE_MAP[item.actionType] || 'neutral'}>
                      {item.actionType}
                    </Chip>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', margin: '0 0 2px 0' }}>
                        {item.details}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--ink-500)', margin: 0 }}>
                        Triggered by <span style={{ fontWeight: 600, color: 'var(--ink-700)' }}>{item.actor}</span>
                        {item.targetId && (
                          <> · Target Entity <MonoTag>{item.targetId}</MonoTag></>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                    {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--line-200)',
          backgroundColor: 'var(--surface-sunk)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> logged events
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}