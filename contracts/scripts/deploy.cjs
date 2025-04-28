// Use CommonJS require syntax
const { ethers } = require("hardhat"); // Update import to CommonJS
require("@nomiclabs/hardhat-ethers");

require("dotenv").config();
// scripts/deploy.cjs (now using CommonJS)

async function main() {
  // Get the deploying account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const anonAadhaarVerifierAddress = "0x6bE8Cec7a06BA19c39ef328e8c8940cEfeF7E281";

  // Deploy the DisasterFundPool contract
  console.log("Deploying DisasterFundPool contract...");
  const disasterFundPool = await ethers.deployContract("DisasterFundPool", [
    anonAadhaarVerifierAddress, // Use hardcoded address
  ]);

  await disasterFundPool.waitForDeployment();
  const disasterFundPoolAddress = await disasterFundPool.getAddress();
  console.log(`DisasterFundPool contract deployed to ${disasterFundPoolAddress}`);

  // For backward compatibility, also deploy the AnonAadhaarVote contract
  console.log("Deploying AnonAadhaarVote contract...");
  const vote = await ethers.deployContract("AnonAadhaarVote", [
    "Do you like this app?",
    ["0", "1", "2", "3", "4", "5"],
    anonAadhaarVerifierAddress, // Use hardcoded address
  ]);

  await vote.waitForDeployment();
  const voteAddress = await vote.getAddress();
  console.log(`AnonAadhaarVote contract deployed to ${voteAddress}`);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`DisasterFundPool: ${disasterFundPoolAddress}`);
  console.log(`AnonAadhaarVote: ${voteAddress}`);
  console.log("\nUpdate your .env file with these addresses. Also, ensure you are using the deploying account to access the admin panel.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
