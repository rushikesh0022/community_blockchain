/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/no-unescaped-entities */
import { LaunchProveModal, useAnonAadhaar } from "@anon-aadhaar/react";
import { useEffect, useContext, useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { AppContext } from "./_app";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { getAllDisasters, Disaster, formatFunds, shortenAddress } from "@/utils"; // Added shortenAddress
import { Loader } from "@/components/Loader";
import { ethers } from "ethers"; // Import ethers
import { writeContract } from "@wagmi/core"; // Import writeContract
import { wagmiConfig } from "@/config"; // Import wagmiConfig
import disasterFundPoolAbi from "../../public/DisasterFundPool.json"; // Import ABI
import { Toaster } from "@/components/Toaster"; // Import Toaster

// This is a trick to enable having both modes in under the same page.
// This could be removed and only the <LaunchProveModal /> could be displayed.
const LaunchMode = ({
  isTest,
  setIsTestMode,
}: {
  isTest: boolean;
  setIsTestMode: (isTest: boolean) => void;
}) => {
  return (
    <button onClick={() => setIsTestMode(!isTest)}>
      {isTest ? "Switch to Production Mode" : "Switch to Test Mode"}
    </button>
  );
};

export default function Home() {
  const [anonAadhaar] = useAnonAadhaar();
  const { isConnected, address } = useAccount();
  const { isTestMode, setIsTestMode } = useContext(AppContext);
  const { open } = useWeb3Modal();
  const router = useRouter();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loadingDisasters, setLoadingDisasters] = useState<boolean>(true);
  const [donatingTo, setDonatingTo] = useState<number | null>(null); // Track which disaster is being donated to
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [processingDonation, setProcessingDonation] = useState<boolean>(false);
  const [donationStatus, setDonationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


  useEffect(() => {
    if (anonAadhaar.status === "logged-in") {
      router.push("./claim"); // Redirect to claim page instead of vote page
    }
  }, [anonAadhaar, router]);

  useEffect(() => {
    setLoadingDisasters(true);
    getAllDisasters(isTestMode)
      .then((fetchedDisasters) => {
        setDisasters(fetchedDisasters.filter(d => d.active));
        setLoadingDisasters(false);
      })
      .catch((error) => {
        console.error("Error fetching disasters:", error);
        setLoadingDisasters(false);
      });
  }, [isTestMode]);

  const handleDonate = async (disasterId: number) => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setDonationStatus({ type: 'error', message: 'Please enter a valid donation amount.' });
      return;
    }
    setProcessingDonation(true);
    setDonationStatus(null);

    try {
      const donationAmountWei = ethers.parseEther(donationAmount);

      const tx = await writeContract(wagmiConfig, {
        abi: disasterFundPoolAbi.abi,
        address: `0x${
          isTestMode
            ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD
        }`,
        functionName: 'addFundsToDisaster',
        args: [disasterId],
        value: donationAmountWei, // Send ETH with the transaction
      });

      setDonationStatus({ type: 'success', message: `Donation successful! Tx: ${tx}` });
      setDonatingTo(null); // Close donation input
      setDonationAmount('');
      // Refetch disasters to show updated funds
      getAllDisasters(isTestMode)
        .then((fetchedDisasters) => {
          setDisasters(fetchedDisasters.filter(d => d.active));
        });

    } catch (error: any) {
      console.error("Error donating:", error);
      setDonationStatus({ type: 'error', message: error.shortMessage || error.message || 'Donation failed.' });
    } finally {
      setProcessingDonation(false);
    }
  };


  return (
    <>
      <main className="flex flex-col min-h-[75vh] mx-auto justify-center items-center w-full p-4">
        {donationStatus && <Toaster type={donationStatus.type} message={donationStatus.message} />}
        <div className="max-w-4xl w-full">
          <h2 className="text-[90px] font-rajdhani font-medium leading-none">
            DISASTER RELIEF FUND
          </h2>
          <div className="text-md mt-4 mb-8 text-[#717686]">
            Verify your Aadhaar anonymously to check eligibility for disaster relief funds based on your pincode.
          </div>

          <div className="flex w-full gap-8 mb-8 items-center">
            <LaunchMode isTest={isTestMode} setIsTestMode={setIsTestMode} />
            {isConnected ? (
              <LaunchProveModal
                nullifierSeed={Math.floor(Math.random() * 1983248)}
                signal={address}
                fieldsToReveal={["revealPinCode"]} // Use the correct key from docs
                buttonStyle={{
                  borderRadius: "8px",
                  border: "solid",
                  borderWidth: "1px",
                  boxShadow: "none",
                  fontWeight: 500,
                  borderColor: "#009A08",
                  color: "#009A08",
                  fontFamily: "rajdhani",
                }}
                buttonTitle={
                  isTestMode ? "VERIFY (TEST)" : "VERIFY (REAL)"
                }
              />
            ) : (
              <button
                className="bg-[#009A08] rounded-lg text-white px-6 py-1 font-rajdhani font-medium"
                onClick={() => open()}
              >
                CONNECT WALLET
              </button>
            )}
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-rajdhani font-semibold mb-4">Active Disaster Relief Funds</h3>
            {loadingDisasters ? (
              <Loader />
            ) : disasters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {disasters.map((disaster) => (
                  <div key={disaster.id} className="border p-4 rounded-lg shadow">
                    <h4 className="text-xl font-semibold mb-2">{disaster.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">Pincode: {disaster.pincode}</p>
                    <p className="text-sm text-gray-600 mb-3">{disaster.description}</p>
                    <p className="text-sm font-medium">Total Funds: {formatFunds(disaster.totalFunds)}</p>
                    <p className="text-sm font-medium">Claimed Funds: {formatFunds(disaster.claimedFunds)}</p>
                    {/* Donation Section */}
                    <div className="mt-4">
                      {donatingTo === disaster.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="any"
                            placeholder="ETH Amount"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-xs p-1"
                            disabled={processingDonation}
                          />
                          <button
                            onClick={() => handleDonate(disaster.id)}
                            disabled={processingDonation || !isConnected}
                            className="inline-flex justify-center py-1 px-2 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {processingDonation ? <Loader /> : 'Confirm'}
                          </button>
                          <button
                             onClick={() => setDonatingTo(null)}
                             disabled={processingDonation}
                             className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                           >
                             Cancel
                           </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setDonatingTo(disaster.id); setDonationAmount(''); setDonationStatus(null); }}
                          disabled={!isConnected}
                          className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          Donate
                        </button>
                      )}
                       {!isConnected && <p className="text-xs text-red-500 mt-1">Connect wallet to donate</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No active disaster funds found.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
