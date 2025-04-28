# Disaster Relief Fund

This project implements a decentralized application (dApp) focused on providing disaster relief funds. It leverages Anon Aadhaar for anonymous identity verification of recipients based on their Aadhaar pincode, ensuring funds reach affected individuals securely. The dApp also includes features like a public donation pool and potentially an on-chain voting mechanism. It utilizes Next.js for the frontend, Hardhat for smart contract development, and Wagmi for blockchain interactions.

## Features

*   **Anon Aadhaar Integration:** Verifies user identity and pincode anonymously using Aadhaar credentials to determine eligibility for relief funds.
*   **Disaster Fund Pool:** Allows public contributions to specific disaster relief campaigns and enables verified, eligible users to claim funds.
*   **Admin Management:** Provides functionality for registering new disasters, managing their status, and potentially overseeing fund distribution.
*   **(Optional) On-chain Voting:** May include a mechanism for verified users to participate in polls or decisions related to the fund.
*   **Wallet Connection:** Uses WalletConnect for seamless connection to user wallets for donations and claims.


## Tech Stack

*   **Frontend:** Next.js, React, Tailwind CSS
*   **Blockchain Interaction:** Wagmi, Viem, Ethers.js (via Hardhat)
*   **Smart Contracts:** Solidity, Hardhat
*   **Identity Verification:** Anon Aadhaar SDK (`@anon-aadhaar/react`, `@anon-aadhaar/contracts`)
*   **Wallet Integration:** WalletConnect (`@web3modal/wagmi`)

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A crypto wallet (e.g., MetaMask)
*   Git

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd blockchain-final
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
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
    *   `NEXT_PUBLIC_ANON_AADHAAR_CONTRACT_ADDRESS`: The deployed Anon Aadhaar Verifier contract address (often a standard one, check Anon Aadhaar docs). The example uses `6bE8Cec7a06BA19c39ef328e8c8940cEfeF7E281`.
    *   `NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_PROD`/`_TEST`: The deployed `AnonAadhaarVote` contract address. You will get this after deployment.
    *   `NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD`/`_TEST`: The deployed `DisasterFundPool` contract address. You will get this after deployment.
    *   `NEXT_PUBLIC_PROJECT_ID`: Your WalletConnect Cloud project ID. Get one from [cloud.walletconnect.com](https://cloud.walletconnect.com/).
    *   `NEXT_PUBLIC_RPC_URL`: The RPC URL for the network you are deploying to (e.g., Sepolia, Holesky).
    *   `PRIVATE_KEY`: The private key of the wallet you will use for *deployment only*. **Handle with extreme care.**

2.  **Contracts Directory (`contracts/.env`):**
    Create a `.env` file within the `contracts` directory:
    ```bash
    cp contracts/.env.example contracts/.env # Assuming you create an example file there
    # or manually create contracts/.env
    ```
    Add the following variables:
    *   `PRIVATE_KEY`: The private key of the account you'll use to deploy the contracts. **This is critical and should be kept secret.**
    *   `NEXT_PUBLIC_RPC_URL`: The RPC URL for the network (e.g., Holesky, Sepolia).
    *   Optionally, add API keys if needed for block explorers (e.g., `ETHERSCAN_API_KEY`).

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