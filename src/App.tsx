import React from 'react';
import { MidnightProvider } from './contexts/MidnightContext';
import { WalletConnect } from './components/WalletConnect';
import { AgeGate } from './components/AgeGate';
import './styles.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function App() {
  return (
    <MidnightProvider>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-icon">🌙</span>
              <div>
                <h1>ZK Age Gate</h1>
                <p className="tagline">Prove you're 18+ without revealing your age</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </header>

        <main className="main">
          <div className="hero">
            <div className="hero-badge">Midnight Network · Preprod</div>
            <h2>Zero-Knowledge Age Verification</h2>
            <p>
              Enter your birth year. A cryptographic proof is generated locally in your
              browser. The proof is verified on-chain — your actual birth year is never
              stored, transmitted, or visible to anyone.
            </p>
            {CONTRACT_ADDRESS && (
              <div className="contract-addr">
                Contract:{' '}
                <code>{CONTRACT_ADDRESS}</code>
              </div>
            )}
          </div>

          <AgeGate />

          <div className="explainer">
            <h3>How It Works</h3>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div>
                  <strong>You enter your birth year</strong>
                  <p>Stays on your device — never sent anywhere</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div>
                  <strong>ZK proof generated locally</strong>
                  <p>Lace wallet proves <code>2026 − birth_year ≥ 18</code></p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div>
                  <strong>Proof verified on-chain</strong>
                  <p>Chain sees "ACCESS: GRANTED" — not your birth year</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">
          Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noreferrer">
            Midnight Network
          </a>{' '}
          · Powered by Compact + Midnight.js SDK
        </footer>
      </div>
    </MidnightProvider>
  );
}
