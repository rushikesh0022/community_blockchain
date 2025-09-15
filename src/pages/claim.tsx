/* eslint-disable react/no-unescaped-entities */
import { useAnonAadhaar, useProver } from "@anon-aadhaar/react";
import {
  AnonAadhaarCore,
  deserialize,
  packGroth16Proof,
} from "@anon-aadhaar/core"; // Removed Proof import
import { useEffect, useState, useContext, useCallback } from "react";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import disasterFundPoolAbi from "../../public/DisasterFundPool.json";
import { getEligibleDisasters, DisasterWithEligibility, formatFunds, cleanupProvider } from "@/utils";
import { AppContext } from "./_app";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "../config";
import { Toaster } from "@/components/Toaster"; // Assuming a Toaster component exists for notifications

export default function Claim() {
  const [anonAadhaar] = useAnonAadhaar();
  const { isTestMode } = useContext(AppContext);
  const [, latestProof] = useProver();
  const [anonAadhaarCore, setAnonAadhaarCore] = useState<AnonAadhaarCore | null>(null);
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [eligibleDisasters, setEligibleDisasters] = useState<DisasterWithEligibility[]>([]);
  const [loadingDisasters, setLoadingDisasters] = useState<boolean>(true);
  const [claimingDisasterId, setClaimingDisasterId] = useState<number | null>(null);
  const [claimStatus, setClaimStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClaim = async (
    disasterId: number,
    _anonAadhaarCore: AnonAadhaarCore
  ) => {
    if (!_anonAadhaarCore.proof) {
      setClaimStatus({ type: 'error', message: 'Anon Aadhaar proof not available.' });
      return;
    }

    setClaimingDisasterId(disasterId);
    setClaimStatus(null); // Clear previous status

    try {
      // Log values before sending transaction
      console.log("--- Claiming Funds ---");
      console.log("Disaster ID:", disasterId);
      console.log("User Address (Signal):", address);
      console.log("Proof Timestamp:", _anonAadhaarCore.proof.timestamp);
      console.log("Current Timestamp:", Math.floor(Date.now() / 1000));
      console.log("Is Proof Recent (<3 hours)?", (parseInt(_anonAadhaarCore.proof.timestamp) > (Math.floor(Date.now() / 1000) - 3 * 60 * 60)));
      console.log("User Pincode (Proof):", _anonAadhaarCore.proof.pincode);
      const targetDisaster = eligibleDisasters.find(d => d.id === disasterId);
      console.log("Target Disaster Pincode:", targetDisaster?.pincode);
      console.log("Pincodes Match:", targetDisaster?.pincode === parseInt(_anonAadhaarCore.proof.pincode || "0"));
      console.log("Target Disaster Total Funds:", targetDisaster?.totalFunds);
      console.log("Target Disaster Claimed Funds:", targetDisaster?.claimedFunds);
      const availableFunds = targetDisaster ? parseFloat(targetDisaster.totalFunds) - parseFloat(targetDisaster.claimedFunds) : 0;
      console.log("Available Funds:", availableFunds);
      console.log("Is Funds Sufficient (>= 0.001)?", availableFunds >= 0.001);
      console.log("Nullifier:", _anonAadhaarCore.proof.nullifier);
      console.log("Nullifier Seed:", _anonAadhaarCore.proof.nullifierSeed);
      // -----------------------------

      const packedGroth16Proof = packGroth16Proof(
        _anonAadhaarCore.proof.groth16Proof
      );

      // Ensure revealArray has the correct structure (uint[4])
      const revealArray: [string, string, string, string] = [
        _anonAadhaarCore.proof.ageAbove18 || "0", // Provide default if undefined
        _anonAadhaarCore.proof.gender || "0",
        _anonAadhaarCore.proof.pincode || "0",
        _anonAadhaarCore.proof.state || "0",
      ];

      const claimTx = await writeContract(wagmiConfig, {
        abi: disasterFundPoolAbi.abi,
        address: `0x${
          isTestMode
            ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD
        }`,
        functionName: "claimFunds",
        args: [
          disasterId,
          _anonAadhaarCore.proof.nullifierSeed,
          _anonAadhaarCore.proof.nullifier,
          _anonAadhaarCore.proof.timestamp,
          address, // Pass address string directly as signal
          revealArray,
          packedGroth16Proof,
        ],
      });

      setClaimStatus({ type: 'success', message: `Claim successful! Transaction: ${claimTx}` });
      // Refetch disasters to update claimed status
      if (_anonAadhaarCore.proof) {
        fetchEligibleDisasters(_anonAadhaarCore.proof);
      }

    } catch (e: any) {
      console.error("Claim transaction failed:", e);
      setClaimStatus({ type: 'error', message: e.message || 'Claim failed. Please try again.' });
    } finally {
      setClaimingDisasterId(null);
    }
  };

  // Adjusted function signature to use AnonAadhaarCore['proof'] implicitly
  const fetchEligibleDisasters = useCallback(
    async (proof: AnonAadhaarCore['proof'] | null) => {
      if (!proof || !proof.pincode || !proof.nullifier) {
        setLoadingDisasters(false);
        return;
      }

      setLoadingDisasters(true);
      try {
        const userPincode = parseInt(proof.pincode, 10);
        const disasters = await getEligibleDisasters(userPincode, proof.nullifier, isTestMode);
        setEligibleDisasters(disasters);
      } catch (error) {
        console.error("Error fetching eligible disasters:", error);
        setClaimStatus({ type: 'error', message: 'Failed to fetch disaster information.' });
      } finally {
        setLoadingDisasters(false);
      }
    },
    [isTestMode]
  );

  useEffect(() => {
    // Cleanup provider when wallet disconnects
    if (!isConnected) {
      cleanupProvider();
      return;
    }

    // Redirect if not logged in via Anon Aadhaar
    if (anonAadhaar.status !== "logged-in") {
      router.push("/");
      return;
    }

    // Deserialize the latest proof from local storage
    const aaObj = localStorage.getItem("anonAadhaar");
    if (aaObj) {
      const anonAadhaarProofs = JSON.parse(aaObj).anonAadhaarProofs;
      const latestProofKey = Object.keys(anonAadhaarProofs).pop();
      if (latestProofKey) {
        deserialize(anonAadhaarProofs[latestProofKey].pcd)
          .then((result) => {
            setAnonAadhaarCore(result);
            fetchEligibleDisasters(result.proof); // Fetch disasters once proof is ready
          })
          .catch(error => {
            console.error("Error deserializing proof:", error);
            setClaimStatus({ type: 'error', message: 'Failed to load Aadhaar proof.' });
            setLoadingDisasters(false);
          });
      } else {
        setLoadingDisasters(false);
        setClaimStatus({ type: 'error', message: 'No Aadhaar proof found.' });
      }
    } else {
      setLoadingDisasters(false);
      setClaimStatus({ type: 'error', message: 'Anon Aadhaar data not found.' });
    }
  }, [anonAadhaar.status, isConnected, router, latestProof, isTestMode, fetchEligibleDisasters]); // Added dependencies

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto pt-20 pb-12 px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-7xl font-extralight text-gray-900 mb-6 tracking-tight">
              Claim Funds
            </h1>
            <p className="text-xl font-light text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your identity has been verified anonymously. Based on your location, you may be eligible for community funding.
            </p>
            {anonAadhaarCore?.proof?.pincode && (
              <div className="mt-4 text-lg font-light text-gray-500">
                Verified Location: {anonAadhaarCore.proof.pincode}
              </div>
            )}
          </div>

          {/* Status Message */}
          {claimStatus && (
            <div className={`mb-8 p-4 rounded-2xl text-center ${
              claimStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="font-medium">{claimStatus.message}</p>
            </div>
          )}

          {/* Eligible Funds Section */}
          <div className="mt-12">
            {loadingDisasters ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
              </div>
            ) : eligibleDisasters.length > 0 ? (
              <div className="space-y-6">
                {eligibleDisasters.map((disaster) => (
                  <div 
                    key={disaster.id} 
                    className={`bg-white rounded-3xl p-8 shadow-sm border transition-all duration-300 hover:shadow-md ${
                      disaster.eligible ? 'border-green-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl font-light text-gray-900 mb-3">
                          {disaster.name}
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {disaster.description}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Required Location:</span>
                            <span className="font-medium">{disaster.pincode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Available:</span>
                            <span className="font-medium">{formatFunds(disaster.totalFunds)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Claimed:</span>
                            <span className="font-medium">{formatFunds(disaster.claimedFunds)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {disaster.eligible && (
                        <div className="ml-8 flex-shrink-0">
                          {disaster.hasClaimed ? (
                            <div className="px-6 py-3 rounded-full bg-gray-100 text-gray-600 font-medium">
                              Already Claimed
                            </div>
                          ) : (
                            <button
                              disabled={claimingDisasterId === disaster.id || !anonAadhaarCore}
                              type="button"
                              className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              onClick={() => {
                                if (anonAadhaarCore) handleClaim(disaster.id, anonAadhaarCore);
                              }}
                            >
                              {claimingDisasterId === disaster.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                'Claim 0.001 ETH'
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!disaster.eligible && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 text-sm font-medium">
                          Your location does not match this funding area.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl font-light text-gray-500">
                  No active funding opportunities found for your location.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
