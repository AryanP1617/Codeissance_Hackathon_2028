/**
 * Reconstructed from call sites in App.jsx and the product screenshots
 * (this file was referenced but not included in the upload). Shapes and
 * values are set to match what was shown in the UI.
 */

export const initialCustomers = [
  {
    goldenId: 'GC-1001',
    fullName: 'Aditya Sharma',
    city: 'Mumbai',
    segment: 'HNI',
    status: 'AUTO_MERGED',
    totalRelationshipValue: 2450000,
    pan: 'ABCPS1234F',
    mobile: '+91-98765-43210',
    matchConfidence: 94,
    hasConflict: true,
    conflictField: 'Email differs across Equity (aditya.sharma@example.com) and MF (aditya.s@work.com)',
    sourceRecords: [
      {
        sourceSystem: 'EQUITY',
        sourceId: 'EQ-8821',
        name: 'Aditya Sharma',
        email: 'aditya.sharma@example.com',
        mobile: '+91-98765-43210',
        value: 1500000,
      },
      {
        sourceSystem: 'MUTUAL_FUNDS',
        sourceId: 'MF-4402',
        name: 'Aditya Sharma',
        email: 'aditya.s@work.com',
        mobile: '+91-98765-43210',
        value: 950000,
      },
    ],
    matchCriteria: [
      { field: 'PAN Number', type: 'Exact', score: 100, passed: true },
      { field: 'Mobile Number', type: 'Exact', score: 100, passed: true },
      { field: 'Full Name', type: 'Fuzzy', score: 96, passed: true },
      { field: 'Email Domain', type: 'Fuzzy', score: 62, passed: false },
    ],
  },
  {
    goldenId: 'GC-1002',
    fullName: 'Pooja Mehta',
    city: 'Bengaluru',
    segment: 'Affluent',
    status: 'AUTO_MERGED',
    totalRelationshipValue: 850000,
    pan: 'BXYPM5678K',
    mobile: '+91-90210-11223',
    matchConfidence: 91,
    hasConflict: false,
    conflictField: null,
    sourceRecords: [
      {
        sourceSystem: 'WEALTH',
        sourceId: 'WM-2210',
        name: 'Pooja Mehta',
        email: 'pooja.mehta@example.com',
        mobile: '+91-90210-11223',
        value: 550000,
      },
      {
        sourceSystem: 'INSURANCE',
        sourceId: 'IN-1187',
        name: 'Pooja Mehta',
        email: 'pooja.mehta@example.com',
        mobile: '+91-90210-11223',
        value: 300000,
      },
    ],
    matchCriteria: [
      { field: 'PAN Number', type: 'Exact', score: 100, passed: true },
      { field: 'Mobile Number', type: 'Exact', score: 100, passed: true },
      { field: 'Full Name', type: 'Exact', score: 100, passed: true },
      { field: 'Email Domain', type: 'Exact', score: 88, passed: true },
    ],
  },
  {
    goldenId: 'GC-1003',
    fullName: 'Rohan Verma / Rahul Verma',
    city: 'Delhi NCR',
    segment: 'Retail',
    status: 'MANUAL_REVIEW',
    totalRelationshipValue: 420000,
    pan: 'CVERM9012L',
    mobile: '+91-98111-22233',
    matchConfidence: 62,
    hasConflict: true,
    conflictField: 'Name mismatch on identical mobile (Rohan Verma vs Rahul Verma)',
    sourceRecords: [
      {
        sourceSystem: 'LOANS',
        sourceId: 'LN-201',
        name: 'Rohan Verma',
        email: 'verma.fam@gmail.com',
        mobile: '9811122233',
        value: 300000,
      },
      {
        sourceSystem: 'INSURANCE',
        sourceId: 'IN-554',
        name: 'Rahul Verma',
        email: 'verma.fam@gmail.com',
        mobile: '9811122233',
        value: 120000,
      },
    ],
    matchCriteria: [
      { field: 'PAN Number', type: 'Not on file', score: 0, passed: false },
      { field: 'Mobile Number', type: 'Exact', score: 100, passed: true },
      { field: 'Full Name', type: 'Fuzzy', score: 48, passed: false },
      { field: 'Email Domain', type: 'Exact', score: 100, passed: true },
    ],
  },
];

export const initialOpportunities = [
  {
    id: 'OPP-1',
    goldenId: 'GC-1001',
    customerName: 'Aditya Sharma',
    targetProduct: 'Term Life Insurance (₹1.5 Cr Cover)',
    triggerReason: 'Customer holds ₹24.5L in Equities & Mutual Funds with zero active insurance policies.',
    score: 94,
    potentialValue: 125000,
    status: 'PENDING',
  },
  {
    id: 'OPP-2',
    goldenId: 'GC-1002',
    customerName: 'Pooja Mehta',
    targetProduct: 'Multi-Cap Equity Portfolio Migration',
    triggerReason: 'Customer holds ₹8.5L in low-yield wealth/insurance; eligible for equity investments.',
    score: 82,
    potentialValue: 75000,
    status: 'PENDING',
  },
];

export const initialRuleConfig = {
  autoMergeThreshold: 85,
  manualReviewThreshold: 60,
};
