const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding test disaster with account:", deployer.address);

  // Connect to the deployed DisasterFundPool contract
  const disasterFundPoolAddress = "0xB7696E510113C3F3063f869de7e5Ed49Bc1E8b5C";
  const DisasterFundPool = await ethers.getContractFactory("DisasterFundPool");
  const disasterFundPool = DisasterFundPool.attach(disasterFundPoolAddress);

  // Add a test disaster
  console.log("Adding test disaster...");
  const fundAmount = ethers.parseEther("0.01");
  const tx = await disasterFundPool.registerDisaster(
    "Test Flood Relief",
    "Emergency flood relief for affected areas",
    400001, // Mumbai pincode
    fundAmount,
    { value: fundAmount } // Add 0.01 ETH to the disaster fund
  );
  
  await tx.wait();
  console.log("Test disaster added successfully!");

  // Check the disaster count
  const count = await disasterFundPool.getDisasterCount();
  console.log("Total disasters:", count.toString());

  // Get disaster details
  if (count > 0) {
    const disaster = await disasterFundPool.getDisasterDetails(1);
    console.log("First disaster details:", {
      id: disaster[0].toString(),
      name: disaster[1],
      description: disaster[2],
      pincode: disaster[3].toString(),
      totalFunds: ethers.formatEther(disaster[4]),
      claimedFunds: ethers.formatEther(disaster[5]),
      active: disaster[6]
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
