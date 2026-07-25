import React from 'react';
import { MidnightProvider } from './contexts/MidnightContext';
import { WalletConnect } from './components/WalletConnect';
import { AgeGate } from './components/AgeGate';
import './styles.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const short = CONTRACT_ADDRESS
  ? `${CONTRACT_ADDRESS.slice(0, 8)}…${CONTRACT_ADDRESS.slice(-8)}`
  : null;

export default function App() {
  return (
    <MidnightProvider>
      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-mark">🌙</div>
              <div className="logo-text">
                <h1>ZK Age Gate</h1>
                <p>Midnight Network</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </header>

        {/* Main content */}
        <main className="main">

          {/* Hero */}
          <div className="hero">
            <div className="hero-chip">Preprod · Zero-Knowledge</div>
            <h2>Prove You're 18+<br />Without Revealing Your Age</h2>
            <p>
              A ZK proof is generated locally and verified on-chain.
              Your birth year is never stored, transmitted, or visible to anyone.
            </p>
            {short && (
              <div className="contract-pill">
                <span>Contract</span>
                <code>{short}</code>
              </div>
            )}
          </div>

          {/* Age gate */}
          <AgeGate />

          {/* How it works */}
          <div className="how-card">
            <p className="card-title" style={{ marginBottom: 24 }}>How It Works</p>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <strong>Enter birth year</strong>
                <p>Stays on your device — never sent anywhere</p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <strong>ZK proof generated</strong>
                <p>Lace proves 2026 − year ≥ 18 locally in browser</p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <strong>Verified on-chain</strong>
                <p>Chain records "GRANTED" — not your birth year</p>
              </div>
            </div>
          </div>

        </main>

        <footer className="footer">
          Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noreferrer">Midnight Network</a>
          {' '}· Compact · Midnight.js SDK
        </footer>
      </div>
    </MidnightProvider>
  );
}
