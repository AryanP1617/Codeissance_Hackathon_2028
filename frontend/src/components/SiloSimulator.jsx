import React, { useState } from 'react';
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { SectionHeading, Button, MonoTag, Chip } from './common/ui.jsx';
import axiosClient from '../utils/api.js';

export function SiloSimulator() {
  const [formData, setFormData] = useState({
    fullName: '',
    pan: '',
    mobile: '',
    email: '',
    city: '',
    siloSystem: 'EQUITY',
    sourceCustomerId: '',
    value: '',
  });

  const [loading, setLoading] = useState(false);
  const [ingestResponse, setIngestResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIngestResponse(null);

    const generatedCustomerId = formData.sourceCustomerId.trim() ||
      `${formData.siloSystem.slice(0, 2)}_${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = [
      {
        sourceSystem: formData.siloSystem,
        sourceCustomerId: generatedCustomerId,
        rawAttributes: {
          fullName: formData.fullName.trim(),
          pan: formData.pan.trim().toUpperCase(),
          mobile: formData.mobile.trim(),
          email: formData.email.trim(),
          city: formData.city.trim(),
        },
        holdingsData: {
          portfolioValue: Number(formData.value) || 0,
          totalNavValue: Number(formData.value) || 0,
          sumAssured: Number(formData.value) || 0,
          outstandingAmount: Number(formData.value) || 0,
          aum: Number(formData.value) || 0,
        },
      },
    ];

    try {
      const response = await axiosClient.post('/ingest', payload);
      const data = response.data?.data || response.data;
      setIngestResponse(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Ingestion workflow failed. Please check your backend connections.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 28 }}>
      <SectionHeading
        icon={Cpu}
        title="Multi-Silo Ingestion & Identity Stitching Pipeline"
        description="Ingest raw financial records into /api/v1/ingest to trigger live multi-silo resolution, clustering, and NBO generation."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 32 }}>
        {/* Form Column */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Originating Silo System
              </label>
              <select
                value={formData.siloSystem}
                onChange={(e) => setFormData({ ...formData, siloSystem: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              >
                <option value="EQUITY">Equity (Direct Trading)</option>
                <option value="MUTUAL_FUNDS">Mutual Funds Registry</option>
                <option value="INSURANCE">Insurance System</option>
                <option value="LOANS">Lending Platform</option>
                <option value="WEALTH">Wealth Management (PMS)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Source Customer ID
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={formData.sourceCustomerId}
                onChange={(e) => setFormData({ ...formData, sourceCustomerId: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Vikramaditya Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                PAN Number
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Mobile Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9820012345"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. vikram@finance.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                Asset Value (₹ INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 750000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  borderRadius: 6, border: '1px solid var(--line-300)',
                  outline: 'none', background: 'var(--surface-sunk)', color: 'var(--ink-900)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            icon={loading ? RefreshCw : ArrowRight}
            style={{ width: '100%', justifyContent: 'center', padding: 11, marginTop: 6 }}
          >
            {loading ? 'Ingesting Payload...' : 'Trigger Pipeline Ingestion'}
          </Button>
        </form>

        {/* Response & Workflow Output */}
        <div className="tile" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--ink-900)', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Workflow Execution Result
            </p>

            {!ingestResponse ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-400)', fontSize: 13 }}>
                Submit record payload to trigger full backend ingestion, identity stitching, and NBO evaluation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip tone="success" icon={CheckCircle2}>Ingestion Complete</Chip>
                  <MonoTag>Records Ingested: {ingestResponse.ingestedCount || 1}</MonoTag>
                </div>

                {/* Identity Resolution Summary */}
                {ingestResponse.identityResolution && (
                  <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--line-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Layers size={15} color="var(--brand-700)" />
                      <strong style={{ fontSize: 13, color: 'var(--ink-900)' }}>Identity Resolution Engine</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12 }}>
                      <div style={{ padding: 8, background: 'var(--surface-sunk)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-500)', display: 'block' }}>Processed</span>
                        <strong className="mono" style={{ fontSize: 14, color: 'var(--ink-900)' }}>
                          {ingestResponse.identityResolution.processedRecordsCount ?? 0}
                        </strong>
                      </div>
                      <div style={{ padding: 8, background: 'var(--surface-sunk)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-500)', display: 'block' }}>Golden Records</span>
                        <strong className="mono" style={{ fontSize: 14, color: 'var(--brand-700)' }}>
                          {ingestResponse.identityResolution.goldenCustomerCount ?? 0}
                        </strong>
                      </div>
                      <div style={{ padding: 8, background: 'var(--surface-sunk)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-500)', display: 'block' }}>Review Queue</span>
                        <strong className="mono" style={{ fontSize: 14, color: 'var(--warning-700)' }}>
                          {ingestResponse.identityResolution.reviewQueueCount ?? 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* NBO Evaluation Summary */}
                {ingestResponse.nboEvaluation && (
                  <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--line-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Sparkles size={15} color="#F59E0B" />
                      <strong style={{ fontSize: 13, color: 'var(--ink-900)' }}>Next-Best-Opportunity Engine</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div style={{ padding: 8, background: 'var(--surface-sunk)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-500)', display: 'block' }}>Evaluated Profiles</span>
                        <strong className="mono" style={{ fontSize: 14, color: 'var(--ink-900)' }}>
                          {ingestResponse.nboEvaluation.evaluatedCustomerCount ?? 0}
                        </strong>
                      </div>
                      <div style={{ padding: 8, background: 'var(--surface-sunk)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-500)', display: 'block' }}>Generated Leads</span>
                        <strong className="mono" style={{ fontSize: 14, color: '#F59E0B' }}>
                          {ingestResponse.nboEvaluation.opportunitiesGeneratedCount ?? 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ingested Source Doc Details */}
                {ingestResponse.savedRecords?.[0] && (
                  <div style={{ fontSize: 12, padding: 10, background: 'var(--surface-sunk)', borderRadius: 6 }}>
                    <span style={{ color: 'var(--ink-500)' }}>Ingested Document ID: </span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>
                      {ingestResponse.savedRecords[0]._id || ingestResponse.savedRecords[0].sourceCustomerId}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiloSimulator;
