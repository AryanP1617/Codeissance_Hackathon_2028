import React from 'react';
import { SOURCE_SYSTEM_META, MonoTag } from './ui.jsx';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function LineageGraph({ customer }) {
  const sources = customer.sourceRecords || [];
  const count = sources.length;

  const svgWidth = 720;
  const svgHeight = Math.max(280, count * 90);
  const centerX = 200;
  const centerY = svgHeight / 2;
  const targetX = 520;

  return (
    <div style={{
      width: '100%',
      overflowX: 'auto',
      backgroundColor: 'var(--surface-sunk)',
      borderRadius: 8,
      border: '1px solid var(--line-200)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
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
          {sources.map((src, i) => {
            const startY = centerY;
            const endY = count === 1 ? centerY : 60 + (i * (svgHeight - 120)) / (count - 1);
            const midX = (centerX + targetX) / 2;
            const meta = SOURCE_SYSTEM_META[src.sourceSystem] || { color: '#67727E' };

            return (
              <g key={`edge-${src.sourceId}`}>
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
            <rect
              width="190"
              height="24"
              rx="8"
              fill="var(--brand-900)"
            />
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
              {customer.fullName.length > 20 ? `${customer.fullName.substring(0, 18)}...` : customer.fullName}
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
              {customer.goldenId} · {customer.matchConfidence}% Match
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
              TRV: {inr(customer.totalRelationshipValue)}
            </text>
          </g>

          {/* Source Record Satellite Nodes */}
          {sources.map((src, i) => {
            const endY = count === 1 ? centerY : 60 + (i * (svgHeight - 120)) / (count - 1);
            const meta = SOURCE_SYSTEM_META[src.sourceSystem] || { label: src.sourceSystem, color: '#67727E' };

            return (
              <g key={`node-${src.sourceId}`} transform={`translate(${targetX + 15}, ${endY - 32})`} filter="url(#shadow)">
                <rect
                  width="170"
                  height="64"
                  rx="6"
                  fill="var(--surface)"
                  stroke="var(--line-200)"
                  strokeWidth="1.5"
                />
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="64"
                  rx="2"
                  fill={meta.color}
                />
                <text
                  x="12"
                  y="18"
                  fill={meta.color}
                  fontSize="10"
                  fontWeight="800"
                  className="mono"
                >
                  ● {meta.label.toUpperCase()}
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
                  {src.name.length > 18 ? `${src.name.substring(0, 16)}...` : src.name}
                </text>
                <text
                  x="12"
                  y="52"
                  fill="var(--ink-500)"
                  fontSize="11"
                  className="mono"
                >
                  Assets: {inr(src.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--ink-500)' }}>
        <span>Lineage Source: <strong>{sources.length} Disparate Core DBs</strong></span>
        <span>•</span>
        <span>Resolution: <strong>Weighted Probabilistic &amp; Deterministic Graph</strong></span>
      </div>
    </div>
  );
}