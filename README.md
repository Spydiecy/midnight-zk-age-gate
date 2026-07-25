# ZK Age Gate

> Prove you're 18+ without ever revealing your age. A zero-knowledge DApp on Midnight Network.

## Live Demo

[PASTE LIVE URL AFTER DEPLOYING FRONTEND]

## Contract Address

| Network  | Address                                                            |
|----------|--------------------------------------------------------------------|
| Preprod  | `8c23f1893c64a9a323981c9c213534f8e4539f339ab69c3c0c7ac8b46ee1f037`    |
| Preview  | `4999fb143b4a66fbde948f625f2700470cd006169a3bf93e6dc4a693df09035b` |

## What This Does

ZK Age Gate lets a user prove they are at least 18 years old **without disclosing their actual birth year**. The user enters their birth year locally in the browser. Lace wallet generates a zero-knowledge proof that `2026 − birth_year ≥ 18`. That proof is verified on-chain. The blockchain records only `access_granted: true` — the birth year never appears anywhere outside the user's machine.

## Privacy Model

- **PUBLIC (on-chain, visible to anyone):**
  - `access_granted` — Boolean: whether the last verification passed
  - `verifications` — Counter: total number of successful verifications

- **PRIVATE (circuit input, never on-chain or transmitted):**
  - `birth_year` — the user's actual birth year; consumed inside the ZK proof locally and never stored, logged, or sent anywhere

- **What the user PROVES without revealing:**
  - That `2026 − birth_year ≥ 18` (they are old enough)
  - That `1900 ≤ birth_year ≤ 2026` (it's a valid year)
  - The actual birth year is mathematically proven but never disclosed

## Privacy Claim

An on-chain observer inspecting the transaction or ledger state sees:
- `access_granted = true`
- `verifications = N`

They **cannot** determine the user's birth year, age, or any other personal information. The ZK proof guarantees correctness without revealing the witness.

## Tech Stack

- [Midnight Network](https://midnight.network) — privacy-preserving blockchain
- [Compact](https://docs.midnight.network/compact/reference) — ZK smart contract language
- [Midnight.js SDK](https://docs.midnight.network/sdks/official/midnight-js) — contract interaction
- [DApp Connector API](https://docs.midnight.network/api-reference/dapp-connector) — Lace wallet integration
- React 19 + Vite 6
- Lace Wallet (browser extension)
- Node.js v22+, Docker

## Prerequisites

- [Lace wallet](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) installed and configured for **Preprod**
- Lace proof server set to `http://localhost:6300` in Lace settings
- Docker Desktop running (for local proof server)
- Node.js v22+

## Run Locally

```bash
# Clone
git clone <your-repo-url>
cd my-project

# Install
npm install --legacy-peer-deps

# Start proof server (required)
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0

# Add contract address to env
echo "VITE_CONTRACT_ADDRESS=<preprod-address>" > .env.local
echo "VITE_NETWORK_ID=preprod" >> .env.local

# Compile the contract (already done — managed/ is in repo)
# npm run compile

# Start dev server
npm run dev
```

Open http://localhost:5173, connect Lace, enter your birth year.

## Run Tests

```bash
npm run test:run
```

10 tests covering circuit logic, state transitions, and privacy model.

## Compile Contract

```bash
npm run compile
```

Outputs to `managed/age-gate/` — circuits, ZK keys, TypeScript bindings.

## Deploy Contract

```bash
# Deploy to Preprod
NODE_OPTIONS="--max-old-space-size=12288" npm run deploy:preprod
```

When prompted, fund the wallet at: https://midnight-tmnight-preprod.nethermind.dev

## Build & Deploy Frontend

```bash
# Build (copies ZK keys to dist/)
npm run build

# Deploy to Vercel
npx vercel --prod
```

## Demo Video

[PLACEHOLDER — add link after recording]

## Initial Idea

Privacy-preserving age verification is one of the most practical real-world use cases for zero-knowledge proofs. Every age-gated service today forces users to submit full documents or exact dates — far more information than necessary. ZK Age Gate demonstrates that you only need to prove a threshold: "I am old enough." Nothing more. The birth year is used once, locally, to generate a proof, then discarded. The chain only ever learns the outcome.

## Screenshots

[Add compile output screenshot]
[Add deployed contract address screenshot]
[Add frontend UI screenshot with wallet connected]
