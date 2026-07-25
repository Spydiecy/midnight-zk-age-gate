/**
 * MidnightContext.tsx
 * Provides wallet connection state and age-gate contract interaction
 * to the entire React tree.
 */

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { connectToWallet, initializeProviders, type AgeGateProviders } from '../api/providers';
import { joinAgeGate, type DeployedAgeGate, type AgeGateState } from '../api/contract';

// Contract address deployed on Preprod — injected at build time
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;
const NETWORK_ID = import.meta.env.VITE_NETWORK_ID as string || 'preprod';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type TxStatus = 'idle' | 'proving' | 'submitting' | 'confirmed' | 'failed' | 'denied';

export interface MidnightContextValue {
  // Wallet
  walletStatus: WalletStatus;
  walletAddress: string | null;
  walletError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;

  // Contract state
  contractState: AgeGateState | null;
  refreshState: () => Promise<void>;

  // Circuit call
  txStatus: TxStatus;
  txError: string | null;
  verifyAge: (birthYear: number) => Promise<void>;
  revokeAccess: () => Promise<void>;
}

const MidnightContext = createContext<MidnightContextValue | null>(null);

export function MidnightProvider({ children }: { children: ReactNode }) {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('disconnected');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [contractState, setContractState] = useState<AgeGateState | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  const connectedAPIRef = useRef<ConnectedAPI | null>(null);
  const providersRef = useRef<AgeGateProviders | null>(null);
  const deployedRef = useRef<DeployedAgeGate | null>(null);

  const refreshState = useCallback(async () => {
    if (!deployedRef.current) return;
    try {
      const s = await deployedRef.current.getState();
      setContractState(s);
    } catch {
      // non-fatal
    }
  }, []);

  const connect = useCallback(async () => {
    setWalletStatus('connecting');
    setWalletError(null);
    try {
      const api = await connectToWallet(NETWORK_ID);
      connectedAPIRef.current = api;

      const providers = await initializeProviders(api);
      providersRef.current = providers;

      // Get wallet address for display
      const { unshieldedAddress } = await api.getUnshieldedAddress();
      setWalletAddress(unshieldedAddress);

      // Join the deployed contract
      if (CONTRACT_ADDRESS) {
        const deployed = await joinAgeGate(providers, CONTRACT_ADDRESS as any);
        deployedRef.current = deployed;
        await refreshState();
      }

      setWalletStatus('connected');
    } catch (err: any) {
      setWalletStatus('error');
      setWalletError(err?.message ?? 'Failed to connect wallet');
    }
  }, [refreshState]);

  const disconnect = useCallback(() => {
    connectedAPIRef.current = null;
    providersRef.current = null;
    deployedRef.current = null;
    setWalletStatus('disconnected');
    setWalletAddress(null);
    setWalletError(null);
    setContractState(null);
    setTxStatus('idle');
    setTxError(null);
  }, []);

  const verifyAge = useCallback(async (birthYear: number) => {
    if (!deployedRef.current) return;
    setTxStatus('proving');
    setTxError(null);
    try {
      setTxStatus('proving');
      await deployedRef.current.verifyAge(birthYear);
      setTxStatus('confirmed');
      await refreshState();
    } catch (err: any) {
      setTxStatus('failed');
      const msg = err?.message ?? String(err);
      // User-friendly messages for common failures
      if (msg.includes('assert') || msg.includes('18')) {
        setTxError('Age verification failed — you must be 18 or older.');
      } else if (msg.includes('rejected') || msg.includes('Rejected')) {
        setTxError('Transaction rejected by wallet.');
      } else {
        setTxError(msg);
      }
    }
  }, [refreshState]);

  const revokeAccess = useCallback(async () => {
    if (!deployedRef.current) return;
    setTxStatus('submitting');
    setTxError(null);
    try {
      await deployedRef.current.revokeAccess();
      setTxStatus('confirmed');
      await refreshState();
    } catch (err: any) {
      setTxStatus('failed');
      setTxError(err?.message ?? 'Revoke failed');
    }
  }, [refreshState]);

  return (
    <MidnightContext.Provider value={{
      walletStatus, walletAddress, walletError, connect, disconnect,
      contractState, refreshState,
      txStatus, txError, verifyAge, revokeAccess,
    }}>
      {children}
    </MidnightContext.Provider>
  );
}

export function useMidnight(): MidnightContextValue {
  const ctx = useContext(MidnightContext);
  if (!ctx) throw new Error('useMidnight must be used inside <MidnightProvider>');
  return ctx;
}
