# Community Blockchain - Web3 Disaster Relief Fund Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js 15 + React 18 + TypeScript]
        COMP[Components Layer]
        PAGES[Pages Layer]
        STATE[State Management]
    end

    subgraph "Web3 Integration Layer"
        WAGMI[Wagmi v2 Hooks]
        WEB3M[Web3Modal v4]
        ETHERS[Ethers.js v6]
        VIEM[Viem v2]
    end

    subgraph "Privacy Layer"
        ZK[Anon Aadhaar ZK Proofs]
        VERIFY[Identity Verification]
        NULLIFIER[Nullifier Management]
    end

    subgraph "Blockchain Layer"
        NET[Ethereum Network]
        POOL[DisasterFundPool Contract]
        VOTE[AnonAadhaarVote Contract]
        VERIFIER[AnonAadhaar Verifier]
    end

    subgraph "Development Tools"
        HARDHAT[Hardhat Framework]
        DEPLOY[Deployment Scripts]
        TEST[Testing Suite]
    end

    UI --> COMP
    UI --> PAGES
    UI --> STATE

    PAGES --> WAGMI
    PAGES --> WEB3M
    WAGMI --> ETHERS
    WAGMI --> VIEM

    PAGES --> ZK
    ZK --> VERIFY
    ZK --> NULLIFIER

    ETHERS --> NET
    NET --> POOL
    NET --> VOTE
    NET --> VERIFIER

    HARDHAT --> DEPLOY
    DEPLOY --> POOL
    DEPLOY --> VOTE
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "User Interface Components"
        HOME[Home Page - index.tsx]
        ADMIN[Admin Panel - admin.tsx]
        CLAIM[Claim Page - claim.tsx]
        HEADER[Header Component]
        FOOTER[Footer Component]
    end

    subgraph "Core Functionality"
        DONATE[Donation Flow]
        CREATE[Project Creation]
        CLAIMS[Fund Claims]
        VERIFY_ID[Identity Verification]
    end

    subgraph "Smart Contracts"
        DISASTER[DisasterFundPool.sol]
        VOTING[AnonAadhaarVote.sol]
    end

    HOME --> DONATE
    ADMIN --> CREATE
    CLAIM --> CLAIMS

    DONATE --> DISASTER
    CREATE --> DISASTER
    CLAIMS --> DISASTER
    VERIFY_ID --> VOTING

    HOME --> VERIFY_ID
    ADMIN --> VERIFY_ID
    CLAIM --> VERIFY_ID
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3Modal
    participant Wallet
    participant ZKProof
    participant Contract
    participant Blockchain

    User->>Frontend: Access Application
    Frontend->>Web3Modal: Request Wallet Connection
    Web3Modal->>Wallet: Connect Wallet
    Wallet-->>Frontend: Wallet Connected

    User->>Frontend: Verify Identity
    Frontend->>ZKProof: Generate Anon Aadhaar Proof
    ZKProof-->>Frontend: ZK Proof Generated

    User->>Frontend: Donate to Project
    Frontend->>Wallet: Request Transaction Signature
    Wallet->>Contract: Execute addFundsToDisaster()
    Contract->>Blockchain: Update State
    Blockchain-->>Frontend: Transaction Confirmed

    User->>Frontend: Claim Funds
    Frontend->>Contract: Execute claimFunds() with ZK Proof
    Contract->>Blockchain: Verify & Transfer Funds
    Blockchain-->>Frontend: Claim Processed
```

## Technology Stack Architecture

```mermaid
graph TD
    subgraph "Frontend Technologies"
        A[Next.js 15.5.3]
        B[React 18.2.0]
        C[TypeScript]
        D[Tailwind CSS]
    end

    subgraph "Web3 Technologies"
        E[Ethers.js 6.13.5]
        F[Wagmi v2.9.12]
        G[Web3Modal v4.2.4]
        H[Viem v2.11.1]
    end

    subgraph "Blockchain Technologies"
        I[Solidity Contracts]
        J[Hardhat Framework]
        K[Ethereum Network]
        L[JSON-RPC Provider]
    end

    subgraph "Privacy Technologies"
        M[Anon Aadhaar Core]
        N[ZK-SNARKs]
        O[Nullifier System]
        P[Identity Verification]
    end

    A --> B
    B --> C
    C --> D

    B --> F
    F --> E
    F --> G
    F --> H

    E --> L
    L --> K
    J --> I
    I --> K

    B --> M
    M --> N
    N --> O
    O --> P
```

## Smart Contract Architecture

```mermaid
graph TB
    subgraph "DisasterFundPool Contract"
        REGISTER[registerDisaster()]
        ADD_FUNDS[addFundsToDisaster()]
        CLAIM[claimFunds()]
        GET_DETAILS[getDisasterDetails()]
        SET_STATUS[setDisasterStatus()]
    end

    subgraph "AnonAadhaarVote Contract"
        VOTE_FUNC[vote()]
        CHECK_VOTED[checkVoted()]
        GET_RESULTS[getResults()]
    end

    subgraph "Verifier Contract"
        VERIFY[verifyProof()]
        NULLIFIER_CHECK[checkNullifier()]
    end

    subgraph "Access Control"
        OWNER[onlyOwner Modifier]
        DISASTER_EXISTS[disasterExists Modifier]
        VALID_PROOF[validZKProof Modifier]
    end

    REGISTER --> OWNER
    SET_STATUS --> OWNER
    ADD_FUNDS --> DISASTER_EXISTS
    CLAIM --> VALID_PROOF

    VOTE_FUNC --> VALID_PROOF
    CLAIM --> NULLIFIER_CHECK
    VOTE_FUNC --> NULLIFIER_CHECK
```

## File Structure Architecture

```
donation/
├── Frontend Layer
│   ├── src/
│   │   ├── components/       # Reusable UI Components
│   │   │   ├── Header.tsx    # Navigation & Wallet
│   │   │   ├── Footer.tsx    # App Footer
│   │   │   ├── Loader.tsx    # Loading States
│   │   │   └── Toaster.tsx   # Notifications
│   │   ├── pages/           # Next.js Pages
│   │   │   ├── index.tsx    # Home/Donation Page
│   │   │   ├── admin.tsx    # Project Management
│   │   │   ├── claim.tsx    # Fund Claims
│   │   │   ├── _app.tsx     # App Wrapper
│   │   │   └── _document.tsx # HTML Document
│   │   ├── styles/          # Global Styles
│   │   ├── config.ts        # Web3 Configuration
│   │   ├── utils.ts         # Blockchain Utilities
│   │   └── interface.ts     # TypeScript Interfaces
│   └── public/              # Static Assets & ABIs
│
├── Smart Contract Layer
│   └── contracts/
│       ├── contracts/       # Solidity Files
│       │   ├── DisasterFundPool.sol
│       │   └── AnonAadhaarVote.sol
│       ├── scripts/         # Deployment Scripts
│       │   └── deploy.cjs
│       ├── artifacts/       # Compiled Contracts
│       └── hardhat.config.cjs
│
└── Configuration Layer
    ├── package.json         # Dependencies
    ├── tsconfig.json       # TypeScript Config
    ├── tailwind.config.js  # Styling Config
    ├── next.config.js      # Next.js Config
    └── .env.local          # Environment Variables
```

## Network Architecture

```mermaid
graph LR
    subgraph "Development Environment"
        LOCAL[Local Hardhat Network]
        TEST_CONTRACTS[Test Contracts]
    end

    subgraph "Test Environment"
        TESTNET[Ethereum Testnet]
        TEST_DEPLOY[Test Deployment]
    end

    subgraph "Production Environment"
        MAINNET[Ethereum Mainnet]
        PROD_DEPLOY[Production Deployment]
    end

    subgraph "Contract Addresses"
        TEST_ADDR[TEST_ADDRESSES]
        PROD_ADDR[PROD_ADDRESSES]
    end

    LOCAL --> TEST_CONTRACTS
    TESTNET --> TEST_DEPLOY
    MAINNET --> PROD_DEPLOY

    TEST_DEPLOY --> TEST_ADDR
    PROD_DEPLOY --> PROD_ADDR
```

## Security Architecture

```mermaid
graph TB
    subgraph "Frontend Security"
        ENV[Environment Variables]
        TYPE_SAFETY[TypeScript Type Safety]
        INPUT_VALIDATION[Input Validation]
    end

    subgraph "Web3 Security"
        WALLET_SECURITY[Wallet Security]
        TRANSACTION_VALIDATION[Transaction Validation]
        CONTRACT_VERIFICATION[Contract Verification]
    end

    subgraph "Smart Contract Security"
        ACCESS_CONTROL[Access Control Modifiers]
        REENTRANCY[Reentrancy Protection]
        OVERFLOW[SafeMath Operations]
    end

    subgraph "Privacy Security"
        ZK_PROOFS[Zero-Knowledge Proofs]
        NULLIFIER_PROTECTION[Nullifier Protection]
        IDENTITY_PRIVACY[Identity Privacy]
    end

    ENV --> WALLET_SECURITY
    TYPE_SAFETY --> TRANSACTION_VALIDATION
    INPUT_VALIDATION --> CONTRACT_VERIFICATION

    ACCESS_CONTROL --> ZK_PROOFS
    REENTRANCY --> NULLIFIER_PROTECTION
    OVERFLOW --> IDENTITY_PRIVACY
```

## Deployment Architecture

```mermaid
graph TD
    subgraph "Development"
        DEV_CODE[Source Code]
        LOCAL_TEST[Local Testing]
        UNIT_TESTS[Unit Tests]
    end

    subgraph "Build Process"
        COMPILE[Contract Compilation]
        FRONTEND_BUILD[Frontend Build]
        TYPE_CHECK[Type Checking]
    end

    subgraph "Deployment"
        CONTRACT_DEPLOY[Contract Deployment]
        FRONTEND_DEPLOY[Frontend Deployment]
        ENV_CONFIG[Environment Configuration]
    end

    subgraph "Production"
        BLOCKCHAIN[Live Blockchain]
        WEB_APP[Live Web App]
        MONITORING[Monitoring & Analytics]
    end

    DEV_CODE --> LOCAL_TEST
    LOCAL_TEST --> UNIT_TESTS
    UNIT_TESTS --> COMPILE
    COMPILE --> FRONTEND_BUILD
    FRONTEND_BUILD --> TYPE_CHECK

    TYPE_CHECK --> CONTRACT_DEPLOY
    TYPE_CHECK --> FRONTEND_DEPLOY
    CONTRACT_DEPLOY --> ENV_CONFIG
    FRONTEND_DEPLOY --> ENV_CONFIG

    ENV_CONFIG --> BLOCKCHAIN
    ENV_CONFIG --> WEB_APP
    WEB_APP --> MONITORING
```

## Key Architecture Benefits

### 🔒 **Security First**

- ZK-proof based identity verification
- Smart contract access controls
- Type-safe transactions

### ⚡ **Performance Optimized**

- Next.js server-side rendering
- Efficient blockchain interactions
- Optimized bundle sizes

### 🔄 **Scalable Design**

- Modular component architecture
- Environment-based deployments
- Extensible smart contracts

### 🌐 **Web3 Native**

- Multiple wallet support
- Real-time blockchain sync
- Decentralized state management

### 🎯 **User Experience**

- Responsive design
- Progressive Web App features
- Intuitive donation flows

This architecture ensures a robust, secure, and scalable Web3 application for disaster relief funding with privacy-preserving identity verification.
