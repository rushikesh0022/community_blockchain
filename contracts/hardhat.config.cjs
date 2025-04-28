// Use CommonJS require syntax
const { HardhatUserConfig } = require("hardhat/config"); // Note: Type checking might be lost here
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-dependency-compiler");
require("dotenv").config({ path: "./.env" }); // Ensure to load .env file
// Ensure you have HOLESKY_RPC_URL and HOLESKY_PRIVATE_KEY in your .env.local file

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

// Define config object (type annotation might not work directly in CJS)
const config = {
  solidity: "0.8.19",
  dependencyCompiler: {
    paths: ["@anon-aadhaar/contracts"],
  },
  networks: {
    holesky: {
      url: "https://ethereum-holesky.publicnode.com/",
      accounts: [privateKey], // Provide privateKey directly as string
    },
    sepolia: {
      url: "https://rpc.ankr.com/eth_sepolia/872c2d1ef0a376a7062e7de0e6f961cfd501f25ee6198d2d5b8378f9bbe9abb1",
      accounts: [privateKey],
    }
  },
};

// Use CommonJS module.exports
module.exports = config;
