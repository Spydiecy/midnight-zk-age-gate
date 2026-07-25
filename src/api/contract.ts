/**
 * contract.ts — browser-side contract interaction for age-gate.
 * Static import so Vite bundles and resolves all bare specifiers.
 */

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { type Observable, map } from 'rxjs';
import type { AgeGateProviders } from './providers';

// Static import — Vite processes this file and rewrites bare imports to URLs
import * as AgeGate from '../contract/age-gate.js';

export interface AgeGateState {
  access_granted: boolean;
  verifications: bigint;
}

export interface DeployedAgeGate {
  readonly address: string;
  readonly state$: Observable<AgeGateState>;
  verifyAge: (birthYear: number) => Promise<void>;
  revokeAccess: () => Promise<void>;
}

const PRIVATE_STATE_KEY = 'age-gate-private';

export async function joinAgeGate(
  providers: AgeGateProviders,
  address: string,
): Promise<DeployedAgeGate> {
  const compiled = CompiledContract.make('age-gate', AgeGate.Contract as any).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(`${window.location.origin}/managed/age-gate`),
  );

  const found = await findDeployedContract(providers as any, {
    contractAddress: address as any,
    compiledContract: compiled as any,
    privateStateId: PRIVATE_STATE_KEY,
    initialPrivateState: {},
  });

  const state$: Observable<AgeGateState> = providers.publicDataProvider
    .contractStateObservable(address as any, { type: 'latest' })
    .pipe(
      map((contractState: any) => {
        try {
          const l = AgeGate.ledger(contractState.data ?? contractState);
          return {
            access_granted: Boolean(l.access_granted),
            verifications: BigInt(l.verifications ?? 0),
          };
        } catch {
          return { access_granted: false, verifications: 0n };
        }
      }),
    );

  return {
    address,
    state$,
    async verifyAge(birthYear: number): Promise<void> {
      await (found as any).callTx.verify_age(BigInt(birthYear));
    },
    async revokeAccess(): Promise<void> {
      await (found as any).callTx.revoke_access();
    },
  };
}
