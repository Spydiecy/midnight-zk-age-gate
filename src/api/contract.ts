/**
 * contract.ts
 * Wraps deployContract / joinContract and circuit calls for the age-gate contract.
 */

import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type { AgeGateProviders } from './providers';

// Dynamically import the compiled contract — loaded at runtime from managed/
let _Contract: any = null;
async function getContractClass() {
  if (_Contract) return _Contract;
  // The compiled JS is served as a static asset from /managed/age-gate/contract/
  const mod = await import(/* @vite-ignore */ '/managed/age-gate/contract/index.js');
  _Contract = mod.Contract;
  return _Contract;
}

export interface AgeGateState {
  access_granted: boolean;
  verifications: bigint;
}

export interface DeployedAgeGate {
  address: ContractAddress;
  getState: () => Promise<AgeGateState>;
  verifyAge: (birthYear: number) => Promise<void>;
  revokeAccess: () => Promise<void>;
}

const PRIVATE_STATE_KEY = 'age-gate-private';

export async function deployAgeGate(providers: AgeGateProviders): Promise<DeployedAgeGate> {
  const ContractClass = await getContractClass();

  const compiled = CompiledContract.make('age-gate', ContractClass).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets('/managed/age-gate'),
  );

  const deployed = await deployContract(providers, {
    compiledContract: compiled,
    args: [],
    privateStateId: PRIVATE_STATE_KEY,
    initialPrivateState: {},
  });

  return wrapDeployed(deployed, providers);
}

export async function joinAgeGate(providers: AgeGateProviders, address: ContractAddress): Promise<DeployedAgeGate> {
  const ContractClass = await getContractClass();

  const compiled = CompiledContract.make('age-gate', ContractClass).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets('/managed/age-gate'),
  );

  const joined = await findDeployedContract(providers, {
    contractAddress: address,
    compiledContract: compiled,
    privateStateId: PRIVATE_STATE_KEY,
    initialPrivateState: {},
  });

  return wrapDeployed(joined, providers);
}

function wrapDeployed(deployed: any, providers: AgeGateProviders): DeployedAgeGate {
  return {
    address: deployed.deployTxData?.public?.contractAddress ?? deployed.contractAddress,

    async getState(): Promise<AgeGateState> {
      // Read from the public data provider / indexer
      const { ledger } = await import(/* @vite-ignore */ '/managed/age-gate/contract/index.js');
      const state = await providers.publicDataProvider.queryContractState(
        deployed.deployTxData?.public?.contractAddress ?? deployed.contractAddress,
      );
      const l = ledger(state);
      return {
        access_granted: l.access_granted as boolean,
        verifications: l.verifications as bigint,
      };
    },

    async verifyAge(birthYear: number): Promise<void> {
      await deployed.callTx.verify_age(BigInt(birthYear));
    },

    async revokeAccess(): Promise<void> {
      await deployed.callTx.revoke_access();
    },
  };
}
