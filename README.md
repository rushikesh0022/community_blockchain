# 🌍 Community Blockchain - Web3 Disaster Relief Fund

A decentralized disaster relief funding platform built with cutting-edge Web3 and privacy-preserving technologies. This project combines blockchain transparency with zero-knowledge privacy to create a secure, anonymous, and efficient disaster relief system.

## 🚀 Advanced Technologies Used

### 🔐 **Zero-Knowledge Proofs (ZKP)**

- **Anon Aadhaar ZK-SNARKs**: Privacy-preserving identity verification
- **Nullifier System**: Prevents double-spending and duplicate claims
- **Identity Privacy**: Verify eligibility without revealing personal data
- **Cryptographic Proofs**: Mathematical verification without data exposure

### 🌐 **Web3 & Blockchain Stack**

- **Ethereum Blockchain**: Decentralized infrastructure
- **Solidity Smart Contracts**: Immutable business logic
- **Ethers.js v6**: Advanced blockchain interactions
- **Wagmi v2**: React hooks for Ethereum
- **Web3Modal v4**: Multi-wallet connectivity
- **Viem v2**: Type-safe Ethereum client
- **Hardhat**: Smart contract development framework

### 🛡️ **Privacy & Security Technologies**

- **Zero-Knowledge Circuits**: Anon Aadhaar verification circuits
- **Cryptographic Nullifiers**: Unique proof identifiers
- **Groth16 Protocol**: Efficient ZK-SNARK implementation
- **Merkle Tree Proofs**: Efficient membership verification
- **Poseidon Hashing**: ZK-friendly hash function

### ⚛️ **Frontend Technologies**

- **Next.js 15**: React meta-framework with SSR
- **React 18**: Modern UI with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Query**: Blockchain state management

### 🔗 **Blockchain Infrastructure**

- **JSON-RPC Providers**: Blockchain communication
- **Smart Contract ABIs**: Contract interfaces
- **Transaction Management**: State updates and events
- **Gas Optimization**: Efficient contract execution
- **Multi-network Support**: Testnet and mainnet deployment

## 🏗️ **System Architecture**

### **Frontend Layer**

```
Next.js Application
├── Components (UI/UX)
├── Pages (Routes)
├── Web3 Integration
└── State Management
```

### **Web3 Integration Layer**

```
Wagmi Hooks
├── Wallet Connection
├── Contract Interactions
├── Transaction Management
└── Network Switching
```

### **Privacy Layer**

```
Anon Aadhaar System
├── ZK Proof Generation
├── Identity Verification
├── Nullifier Management
└── Privacy Preservation
```

### **Blockchain Layer**

```
Ethereum Network
├── DisasterFundPool Contract
├── AnonAadhaarVote Contract
├── Verifier Contracts
└── Access Control
```

## 🎯 **Core Features**

### 🔒 **Privacy-First Design**

- **Anonymous Donations**: Contribute without revealing identity
- **Private Claims**: Claim funds with ZK proof verification
- **Identity Protection**: Verify eligibility without data exposure
- **Nullifier Prevention**: Stop duplicate claims cryptographically

### 💰 **Transparent Fund Management**

- **On-chain Tracking**: All transactions visible on blockchain
- **Real-time Updates**: Live fund status and distributions
- **Immutable Records**: Tamper-proof transaction history
- **Audit Trail**: Complete funding lifecycle tracking

### 🎛️ **Admin Controls**

- **Project Authorization**: Admin approves community projects
- **Status Management**: Activate/deactivate funding campaigns
- **Access Control**: Role-based permissions system
- **Governance**: Decentralized decision making

### 🔐 **Advanced Security**

- **Smart Contract Security**: Audited contract logic
- **Access Modifiers**: Function-level permissions
- **Reentrancy Protection**: Attack prevention mechanisms
- **Input Validation**: Comprehensive data verification

## 🛠️ **Development Setup**

### Prerequisites

```bash
Node.js 18+
npm or yarn
MetaMask wallet
Ethereum testnet ETH
```

### Installation

```bash
# Clone repository
git clone https://github.com/rushikesh0022/community_blockchain.git
cd community_blockchain

# Install dependencies
npm install --legacy-peer-deps

# Setup environment variables
cp .env.local.example .env.local
# Add your contract addresses and keys
```

### Smart Contract Development

```bash
# Navigate to contracts directory
cd contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.cjs --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.cjs --network sepolia
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🧪 **Zero-Knowledge Implementation**

### **Anon Aadhaar Integration**

```typescript
// ZK Proof Generation
const proof = await generateAnonAadhaarProof({
  aadhaarData: userData,
  signal: walletAddress,
  fieldsToReveal: ["pincode"],
});

// Proof Verification
const isValid = await verifyAnonAadhaarProof(proof);
```

### **Privacy Workflow**

1. **Identity Verification**: Generate ZK proof from Aadhaar data
2. **Nullifier Creation**: Unique identifier prevents reuse
3. **Proof Submission**: Submit proof to smart contract
4. **Cryptographic Verification**: Contract verifies without data access
5. **Action Authorization**: Execute claim/vote if proof valid

## 📋 **Smart Contract Functions**

### **DisasterFundPool.sol**

```solidity
// Project Management
function registerDisaster(string memory name, string memory description,
                         uint256 pincode, uint256 initialFunding) external onlyOwner

// Funding
function addFundsToDisaster(uint256 disasterId) external payable

// Claims with ZK Verification
function claimFunds(uint256 disasterId, uint256 nullifierSeed,
                   uint256 nullifier, uint256 timestamp,
                   address signal, uint256[4] calldata revealArray,
                   uint256[8] calldata groth16Proof) external

// Data Retrieval
function getDisasterDetails(uint256 disasterId) external view returns (...)
```

### **Zero-Knowledge Verification**

```solidity
// Verify Anon Aadhaar proof
modifier verifyAnonAadhaarProof(uint256 nullifierSeed, uint256 nullifier,
                               uint256 timestamp, address signal,
                               uint256[4] calldata revealArray,
                               uint256[8] calldata groth16Proof) {
    require(anonAadhaarVerifierAddr.verifyAnonAadhaarProof(
        nullifierSeed, nullifier, timestamp, signal, revealArray, groth16Proof
    ), "Invalid proof");
    _;
}
```

## 🌍 **Network Configuration**

### **Supported Networks**

- **Local Development**: Hardhat Network
- **Testing**: Ethereum Sepolia Testnet
- **Production**: Ethereum Mainnet

### **Contract Addresses**

```bash
# Test Environment
DISASTER_FUND_POOL_TEST=0xB7696E510113C3F3063f869de7e5Ed49Bc1E8b5C
ANON_AADHAAR_VERIFIER=0x6bE8Cec7a06BA19c39ef328e8c8940cEfeF7E281

# Production Environment
DISASTER_FUND_POOL_PROD=0x...
```

## 🔄 **Data Flow**

### **Donation Flow**

```
User → Connect Wallet → Select Project → Enter Amount →
Sign Transaction → Blockchain Update → UI Refresh
```

### **Claim Flow**

```
User → Generate ZK Proof → Submit Claim → Contract Verification →
Nullifier Check → Fund Transfer → Event Emission
```

### **Admin Flow**

```
Admin → Create Project → Set Parameters → Deploy to Blockchain →
Community Access → Fund Collection → Distribution Management
```

## 📚 **Additional Documentation**

- [Architecture Diagram](./ARCHITECTURE.md) - Complete system architecture
- [Blockchain Concepts](./README_BLOCKCHAIN_CONCEPTS.md) - Detailed blockchain explanations
- [Smart Contracts](./contracts/README.md) - Contract documentation

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 **Deployment**

### **Frontend Deployment**

- **Vercel**: Optimized for Next.js applications
- **Netlify**: Alternative hosting platform
- **IPFS**: Decentralized hosting option

### **Smart Contract Deployment**

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.cjs --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## 🔮 **Future Enhancements**

- **Multi-chain Support**: Deploy on Polygon, BSC, etc.
- **DAO Governance**: Community-driven project approval
- **Advanced Analytics**: ML-powered fraud detection
- **Mobile App**: React Native implementation
- **Layer 2 Integration**: Lower transaction costs

## 🛟 **Support**

- **Issues**: [GitHub Issues](https://github.com/rushikesh0022/community_blockchain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rushikesh0022/community_blockchain/discussions)
- **Documentation**: Check the docs folder for detailed guides

---

**Built with ❤️ using cutting-edge Web3 and Zero-Knowledge technologies** # or
yarn install
```

## Environment Setup

This project requires environment variables for configuration.

1.  **Root Directory (`.env`):**
    Create a `.env` file in the project root by copying the example:

    ```bash
    cp .env.local.example .env
    ```

    Update the following variables in the `.env` file:

    - `NEXT_PUBLIC_ANON_AADHAAR_CONTRACT_ADDRESS`: The deployed Anon Aadhaar Verifier contract address (often a standard one, check Anon Aadhaar docs). The example uses `6bE8Cec7a06BA19c39ef328e8c8940cEfeF7E281`.
    - `NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_PROD`/`_TEST`: The deployed `AnonAadhaarVote` contract address. You will get this after deployment.
    - `NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD`/`_TEST`: The deployed `DisasterFundPool` contract address. You will get this after deployment.
    - `NEXT_PUBLIC_PROJECT_ID`: Your WalletConnect Cloud project ID. Get one from [cloud.walletconnect.com](https://cloud.walletconnect.com/).
    - `NEXT_PUBLIC_RPC_URL`: The RPC URL for the network you are deploying to (e.g., Sepolia, Holesky).
    - `PRIVATE_KEY`: The private key of the wallet you will use for _deployment only_. **Handle with extreme care.**

2.  **Contracts Directory (`contracts/.env`):**
    Create a `.env` file within the `contracts` directory:
    ```bash
    cp contracts/.env.example contracts/.env # Assuming you create an example file there
    # or manually create contracts/.env
    ```
    Add the following variables:
    - `PRIVATE_KEY`: The private key of the account you'll use to deploy the contracts. **This is critical and should be kept secret.**
    - `NEXT_PUBLIC_RPC_URL`: The RPC URL for the network (e.g., Holesky, Sepolia).
    - Optionally, add API keys if needed for block explorers (e.g., `ETHERSCAN_API_KEY`).

## Contract Deployment

The smart contracts (`AnonAadhaarVote`, `DisasterFundPool`) are managed using Hardhat.

1.  **Navigate to the contracts directory:**

    ```bash
    cd contracts
    ```

2.  **Install contract dependencies (if not already done by root `npm install`):**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Compile the contracts:**

    ```bash
    npx hardhat compile
    ```

4.  **Deploy the contracts:**
    Ensure your `contracts/.env` file is correctly set up with your `PRIVATE_KEY` and `NEXT_PUBLIC_RPC_URL`.
    Run the deployment script:

    ```bash
    npx hardhat run scripts/deploy.cjs --network <your_network_name>
    ```

    Replace `<your_network_name>` with the network defined in your [`hardhat.config.js`](contracts/hardhat.config.js) (e.g., `sepolia`, `holesky`, `localhost`).

5.  **Update `.env`:**
    After successful deployment, the script ([`contracts/scripts/deploy.cjs`](contracts/scripts/deploy.cjs)) will output the addresses of the deployed `DisasterFundPool` and `AnonAadhaarVote` contracts. Copy these addresses and paste them into the corresponding `NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_...` and `NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_...` variables in the root `.env` file.

## Running the Application

1.  **Navigate back to the root directory:**

    ```bash
    cd ..
    ```

2.  **Run in development mode:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

3.  **Build for production:**

    ```bash
    npm run build
    # or
    yarn build
    ```

4.  **Start the production server:**
    ```bash
    npm run start
    # or
    yarn start
    ```

## Linting

To check code style:

```bash
npm run lint
# or
yarn lint
```
