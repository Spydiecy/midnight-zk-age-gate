# ZK Age Gate

![CI](https://github.com/Spydiecy/midnight-zk-age-gate/actions/workflows/ci.yml/badge.svg)

> Prove you're 18+ without revealing your age. Built on Midnight Network.

## Live Demo

**https://midnight-age-gate.vercel.app**

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | `8c23f1893c64a9a323981c9c213534f8e4539f339ab69c3c0c7ac8b46ee1f037` |

## What This Does

Enter your birth year. Lace wallet generates a zero-knowledge proof locally that `2026 − birth_year ≥ 18`. The proof is verified on-chain. The blockchain records only `access_granted: true` — your birth year never leaves your device.

## Privacy Model

- **PUBLIC:** `access_granted` (bool), `verifications` (counter) — visible to anyone on-chain
- **PRIVATE:** `birth_year` — a circuit input processed locally, never stored or transmitted
- **PROVED without revealing:** that the user is at least 18 years old

## Privacy Claim

An on-chain observer sees `access_granted = true` and a verification count. They cannot determine the user's birth year, exact age, or any personal data. The ZK proof guarantees the computation was done correctly without revealing the input that produced it.

## Tech Stack

- Midnight Network (Preprod)
- Compact — ZK smart contract language
- Midnight.js SDK v4.1.1
- DApp Connector API v4.0.1
- React 19 + Vite 6
- Lace Wallet

## Prerequisites

- [Lace wallet](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) installed in Chrome/Edge
  - Network → **Preprod**
  - Proof Server → `http://localhost:6300`
- Docker Desktop running
- Node.js v22+

## Setup & Run Locally

```bash
# Clone
git clone https://github.com/Spydiecy/midnight-zk-age-gate.git
cd midnight-zk-age-gate

# Install
npm install --legacy-peer-deps

# Start proof server (required — runs locally so private data never leaves your machine)
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0

# Generate tDUST in Lace: Tokens → Generate tDUST → confirm

# Start dev server
npm run dev
# Open http://localhost:5173
```

## Run Tests

```bash
npm run test:run
```

10 tests passing — circuit logic, state transitions, privacy isolation.

## CI/CD

GitHub Actions runs on every push to `main` and on all pull requests. The pipeline:
1. Installs Node.js v22 and project dependencies
2. Installs the Compact compiler
3. Compiles both contracts (`counter.compact` and `age-gate.compact`)
4. Runs the full test suite

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Demo Video

https://www.tella.tv/video/zero-knowledge-age-verification-on-midnight-chain-91pl

## Product Proposal

See [PROPOSAL.md](./PROPOSAL.md)
