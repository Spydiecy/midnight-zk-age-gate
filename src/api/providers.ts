/**
 * providers.ts
 * Wires Lace wallet → ZK config → proof provider → indexer → midnight provider.
 * Follows the official example-bboard pattern exactly.
 */

import { type ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  filter,
  firstValueFrom,
  interval,
  map,
  take,
  timeout,
  throwError,
  concatMap,
} from 'rxjs';
import semver from 'semver';

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

// Circuit key names that match our compiled managed/age-gate output
export type AgeGateCircuitKeys = 'verify_age' | 'revoke_access';

export interface AgeGateProviders {
  privateStateProvider: any;
  zkConfigProvider: any;
  proofProvider: any;
  publicDataProvider: any;
  walletProvider: any;
  midnightProvider: any;
}

function getFirstCompatibleWallet(): InitialAPI | undefined {
  if (typeof window === 'undefined' || !window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies((wallet as InitialAPI).apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
}

export async function connectToWallet(networkId: string): Promise<ConnectedAPI> {
  return firstValueFrom(
    interval(100).pipe(
      map(() => getFirstCompatibleWallet()),
      filter((w): w is InitialAPI => !!w),
      take(1),
      timeout({
        first: 3_000,
        with: () => throwError(() => new Error('Midnight Lace wallet not found. Is the extension installed and enabled?')),
      }),
      concatMap(async (initialAPI) => {
        const api = await initialAPI.connect(networkId);
        return api;
      }),
      timeout({
        first: 10_000,
        with: () => throwError(() => new Error('Lace wallet did not respond. Is it unlocked?')),
      }),
    ),
  );
}

export async function initializeProviders(connectedAPI: ConnectedAPI): Promise<AgeGateProviders> {
  const config = await connectedAPI.getConfiguration();
  const zkConfigPath = window.location.origin;

  const zkConfigProvider = new FetchZkConfigProvider<AgeGateCircuitKeys>(
    zkConfigPath,
    fetch.bind(window),
  );

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  // In-memory private state (age gate has no persistent private state)
  const privateStateMap = new Map<string, any>();
  const privateStateProvider = {
    get: async (key: string) => privateStateMap.get(key) ?? {},
    set: async (key: string, value: any) => { privateStateMap.set(key, value); },
    remove: async (key: string) => { privateStateMap.delete(key); },
  };

  return {
    privateStateProvider,
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proverServerUri!, zkConfigProvider, { timeout: 1800000 }),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      async balanceTx(tx: UnboundTransaction, _ttl?: Date): Promise<FinalizedTransaction> {
        const serializedTx = toHex(tx.serialize());
        const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature', 'proof', 'binding', fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
}
