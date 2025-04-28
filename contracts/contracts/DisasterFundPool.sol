// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import '@anon-aadhaar/contracts/interfaces/IAnonAadhaar.sol';

/**
 * @title DisasterFundPool
 * @dev A contract for managing disaster relief funds and distributing them to affected users
 * based on their Aadhaar pincode matching with disaster-affected areas.
 */
contract DisasterFundPool {
    // Address of the Anon Aadhaar verifier contract
    address public anonAadhaarVerifierAddr;
    
    // Address of the contract owner/admin
    address public owner;
    
    // Counter for disaster IDs
    uint256 private disasterIdCounter;
    
    // Struct to store disaster information
    struct Disaster {
        uint256 id;
        string name;
        string description;
        uint256 pincode;
        uint256 totalFunds;
        uint256 claimedFunds;
        bool active;
    }
    
    // Mapping from disaster ID to Disaster struct
    mapping(uint256 => Disaster) public disasters;
    
    // Mapping from pincode to array of disaster IDs
    mapping(uint256 => uint256[]) public disastersByPincode;
    
    // Mapping to track if a user (identified by nullifier) has claimed funds for a specific disaster
    mapping(uint256 => mapping(uint256 => bool)) public hasClaimed; // disasterId => nullifier => claimed
    
    // Events
    event DisasterRegistered(uint256 indexed disasterId, string name, uint256 pincode, uint256 fundAmount);
    event FundsAdded(uint256 indexed disasterId, uint256 amount);
    event FundsClaimed(uint256 indexed disasterId, address recipient, uint256 amount);
    event DisasterStatusChanged(uint256 indexed disasterId, bool active);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "DisasterFundPool: caller is not the owner");
        _;
    }
    
    /**
     * @dev Constructor to initialize the contract
     * @param _verifierAddr Address of the Anon Aadhaar verifier contract
     */
    constructor(address _verifierAddr) {
        anonAadhaarVerifierAddr = _verifierAddr;
        owner = msg.sender;
        disasterIdCounter = 1; // Start IDs from 1
    }
    
    /**
     * @dev Convert an address to uint256, used to check against signal
     * @param _addr Address to convert
     * @return Address in uint256 format
     */
    function addressToUint256(address _addr) private pure returns (uint256) {
        return uint256(uint160(_addr));
    }
    
    /**
     * @dev Check if the timestamp is more recent than (current time - 3 hours)
     * @param timestamp Timestamp to check
     * @return bool True if the timestamp is less than 3 hours ago
     */
    function isLessThan3HoursAgo(uint timestamp) public view returns (bool) {
        return timestamp > (block.timestamp - 3 * 60 * 60);
    }
    
    /**
     * @dev Register a new disaster with funds
     * @param name Name of the disaster
     * @param description Description of the disaster
     * @param pincode Pincode of the affected area
     * @param fundAmount Initial fund amount for the disaster
     * @return disasterId ID of the newly registered disaster
     */
    function registerDisaster(
        string memory name,
        string memory description,
        uint256 pincode,
        uint256 fundAmount
    ) public payable onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "DisasterFundPool: name cannot be empty");
        require(pincode > 0, "DisasterFundPool: pincode must be greater than 0");
        require(msg.value == fundAmount, "DisasterFundPool: sent value must match fundAmount");
        
        uint256 disasterId = disasterIdCounter++;
        
        disasters[disasterId] = Disaster({
            id: disasterId,
            name: name,
            description: description,
            pincode: pincode,
            totalFunds: fundAmount,
            claimedFunds: 0,
            active: true
        });
        
        disastersByPincode[pincode].push(disasterId);
        
        emit DisasterRegistered(disasterId, name, pincode, fundAmount);
        
        return disasterId;
    }
    
    /**
     * @dev Add funds to an existing disaster
     * @param disasterId ID of the disaster
     */
    function addFundsToDisaster(uint256 disasterId) public payable {
        require(disasters[disasterId].id == disasterId, "DisasterFundPool: disaster does not exist");
        require(msg.value > 0, "DisasterFundPool: amount must be greater than 0");
        
        disasters[disasterId].totalFunds += msg.value;
        
        emit FundsAdded(disasterId, msg.value);
    }
    
    /**
     * @dev Set the active status of a disaster
     * @param disasterId ID of the disaster
     * @param active New active status
     */
    function setDisasterStatus(uint256 disasterId, bool active) public onlyOwner {
        require(disasters[disasterId].id == disasterId, "DisasterFundPool: disaster does not exist");
        
        disasters[disasterId].active = active;
        
        emit DisasterStatusChanged(disasterId, active);
    }
    
    /**
     * @dev Claim funds for a disaster if the user's pincode matches the disaster pincode
     * @param disasterId ID of the disaster
     * @param nullifierSeed Nullifier Seed used while generating the proof
     * @param nullifier Nullifier for the user's Aadhaar data
     * @param timestamp Timestamp of when the QR code was signed
     * @param signal Signal used while generating the proof, should be equal to msg.sender
     * @param revealArray Array of the values used as input for the proof generation
     * @param groth16Proof SNARK Groth16 proof
     */
    function claimFunds(
        uint256 disasterId,
        uint nullifierSeed,
        uint nullifier,
        uint timestamp,
        uint signal,
        uint[4] memory revealArray, 
        uint[8] memory groth16Proof
    ) public {
        // Verify the disaster exists and is active
        require(disasters[disasterId].id == disasterId, "DisasterFundPool: disaster does not exist");
        require(disasters[disasterId].active, "DisasterFundPool: disaster is not active");
        
        // Verify the user hasn't already claimed funds for this disaster
        require(!hasClaimed[disasterId][nullifier], "DisasterFundPool: user has already claimed funds for this disaster");
        
        // Verify the signal matches the sender's address
        require(
            addressToUint256(msg.sender) == signal,
            "DisasterFundPool: wrong user signal sent"
        );
        
        // Verify the timestamp is recent
        require(
            isLessThan3HoursAgo(timestamp) == true,
            "DisasterFundPool: proof must be generated with Aadhaar data generated less than 3 hours ago"
        );
        
        // Verify the Anon Aadhaar proof
        require(
            IAnonAadhaar(anonAadhaarVerifierAddr).verifyAnonAadhaarProof(
                nullifierSeed,
                nullifier,
                timestamp,
                signal,
                revealArray,
                groth16Proof
            ) == true,
            "DisasterFundPool: proof sent is not valid"
        );
        
        // Extract the pincode from the revealArray (index 2)
        uint256 userPincode = revealArray[2];
        
        // Verify the user's pincode matches the disaster pincode
        require(
            userPincode == disasters[disasterId].pincode,
            "DisasterFundPool: user pincode does not match disaster pincode"
        );
        
        // Calculate the amount to distribute (for now, a fixed amount per claim)
        uint256 claimAmount = 0.001 ether;
        
        // Ensure there are enough funds available
        require(
            disasters[disasterId].totalFunds - disasters[disasterId].claimedFunds >= claimAmount,
            "DisasterFundPool: insufficient funds available for claim"
        );
        
        // Mark the user as having claimed funds for this disaster
        hasClaimed[disasterId][nullifier] = true;
        
        // Update the claimed funds amount
        disasters[disasterId].claimedFunds += claimAmount;
        
        // Transfer the funds to the user
        (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
        require(success, "DisasterFundPool: fund transfer failed");
        
        emit FundsClaimed(disasterId, msg.sender, claimAmount);
    }
    
    /**
     * @dev Get all disasters for a specific pincode
     * @param pincode Pincode to query
     * @return Array of disaster IDs for the pincode
     */
    function getDisastersByPincode(uint256 pincode) public view returns (uint256[] memory) {
        return disastersByPincode[pincode];
    }
    
    /**
     * @dev Get details of a specific disaster
     * @param disasterId ID of the disaster
     * @return id Disaster ID
     * @return name Disaster name
     * @return description Disaster description
     * @return pincode Affected area pincode
     * @return totalFunds Total funds allocated to the disaster
     * @return claimedFunds Total funds claimed from the disaster
     * @return active Whether the disaster is active
     */
    function getDisasterDetails(uint256 disasterId) public view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 pincode,
        uint256 totalFunds,
        uint256 claimedFunds,
        bool active
    ) {
        Disaster memory disaster = disasters[disasterId];
        return (
            disaster.id,
            disaster.name,
            disaster.description,
            disaster.pincode,
            disaster.totalFunds,
            disaster.claimedFunds,
            disaster.active
        );
    }
    
    /**
     * @dev Check if a user has already claimed funds for a specific disaster
     * @param disasterId ID of the disaster
     * @param nullifier Nullifier of the user
     * @return bool True if the user has already claimed funds
     */
    function checkClaimed(uint256 disasterId, uint256 nullifier) public view returns (bool) {
        return hasClaimed[disasterId][nullifier];
    }
    
    /**
     * @dev Get the total number of registered disasters
     * @return Total number of disasters
     */
    function getDisasterCount() public view returns (uint256) {
        return disasterIdCounter - 1;
    }
    
    /**
     * @dev Withdraw funds from the contract (only owner)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "DisasterFundPool: insufficient balance");
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "DisasterFundPool: withdrawal failed");
    }
}
