import React from 'react';
import { SiloSimulator } from '../components/SiloSimulator.jsx';

export function SiloSimulatorPage({ rules, onCommitNewCustomer }) {
  return (
    <SiloSimulator
      rules={rules}
      onCommitNewCustomer={onCommitNewCustomer}
    />
  );
}
