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
import { getEligibleDisasters, DisasterWithEligibility, formatFunds } from "@/utils";
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
    // Redirect if not logged in via Anon Aadhaar or wallet not connected
    if (anonAadhaar.status !== "logged-in" || !isConnected) {
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
      <main className="flex flex-col min-h-[75vh] mx-auto justify-center items-center w-full p-4">
        <div className="max-w-4xl w-full">
          <h2 className="text-[90px] font-rajdhani font-medium leading-none">
            CLAIM DISASTER FUNDS
          </h2>
          <div className="text-md mt-4 mb-8 text-[#717686]">
            Your Aadhaar has been verified anonymously. Based on your pincode, you may be eligible for the following disaster relief funds.
            {anonAadhaarCore?.proof?.pincode && (
              <span className="block mt-2 font-semibold">Your Verified Pincode: {anonAadhaarCore.proof.pincode}</span>
            )}
          </div>

          {/* Use Toaster correctly */}
          {claimStatus && (
            <Toaster type={claimStatus.type} message={claimStatus.message} />
          )}

          <div className="mt-8">
            <h3 className="text-2xl font-rajdhani font-semibold mb-4">Eligible Funds</h3>
            {loadingDisasters ? (
              <Loader />
            ) : eligibleDisasters.length > 0 ? (
              <div className="space-y-6">
                {eligibleDisasters.map((disaster) => (
                  <div key={disaster.id} className={`border p-4 rounded-lg shadow ${disaster.eligible ? 'border-green-500' : 'border-gray-300'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-semibold mb-1">{disaster.name}</h4>
                        <p className="text-sm text-gray-600 mb-1">Required Pincode: {disaster.pincode}</p>
                        <p className="text-sm text-gray-600 mb-3">{disaster.description}</p>
                        <p className="text-sm font-medium">Available Funds: {formatFunds(disaster.totalFunds)}</p>
                        <p className="text-sm font-medium">Claimed Funds: {formatFunds(disaster.claimedFunds)}</p>
                      </div>
                      {disaster.eligible && (
                        <div className="ml-4 flex-shrink-0">
                          {disaster.hasClaimed ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              Already Claimed
                            </span>
                          ) : (
                            <button
                              disabled={claimingDisasterId === disaster.id || !anonAadhaarCore}
                              type="button"
                              className="inline-block bg-[#009A08] rounded-lg text-white px-6 py-1 border-2 border-[#009A08] font-rajdhani font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                  if (anonAadhaarCore) handleClaim(disaster.id, anonAadhaarCore);
                                }}
                              >
                                {claimingDisasterId === disaster.id ? <Loader /> : 'CLAIM (0.001 ETH)'} 
                              </button>
                            )}
                          </div>
                      )}
                    </div>
                    {!disaster.eligible && (
                       <p className="text-sm text-red-600 mt-2 font-medium">Your pincode does not match this disaster area.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No active disaster funds found matching your criteria, or unable to load disaster data.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
