export const initialRuleConfig = {
  panWeight: 50,
  mobileWeight: 25,
  emailWeight: 15,
  nameWeight: 10,
  autoMergeThreshold: 85,
  manualReviewThreshold: 60,
  minTrvForOpp: 1000000,
};

export const initialCustomers = [
  // Scenario 1 & 4: Exact PAN match across Equity & MF, conflicting email, TRV > ₹10L without Insurance
  {
    goldenId: 'GC-1001',
    fullName: 'Aditya Sharma',
    pan: 'ABCPS1234F',
    mobile: '9876543210',
    email: 'aditya.sharma@example.com',
    city: 'Mumbai',
    segment: 'HNI',
    totalRelationshipValue: 2450000,
    matchConfidence: 94,
    status: 'AUTO_MERGED',
    hasConflict: true,
    conflictField: 'Email differs across Equity (aditya.sharma@example.com) and MF (aditya.s@work.com)',
    sourceRecords: [
      { sourceSystem: 'EQUITY', sourceId: 'EQ-8821', pan: 'ABCPS1234F', mobile: '9876543210', email: 'aditya.sharma@example.com', name: 'Aditya Sharma', value: 1500000 },
      { sourceSystem: 'MUTUAL_FUNDS', sourceId: 'MF-4402', pan: 'ABCPS1234F', mobile: '9876543210', email: 'aditya.s@work.com', name: 'Aditya Sharma', value: 950000 },
    ],
    matchCriteria: [
      { field: 'PAN', type: 'EXACT', score: 100, weight: 50, passed: true },
      { field: 'Mobile', type: 'EXACT', score: 100, weight: 25, passed: true },
      { field: 'Name', type: 'EXACT', score: 100, weight: 10, passed: true },
      { field: 'Email', type: 'FUZZY', score: 40, weight: 15, passed: false },
    ],
  },
  // Scenario 2: Probabilistic match (PAN missing, strong Mobile + Email + Name match)
  {
    goldenId: 'GC-1002',
    fullName: 'Pooja Mehta',
    pan: '',
    mobile: '9820011223',
    email: 'pooja.mehta@gmail.com',
    city: 'Bengaluru',
    segment: 'AFFLUENT',
    totalRelationshipValue: 850000,
    matchConfidence: 88,
    status: 'AUTO_MERGED',
    hasConflict: false,
    conflictField: '',
    sourceRecords: [
      { sourceSystem: 'WEALTH', sourceId: 'WL-301', pan: '', mobile: '9820011223', email: 'pooja.mehta@gmail.com', name: 'Pooja Mehta', value: 500000 },
      { sourceSystem: 'INSURANCE', sourceId: 'IN-789', pan: '', mobile: '9820011223', email: 'pooja.mehta@gmail.com', name: 'Pooja M', value: 350000 },
    ],
    matchCriteria: [
      { field: 'Mobile', type: 'EXACT', score: 100, weight: 25, passed: true },
      { field: 'Email', type: 'EXACT', score: 100, weight: 15, passed: true },
      { field: 'Name', type: 'FUZZY', score: 85, weight: 10, passed: true },
      { field: 'PAN', type: 'MISSING', score: 0, weight: 50, passed: false },
    ],
  },
  // Scenario 3: Shared mobile but conflicting names -> Routes to Manual Review Queue
  {
    goldenId: 'GC-1003',
    fullName: 'Rohan Verma / Rahul Verma',
    pan: '',
    mobile: '9811122233',
    email: 'verma.fam@gmail.com',
    city: 'Pune',
    segment: 'MASS',
    totalRelationshipValue: 420000,
    matchConfidence: 62,
    status: 'MANUAL_REVIEW',
    hasConflict: true,
    conflictField: 'Name mismatch on identical mobile (Rohan Verma vs Rahul Verma)',
    sourceRecords: [
      { sourceSystem: 'LOANS', sourceId: 'LN-201', mobile: '9811122233', email: 'verma.fam@gmail.com', name: 'Rohan Verma', value: 300000 },
      { sourceSystem: 'INSURANCE', sourceId: 'IN-554', mobile: '9811122233', email: 'verma.fam@gmail.com', name: 'Rahul Verma', value: 120000 },
    ],
    matchCriteria: [
      { field: 'Mobile', type: 'EXACT', score: 100, weight: 25, passed: true },
      { field: 'Email', type: 'EXACT', score: 100, weight: 15, passed: true },
      { field: 'Name', type: 'FUZZY', score: 30, weight: 10, passed: false },
    ],
  },
];

export const initialOpportunities = [
  {
    id: 'OPP-101',
    goldenId: 'GC-1001',
    customerName: 'Aditya Sharma',
    targetProduct: 'Term Life Insurance (₹1.5 Cr Cover)',
    score: 94,
    potentialValue: 125000,
    triggerReason: 'Customer holds ₹24.5L in Equities & Mutual Funds with zero active insurance policies.',
    status: 'OPEN',
  },
  {
    id: 'OPP-102',
    goldenId: 'GC-1002',
    customerName: 'Pooja Mehta',
    targetProduct: 'Multi-Cap Equity Portfolio Migration',
    score: 82,
    potentialValue: 75000,
    triggerReason: 'Customer holds ₹8.5L in low-yield wealth/insurance; eligible for equity investments.',
    status: 'OPEN',
  },
];