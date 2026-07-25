import React, {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { Subscription } from 'rxjs';
import { connectToWallet, initializeProviders, type AgeGateProviders } from '../api/providers';
import { joinAgeGate, type DeployedAgeGate, type AgeGateState } from '../api/contract';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;
const NETWORK_ID = (import.meta.env.VITE_NETWORK_ID as string) || 'preprod';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type TxStatus = 'idle' | 'proving' | 'confirmed' | 'failed';

export interface MidnightContextValue {
  walletStatus: WalletStatus;
  walletAddress: string | null;
  walletError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  contractState: AgeGateState | null;
  contractError: string | null;
  txStatus: TxStatus;
  txError: string | null;
  verifyAge: (birthYear: number) => Promise<void>;
  revokeAccess: () => Promise<void>;
}

export const MidnightContext = createContext<MidnightContextValue | null>(null);

export function MidnightProvider({ children }: { children: ReactNode }) {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('disconnected');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [contractState, setContractState] = useState<AgeGateState | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  const connectedAPIRef = useRef<ConnectedAPI | null>(null);
  const providersRef = useRef<AgeGateProviders | null>(null);
  const deployedRef = useRef<DeployedAgeGate | null>(null);
  const stateSubRef = useRef<Subscription | null>(null);

  useEffect(() => () => { stateSubRef.current?.unsubscribe(); }, []);

  const connect = useCallback(async () => {
    setWalletStatus('connecting');
    setWalletError(null);
    try {
      const api = await connectToWallet(NETWORK_ID);
      connectedAPIRef.current = api;
      const providers = await initializeProviders(api);
      providersRef.current = providers;
      const { unshieldedAddress } = await api.getUnshieldedAddress();
      setWalletAddress(unshieldedAddress);

      if (CONTRACT_ADDRESS) {
        try {
          const deployed = await joinAgeGate(providers, CONTRACT_ADDRESS);
          deployedRef.current = deployed;
          stateSubRef.current?.unsubscribe();
          stateSubRef.current = deployed.state$.subscribe({
            next: (s) => setContractState(s),
            error: (e) => console.error('State stream error:', e),
          });
        } catch (e: any) {
          setContractError(e?.message ?? String(e));
        }
      }
      setWalletStatus('connected');
    } catch (e: any) {
      setWalletStatus('error');
      setWalletError(e?.message ?? 'Failed to connect wallet');
    }
  }, []);

  const disconnect = useCallback(() => {
    stateSubRef.current?.unsubscribe();
    stateSubRef.current = null;
    connectedAPIRef.current = null;
    providersRef.current = null;
    deployedRef.current = null;
    setWalletStatus('disconnected');
    setWalletAddress(null);
    setWalletError(null);
    setContractState(null);
    setContractError(null);
    setTxStatus('idle');
    setTxError(null);
  }, []);

  const verifyAge = useCallback(async (birthYear: number) => {
    if (!deployedRef.current) {
      setTxStatus('failed');
      setTxError('Contract not loaded — disconnect and reconnect your wallet.');
      return;
    }
    setTxStatus('proving');
    setTxError(null);
    try {
      await deployedRef.current.verifyAge(birthYear);
      setTxStatus('confirmed');
    } catch (err: any) {
      setTxStatus('failed');
      let root: any = err;
      while (root?.cause) root = root.cause;
      while (root?.failure) root = root.failure;
      const msg: string = root?.message ?? err?.message ?? String(err);
      if (msg.includes('dust') || msg.includes('Dust') || msg.includes('DUST')) {
        setTxError('No DUST tokens — open Lace → Tokens → Generate tDUST, then retry.');
      } else if (msg.includes('assert') || msg.includes('18') || msg.includes('positive')) {
        setTxError('Age verification failed — you must be born in 2008 or earlier.');
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setTxError('Transaction cancelled.');
      } else {
        setTxError(msg.length > 150 ? msg.slice(0, 150) + '…' : msg);
      }
    }
  }, []);

  const revokeAccess = useCallback(async () => {
    if (!deployedRef.current) return;
    setTxStatus('proving');
    setTxError(null);
    try {
      await deployedRef.current.revokeAccess();
      setTxStatus('confirmed');
    } catch (e: any) {
      setTxStatus('failed');
      setTxError(e?.message ?? 'Revoke failed');
    }
  }, []);

  return (
    <MidnightContext.Provider value={{
      walletStatus, walletAddress, walletError, connect, disconnect,
      contractState, contractError, txStatus, txError, verifyAge, revokeAccess,
    }}>
      {children}
    </MidnightContext.Provider>
  );
}
