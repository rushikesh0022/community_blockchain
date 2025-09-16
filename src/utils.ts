import { ethers } from "ethers";
import votingAbi from "../public/AnonAadhaarVote.json";
import disasterFundPoolAbi from "../public/DisasterFundPool.json";

const providerUrl = "https://ethereum-sepolia.publicnode.com";

// Create a provider instance that can be reused
let cachedProvider: ethers.JsonRpcProvider | null = null;

const getProvider = () => {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(providerUrl);
  }
  return cachedProvider;
};

// Function to cleanup provider connection
export const cleanupProvider = () => {
  if (cachedProvider) {
    try {
      cachedProvider.destroy();
    } catch (error) {
      console.log("Provider cleanup completed");
    }
    cachedProvider = null;
  }
};

// Type definitions
export interface Disaster {
  id: number;
  name: string;
  description: string;
  pincode: number;
  totalFunds: string;
  claimedFunds: string;
  active: boolean;
}

export interface DisasterWithEligibility extends Disaster {
  eligible: boolean;
  hasClaimed: boolean;
}

// Original voting functions
export const getTotalVotes = async (useTestAadhaar: boolean): Promise<any> => {
  const voteBreakdown = [
    { rating: 0, percentage: 0 },
    { rating: 1, percentage: 0 },
    { rating: 2, percentage: 0 },
    { rating: 3, percentage: 0 },
    { rating: 4, percentage: 0 },
    { rating: 5, percentage: 0 },
  ];

  try {
    const provider = getProvider();
    const voteContract = new ethers.Contract(
      (useTestAadhaar
        ? process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_TEST
        : process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_PROD) || "",
      votingAbi.abi,
      provider
    );

    const proposalCount = await voteContract.getProposalCount();

    // Initialize a variable to store the total vote count
    let totalVoteCount = 0;

    // Iterate through the proposals and sum their vote counts
    for (let i = 0; i < proposalCount; i++) {
      const voteCount = await voteContract.getProposal(i);
      totalVoteCount += Number(voteCount[1]);
    }

    await Promise.all(
      voteBreakdown.map(async (rating) => {
        const voteCount = await voteContract.getProposal(rating.rating);
        const percentage = Math.floor(
          (Number(voteCount[1]) / totalVoteCount) * 100
        );
        rating.percentage = percentage;
      })
    );

    return voteBreakdown;
  } catch (error) {
    console.error("Error fetching votes:", error);
    return voteBreakdown;
  }
};

export const hasVoted = async (
  userNullifier: string,
  useTestAadhaar: boolean
): Promise<boolean> => {
  try {
    const provider = getProvider();
    const voteContract = new ethers.Contract(
      (useTestAadhaar
        ? process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_TEST
        : process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_PROD) || "",
      votingAbi.abi,
      provider
    );

    return await voteContract.checkVoted(userNullifier);
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
};

// New disaster fund pool functions
export const getDisasterFundPoolContract = (useTestAadhaar: boolean) => {
  const provider = getProvider();
  return new ethers.Contract(
    (useTestAadhaar
      ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
      : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD) || "",
    disasterFundPoolAbi.abi,
    provider
  );
};

export const getAllDisasters = async (useTestAadhaar: boolean): Promise<Disaster[]> => {
  try {
    const disasterFundPool = getDisasterFundPoolContract(useTestAadhaar);
    const disasterCount = await disasterFundPool.getDisasterCount();
    
    const disasters: Disaster[] = [];
    
    for (let i = 1; i <= disasterCount; i++) {
      const disasterDetails = await disasterFundPool.getDisasterDetails(i);
      
      disasters.push({
        id: Number(disasterDetails[0]),
        name: disasterDetails[1],
        description: disasterDetails[2],
        pincode: Number(disasterDetails[3]),
        totalFunds: ethers.formatEther(disasterDetails[4]),
        claimedFunds: ethers.formatEther(disasterDetails[5]),
        active: disasterDetails[6]
      });
    }
    
    return disasters;
  } catch (error) {
    console.error("Error fetching disasters:", error);
    return [];
  }
};

export const getDisastersByPincode = async (
  pincode: number,
  useTestAadhaar: boolean
): Promise<Disaster[]> => {
  try {
    const disasterFundPool = getDisasterFundPoolContract(useTestAadhaar);
    const disasterIds = await disasterFundPool.getDisastersByPincode(pincode);
    
    const disasters: Disaster[] = [];
    
    for (const id of disasterIds) {
      const disasterDetails = await disasterFundPool.getDisasterDetails(id);
      
      disasters.push({
        id: Number(disasterDetails[0]),
        name: disasterDetails[1],
        description: disasterDetails[2],
        pincode: Number(disasterDetails[3]),
        totalFunds: ethers.formatEther(disasterDetails[4]),
        claimedFunds: ethers.formatEther(disasterDetails[5]),
        active: disasterDetails[6]
      });
    }
    
    return disasters;
  } catch (error) {
    console.error("Error fetching disasters by pincode:", error);
    return [];
  }
};

export const getEligibleDisasters = async (
  userPincode: number,
  userNullifier: string,
  useTestAadhaar: boolean
): Promise<DisasterWithEligibility[]> => {
  try {
    const allDisasters = await getAllDisasters(useTestAadhaar);
    const disasterFundPool = getDisasterFundPoolContract(useTestAadhaar);
    
    const eligibleDisasters: DisasterWithEligibility[] = [];
    
    for (const disaster of allDisasters) {
      if (disaster.active) {
        const hasClaimed = await disasterFundPool.checkClaimed(disaster.id, userNullifier);
        
        eligibleDisasters.push({
          ...disaster,
          eligible: disaster.pincode === userPincode,
          hasClaimed
        });
      }
    }
    
    return eligibleDisasters;
  } catch (error) {
    console.error("Error fetching eligible disasters:", error);
    return [];
  }
};

export const hasClaimedFunds = async (
  disasterId: number,
  userNullifier: string,
  useTestAadhaar: boolean
): Promise<boolean> => {
  try {
    const disasterFundPool = getDisasterFundPoolContract(useTestAadhaar);
    return await disasterFundPool.checkClaimed(disasterId, userNullifier);
  } catch (error) {
    console.error("Error checking claimed status:", error);
    return false;
  }
};

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatFunds(amount: string): string {
  return `${parseFloat(amount).toFixed(4)} ETH`;
}

// --- Admin and Donation Functions ---

export const getOwner = async (useTestAadhaar: boolean): Promise<string> => {
  try {
    const disasterFundPool = getDisasterFundPoolContract(useTestAadhaar);
    return await disasterFundPool.owner();
  } catch (error) {
    console.error("Error fetching owner:", error);
    return "";
  }
};

// Note: Functions like registerDisaster, setDisasterStatus, and addFundsToDisaster
// involve sending transactions and will typically be called using `writeContract`
// directly from the component to handle wallet interactions and transaction states.
// These placeholders are primarily for illustrating the interaction points.

// Example structure (actual call uses writeContract):
// export const registerDisaster = async (...) => { ... }
// export const setDisasterStatus = async (...) => { ... }
// export const addFundsToDisaster = async (...) => { ... }
