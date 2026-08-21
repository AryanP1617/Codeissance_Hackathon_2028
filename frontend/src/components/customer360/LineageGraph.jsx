import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/api.js';
import { SOURCE_SYSTEM_META } from '../common/ui.jsx';

const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

export function LineageGraph({ customer = {} }) {
  const [lineagePayload, setLineagePayload] = useState(null);
  const [loading, setLoading] = useState(false);

  const goldenId = customer.goldenId || customer.goldenCustomerId;

  useEffect(() => {
    if (!goldenId) return;

    let isMounted = true;
    setLoading(true);

    axiosClient
      .get(`/customers/get-customers/${goldenId}/lineage-graph`)
      .then((res) => {
        if (isMounted && res.data?.data) {
          setLineagePayload(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Dedicated lineage API fetch failed, falling back to props:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [goldenId]);

  // Extract source nodes from the API payload (or fallback to passed props)
  const masterNode = lineagePayload?.nodes?.find((n) => n.type === 'GOLDEN_RECORD') || {
    label: customer.fullName || 'Golden Master Record',
    goldenCustomerId: goldenId || 'GC-0000',
    matchConfidence: customer.matchConfidence || 100,
    totalRelationshipValue: customer.totalRelationshipValue || 0,
  };

  const sources = (
    lineagePayload?.nodes?.filter((n) => n.type === 'SOURCE_RECORD') || []
  ).map((n) => ({
    sourceSystem: n.sourceSystem,
    sourceId: n.sourceCustomerId,
    name: n.accountHolderName,
    value: n.assetValue,
    confidenceScore: n.confidenceScore,
  }));

  // Fallback to customer.sourceRecords if API response has no sources
  const activeSources = sources.length > 0 ? sources : customer.sourceRecords || [];
  const count = activeSources.length;

  const breakdown = customer.totalRelationshipValue?.breakdown || customer.breakdown || lineagePayload?.breakdown || {};

  const getFallbackValue = (system) => {
    const sys = system?.toUpperCase();
    if (sys === 'EQUITY') return breakdown.equity || 0;
    if (sys === 'MUTUAL_FUNDS') return breakdown.mutualFunds || 0;
    if (sys === 'INSURANCE') return breakdown.insurance || 0;
    if (sys === 'LOANS') return breakdown.loans || 0;
    if (sys === 'WEALTH') return breakdown.wealth || 0;
    return 0;
  };

  const svgWidth = 720;
  const svgHeight = Math.max(280, count * 90);
  const centerX = 200;
  const centerY = svgHeight / 2;
  const targetX = 520;

  if (loading && !lineagePayload) {
    return (
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--surface-sunk)',
          borderRadius: 8,
          border: '1px solid var(--line-200)',
          padding: '48px 16px',
          textAlign: 'center',
          color: 'var(--ink-500)',
          fontSize: 13,
        }}
      >
        Fetching dynamic lineage graph...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: 'var(--surface-sunk)',
        borderRadius: 8,
        border: '1px solid var(--line-200)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: svgWidth }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-700)" />
              <stop offset="100%" stopColor="var(--brand-500)" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Curved Connector Lines */}
          {activeSources.map((src, i) => {
            const startY = centerY;
            const endY = count === 1 ? centerY : 60 + (i * (svgHeight - 120)) / (count - 1);
            const midX = (centerX + targetX) / 2;
            const meta = SOURCE_SYSTEM_META[src.sourceSystem] || { color: '#67727E' };

            return (
              <g key={`edge-${src.sourceSystem}-${src.sourceId}`}>
                <path
                  d={`M ${centerX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${targetX} ${endY}`}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
                <circle cx={targetX} cy={endY} r="4" fill={meta.color} />
              </g>
            );
          })}

          {/* Central Golden Record Node */}
          <g transform={`translate(${centerX - 95}, ${centerY - 45})`} filter="url(#shadow)">
            <rect
              width="190"
              height="90"
              rx="8"
              fill="var(--surface)"
              stroke="var(--brand-700)"
              strokeWidth="2"
            />
            <rect width="190" height="24" rx="8" fill="var(--brand-900)" />
            <text
              x="95"
              y="16"
              fill="#ffffff"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
              className="mono"
              letterSpacing="0.05em"
            >
              GOLDEN MASTER RECORD
            </text>
            <text
              x="95"
              y="46"
              fill="var(--ink-900)"
              fontSize="13"
              fontWeight="700"
              textAnchor="middle"
            >
              {masterNode.label.length > 20
                ? `${masterNode.label.substring(0, 18)}...`
                : masterNode.label}
            </text>
            <text
              x="95"
              y="63"
              fill="var(--ink-500)"
              fontSize="11"
              fontWeight="500"
              textAnchor="middle"
              className="mono"
            >
              {masterNode.goldenCustomerId} · {masterNode.matchConfidence}% Match
            </text>
            <text
              x="95"
              y="79"
              fill="var(--brand-700)"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              className="mono"
            >
              TRV: {inr(masterNode.totalRelationshipValue)}
            </text>
          </g>

          {/* Source Record Satellite Nodes */}
          {activeSources.map((src, i) => {
            const endY = count === 1 ? centerY : 60 + (i * (svgHeight - 120)) / (count - 1);
            const meta = SOURCE_SYSTEM_META[src.sourceSystem] || {
              label: src.sourceSystem,
              color: '#67727E',
            };
            const displayValue = Number(src.value || 0) > 0 ? src.value : getFallbackValue(src.sourceSystem);

            return (
              <g
                key={`node-${src.sourceSystem}-${src.sourceId}`}
                transform={`translate(${targetX + 15}, ${endY - 32})`}
                filter="url(#shadow)"
              >
                <rect
                  width="170"
                  height="64"
                  rx="6"
                  fill="var(--surface)"
                  stroke="var(--line-200)"
                  strokeWidth="1.5"
                />
                <rect x="0" y="0" width="4" height="64" rx="2" fill={meta.color} />
                <text
                  x="12"
                  y="18"
                  fill={meta.color}
                  fontSize="10"
                  fontWeight="800"
                  className="mono"
                >
                  ● {meta.label ? meta.label.toUpperCase() : 'SOURCE'}
                </text>
                <text
                  x="158"
                  y="18"
                  fill="var(--ink-400)"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor="end"
                  className="mono"
                >
                  {src.sourceId}
                </text>
                <text
                  x="12"
                  y="36"
                  fill="var(--ink-900)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {(src.name || 'Account').length > 18
                    ? `${(src.name || 'Account').substring(0, 16)}...`
                    : src.name || 'Account'}
                </text>
                <text
                  x="12"
                  y="52"
                  fill="var(--ink-500)"
                  fontSize="11"
                  className="mono"
                >
                  Assets: {inr(displayValue)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 14,
          fontSize: 11,
          color: 'var(--ink-500)',
        }}
      >
        <span>
          Lineage Source: <strong>{activeSources.length} Disparate Core DBs</strong>
        </span>
        <span>•</span>
        <span>
          Resolution: <strong>Weighted Probabilistic &amp; Deterministic Graph</strong>
        </span>
      </div>
    </div>
  );
}

export default LineageGraph;