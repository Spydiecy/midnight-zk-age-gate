import React, { useState } from 'react';
import { useMidnight } from '../contexts/useMidnight.tsx';

const CURRENT_YEAR = 2026;
const MAX_BIRTH_YEAR = CURRENT_YEAR - 18; // 2008

export function AgeGate() {
  const { walletStatus, contractState, contractError, txStatus, txError, verifyAge, revokeAccess } = useMidnight();
  const [birthYear, setBirthYear] = useState('');

  const isConnected = walletStatus === 'connected';
  const isBusy = txStatus === 'proving' || txStatus === 'submitting';

  const year = parseInt(birthYear, 10);
  const age = !isNaN(year) ? CURRENT_YEAR - year : null;
  const isValidYear = birthYear.length === 4 && !isNaN(year) && year >= 1900 && year <= CURRENT_YEAR;
  const isEligible = isValidYear && year <= MAX_BIRTH_YEAR;

  function getHint() {
    if (!birthYear || birthYear.length < 4) return '';
    if (!isValidYear) return 'Enter a valid year';
    if (!isEligible) return `${age} years old — must be 18+`;
    return `${age} years old — eligible`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || isBusy || !isEligible) return;
    const y = year;
    setBirthYear('');
    await verifyAge(y);
  }

  const hint = getHint();
  const hintClass = hint.includes('eligible') ? 'ok' : hint.includes('must') ? 'bad' : '';

  return (
    <>
      {/* State + form grid */}
      <div className="grid">

        {/* On-chain state */}
        <div className="card">
          <p className="card-title">On-Chain State</p>

          <div className="state-row">
            <span className="state-label">Access Status</span>
            {contractState === null ? (
              <span className="badge badge-dim">—</span>
            ) : contractState.access_granted ? (
              <span className="badge badge-green">✓ Granted</span>
            ) : (
              <span className="badge badge-red">✗ Denied</span>
            )}
          </div>

          <div className="state-row">
            <span className="state-label">Verifications</span>
            <span className="state-value">
              {contractState?.verifications?.toString() ?? '—'}
            </span>
          </div>

          <div className="privacy-note">
            🔒 On-chain observers see only the status above.
            Your birth year is never recorded anywhere.
          </div>

          {isConnected && contractState?.access_granted && (
            <button
              className="btn btn-danger btn-sm"
              style={{ marginTop: 14, width: '100%' }}
              onClick={revokeAccess}
              disabled={isBusy}
            >
              Reset Access
            </button>
          )}
        </div>

        {/* Prove form */}
        <div className="gate-card">
          <h3>Prove Your Age</h3>
          <p className="sub">Your birth year never leaves this device.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="year">Birth Year</label>
              <input
                id="year"
                className="form-input"
                type="number"
                min={1900}
                max={CURRENT_YEAR}
                placeholder="e.g. 1995"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                disabled={!isConnected || isBusy}
                autoComplete="off"
              />
              <span className={`form-hint ${hintClass}`}>{hint || ' '}</span>
            </div>

            <div className="zk-disclaimer">
              <span className="zk-icon">⚡</span>
              <span>
                <strong style={{ color: '#fff', fontWeight: 600 }}>Proved without revealing</strong>
                {' '}— your birth year is used only to generate a ZK proof locally. It is never transmitted or stored.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={!isConnected || isBusy || !isEligible}
            >
              {txStatus === 'proving' ? (
                <><span className="spin" /> Generating ZK Proof…</>
              ) : txStatus === 'submitting' ? (
                <><span className="spin" /> Submitting…</>
              ) : (
                '→ Verify Age'
              )}
            </button>
          </form>

          {txStatus === 'confirmed' && (
            <div className="result result-success">
              <span className="result-icon">✅</span>
              <div className="result-body">
                <strong>Access Granted</strong>
                <p>Proof verified on-chain. Birth year never revealed.</p>
              </div>
            </div>
          )}

          {txStatus === 'failed' && txError && (
            <div className="result result-fail">
              <span className="result-icon">✗</span>
              <div className="result-body">
                <strong>Failed</strong>
                <p>{txError}</p>
              </div>
            </div>
          )}

          {!isConnected && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
              Connect your Lace wallet to continue
            </p>
          )}

          {isConnected && contractError && (
            <div className="result result-fail" style={{ marginTop: 16 }}>
              <span className="result-icon">⚠</span>
              <div className="result-body">
                <strong>Contract Error</strong>
                <p>{contractError}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
