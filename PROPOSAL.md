# Product Proposal

## What is the product, and who uses it?

ZK Age Gate is an age verification tool that lets users prove they're old enough to access something — without handing over their actual date of birth or any identity document.

The primary users are platforms that need to enforce age restrictions: adult content sites, online gaming platforms with age ratings, alcohol delivery services, regulated financial products. Right now all of these ask for your real birthdate, a government ID, or a credit card as a proxy for age. That's overkill. The only question that needs answering is "are you 18 or older?" — and ZK Age Gate answers exactly that, nothing more.

A secondary use case is DAOs and token-gated communities that want to restrict participation to adults without building any identity infrastructure. Connect your wallet, prove eligibility, get in.

## Why Midnight specifically?

The whole point of this product breaks down if the verification leaks any data. On a transparent chain, even a "yes/no" age check would require putting either the birth year or some hash of it on-chain — and hashes can be brute-forced for a 4-digit year in milliseconds.

Midnight solves this with zero-knowledge circuits. The birth year is a private witness that never leaves the user's machine. The proof is generated locally in Lace wallet, verified on-chain, and the ledger only ever records `access_granted: true`. There's nothing to leak and nothing to brute-force.

You could build a server-side version of this on any chain, but then you're trusting a server operator with the data. Midnight removes that trust requirement entirely — the math is the guarantee.

## Data Model

| Data Point        | Type            | Disclosed To |
|-------------------|-----------------|--------------|
| `access_granted`  | Public ledger   | Everyone     |
| `verifications`   | Public counter  | Everyone     |
| Birth year        | Private witness | No one       |
| Exact age         | Derived private | No one       |
| Eligibility proof | ZK proof        | Chain (verifies without reading input) |

## Mainnet Feasibility

Yes, this is realistic for Mainnet by Level 6. The core circuit is already written, compiled, and deployed on Preprod. The main things to figure out before Mainnet are:

1. **Year handling** — the current circuit hardcodes 2026 as the current year. Before Mainnet this needs to pull from a trusted oracle or be replaced with a block-time-based check using Midnight's kernel API.
2. **Reusability** — right now any wallet can call `verify_age` on any contract instance. A production version would tie proofs to specific user sessions or commitments so one proof can't be replayed.
3. **UX** — users need clearer guidance on setting up Lace and the proof server. A hosted proof server option (for users who don't want to run Docker) would significantly lower the barrier.

None of these are blockers — they're normal productization work. The privacy model and core circuit logic are solid.
