# ZK Age Gate

> Prove you're 18+ without revealing your age. Built on Midnight Network.

![CI](https://github.com/Spydiecy/midnight-zk-age-gate/actions/workflows/ci.yml/badge.svg)

## Live Demo

**https://midnight-age-gate.vercel.app**

## Demo Video

[PASTE YOUTUBE LINK AFTER RECORDING]

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | `8c23f1893c64a9a323981c9c213534f8e4539f339ab69c3c0c7ac8b46ee1f037` |

## What This Does

Enter your birth year. A zero-knowledge proof is generated locally in your browser by Lace wallet and verified on-chain. The blockchain records only `access_granted: true` — your birth year never leaves your device.

## Privacy Model

- **PUBLIC:** `access_granted` (bool), `verifications` (counter)
- **PRIVATE:** `birth_year` — circuit input, never stored or transmitted
- **Proved without revealing:** that `2026 − birth_year ≥ 18`

An on-chain observer sees `access_granted = true`. They cannot determine your birth year, age, or any personal data.

## Product Proposal

**Idea:** Age / Eligibility Gate — prove a threshold without revealing the underlying value.

Real-world applications: age-gated content platforms, DeFi protocols requiring KYC thresholds, DAO membership gates, event ticketing. Traditional verification requires exposing exact dates or documents. ZK Age Gate proves only what's necessary — eligibility — nothing more.

## Tech Stack

Midnight Network · Compact · Midnight.js SDK v4.1.1 · DApp Connector API v4.0.1 · React 19 · Vite 6 · Lace Wallet

## Prerequisites

- [Lace wallet](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) — set Network to **Preprod**, Proof Server to `http://localhost:6300`
- Docker Desktop running
- Node.js v22+

## Run Locally

```bash
git clone https://github.com/Spydiecy/midnight-zk-age-gate.git
cd midnight-zk-age-gate
npm install --legacy-peer-deps

# Start proof server
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0

# Generate tDUST in Lace: Tokens → Generate tDUST → confirm

npm run dev
# Open http://localhost:5173
```

## Run Tests

```bash
npm run test:run
```

10 tests passing — circuit logic, state transitions, privacy model.

## CI/CD

GitHub Actions runs on every push: installs dependencies, compiles both Compact contracts, and runs the full test suite. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
