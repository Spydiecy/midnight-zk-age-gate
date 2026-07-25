/**
 * AgeGate.tsx
 * The main circuit-call UI.
 * - Takes birth year as a LOCAL input — never sent anywhere
 * - Calls verify_age(birthYear) which generates a ZK proof
 * - The birth year NEVER appears on-chain or in the UI after submission
 * - Only the result (access granted / denied) is shown
 */

import React, { useState } from 'react';
import { useMidnight } from '../contexts/MidnightContext';

const CURRENT_YEAR = 2026;

export function AgeGate() {
  const { walletStatus, contractState, txStatus, txError, verifyAge, revokeAccess } = useMidnight();
  const [birthYear, setBirthYear] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isConnected = walletStatus === 'connected';
  const isProving = txStatus === 'proving';
  const isSubmitting = txStatus === 'submitting';
  const isBusy = isProving || isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1900 || year > CURRENT_YEAR) return;
    setSubmitted(true);
    // NOTE: birthYear is passed as a circuit input — it enters the ZK proof
    // and is NEVER stored, logged, or transmitted anywhere else.
    verifyAge(year).finally(() => {
      // Clear the input immediately after submission — birth year gone from UI
      setBirthYear('');
    });
  }

  const age = birthYear ? CURRENT_YEAR - parseInt(birthYear, 10) : null;
  const yearValid = birthYear.length === 4 && age !== null && age >= 0 && age <= 126;

  return (
    <div className="age-gate-card">
      {/* Live on-chain state */}
      <div className="state-panel">
        <h3>On-Chain State</h3>
        <div className="state-row">
          <span className="label">Access Status</span>
          <span className={`badge ${contractState?.access_granted ? 'badge-green' : 'badge-red'}`}>
            {contractState === null
              ? '—'
              : contractState.access_granted
              ? '✅ GRANTED'
              : '🔒 DENIED'}
          </span>
        </div>
        <div className="state-row">
          <span className="label">Total Verifications</span>
          <span className="value">{contractState?.verifications?.toString() ?? '—'}</span>
        </div>
        <p className="privacy-note">
          ⚡ <em>On-chain observers see only the status above — never a birth year.</em>
        </p>
      </div>

      {/* Circuit call form */}
      <div className="circuit-panel">
        <h3>Prove Your Age</h3>
        <p className="sub">Enter your birth year. It never leaves your device.</p>

        <form onSubmit={handleSubmit} className="age-form">
          <div className="input-group">
            <label htmlFor="birthYear">Birth Year</label>
            <input
              id="birthYear"
              type="number"
              min={1900}
              max={CURRENT_YEAR}
              placeholder="e.g. 1995"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              disabled={!isConnected || isBusy}
              className="input-year"
            />
            {birthYear.length === 4 && age !== null && (
              <span className="age-hint">
                {yearValid
                  ? age >= 18
                    ? `${age} years old — eligible`
                    : `${age} years old — too young`
                  : 'Invalid year'}
              </span>
            )}
          </div>

          <div className="proof-disclaimer">
            🔐 <strong>Proved without revealing</strong> — your birth year is used only to
            generate a zero-knowledge proof locally. It is never stored, transmitted, or
            visible on-chain.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={!isConnected || isBusy || !yearValid}
          >
            {isProving ? (
              <><span className="spinner" /> Generating ZK Proof…</>
            ) : isSubmitting ? (
              <><span className="spinner" /> Submitting…</>
            ) : (
              '🔓 Verify Age (ZK Proof)'
            )}
          </button>
        </form>

        {/* Result display */}
        {txStatus === 'confirmed' && submitted && (
          <div className="result result-success">
            <div className="result-icon">✅</div>
            <div className="result-text">
              <strong>Access Granted</strong>
              <p>Proof verified on-chain. Your birth year was never revealed.</p>
            </div>
          </div>
        )}

        {txStatus === 'failed' && (
          <div className="result result-fail">
            <div className="result-icon">❌</div>
            <div className="result-text">
              <strong>Verification Failed</strong>
              <p>{txError}</p>
            </div>
          </div>
        )}

        {isConnected && contractState?.access_granted && (
          <button
            className="btn btn-ghost btn-small"
            onClick={() => revokeAccess()}
            disabled={isBusy}
          >
            Reset Access Status
          </button>
        )}
      </div>

      {!isConnected && (
        <div className="overlay-message">
          Connect your Lace wallet to verify age
        </div>
      )}
    </div>
  );
}
