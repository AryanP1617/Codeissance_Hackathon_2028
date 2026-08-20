import React from 'react';

/**
 * Computes character-level differences between two strings using LCS.
 * Highlights conflicting characters with distinct tones for Source A vs Source B.
 */
export function HighlightedDiff({ valueA = '', valueB = '', displayFor = 'A' }) {
  const sA = String(valueA);
  const sB = String(valueB);

  // Exact match - render plain text
  if (sA === sB) {
    return <span>{sA}</span>;
  }

  const n = sA.length;
  const m = sB.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (sA[i - 1] === sB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const inLcsA = new Array(n).fill(false);
  const inLcsB = new Array(m).fill(false);

  while (i > 0 && j > 0) {
    if (sA[i - 1] === sB[j - 1]) {
      inLcsA[i - 1] = true;
      inLcsB[j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const targetStr = displayFor === 'A' ? sA : sB;
  const inLcs = displayFor === 'A' ? inLcsA : inLcsB;

  // Group into matched vs mismatched chunks
  const chunks = [];
  let currText = '';
  let currIsMatch = inLcs[0];

  for (let k = 0; k < targetStr.length; k++) {
    if (inLcs[k] === currIsMatch) {
      currText += targetStr[k];
    } else {
      chunks.push({ text: currText, isMatch: currIsMatch });
      currText = targetStr[k];
      currIsMatch = inLcs[k];
    }
  }
  if (currText) chunks.push({ text: currText, isMatch: currIsMatch });

  return (
    <span>
      {chunks.map((chunk, idx) => {
        if (chunk.isMatch) {
          return <span key={idx}>{chunk.text}</span>;
        }
        return (
          <span
            key={idx}
            style={{
              backgroundColor: displayFor === 'A' ? '#fee2e2' : '#fef3c7',
              color: displayFor === 'A' ? '#991b1b' : '#92400e',
              fontWeight: 700,
              padding: '1px 3px',
              borderRadius: '3px',
              border: `1px solid ${displayFor === 'A' ? '#fca5a5' : '#fde68a'}`,
            }}
          >
            {chunk.text}
          </span>
        );
      })}
    </span>
  );
}