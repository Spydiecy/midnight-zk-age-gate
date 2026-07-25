/**
 * WalletConnect.tsx
 * Handles Lace wallet connect / disconnect with clear status display.
 */

import React from 'react';
import { useMidnight } from '../contexts/MidnightContext';

export function WalletConnect() {
  const { walletStatus, walletAddress, walletError, connect, disconnect } = useMidnight();

  const short = walletAddress
    ? `${walletAddress.slice(0, 18)}…${walletAddress.slice(-6)}`
    : null;

  return (
    <div className="wallet-connect">
      {walletStatus === 'disconnected' && (
        <button className="btn btn-primary" onClick={connect}>
          🔗 Connect Lace Wallet
        </button>
      )}

      {walletStatus === 'connecting' && (
        <button className="btn btn-loading" disabled>
          <span className="spinner" /> Connecting…
        </button>
      )}

      {walletStatus === 'connected' && (
        <div className="wallet-connected">
          <div className="wallet-badge">
            <span className="dot green" />
            <span className="wallet-addr" title={walletAddress ?? ''}>
              {short}
            </span>
          </div>
          <button className="btn btn-ghost" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}

      {walletStatus === 'error' && (
        <div className="wallet-error-row">
          <div className="alert alert-error">{walletError}</div>
          <button className="btn btn-primary" onClick={connect}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
