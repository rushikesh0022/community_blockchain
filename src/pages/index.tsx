import { LaunchProveModal, useAnonAadhaar } from "@anon-aadhaar/react";
import { useEffect, useContext, useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { AppContext } from "./_app";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { getAllDisasters, Disaster, formatFunds, shortenAddress, cleanupProvider } from "@/utils";
import { Loader } from "@/components/Loader";
import { ethers } from "ethers";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "@/config";
import disasterFundPoolAbi from "../../public/DisasterFundPool.json";
import { Toaster } from "@/components/Toaster";

const LaunchMode = ({
  isTest,
  setIsTestMode,
}: {
  isTest: boolean;
  setIsTestMode: (isTest: boolean) => void;
}) => {
  return (
    <button 
      onClick={() => setIsTestMode(!isTest)}
      className="px-6 py-3 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full hover:border-gray-300 transition-colors"
    >
      {isTest ? "Production Mode" : "Test Mode"}
    </button>
  );
};

export default function Home() {
  const [anonAadhaar] = useAnonAadhaar();
  const { isConnected, address } = useAccount();
  const { isTestMode, setIsTestMode } = useContext(AppContext);
  const { open } = useWeb3Modal();
  const router = useRouter();
  const [projects, setProjects] = useState<Disaster[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [donatingTo, setDonatingTo] = useState<number | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [processingDonation, setProcessingDonation] = useState<boolean>(false);
  const [donationStatus, setDonationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


  useEffect(() => {
    if (anonAadhaar.status === "logged-in" && router.pathname !== "/claim") {
      router.push("./claim");
    }
  }, [anonAadhaar.status, router]);

  // Cleanup provider when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      cleanupProvider();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      setLoadingProjects(true);
      getAllDisasters(isTestMode)
        .then((fetchedProjects) => {
          setProjects(fetchedProjects.filter(p => p.active));
          setLoadingProjects(false);
        })
        .catch((error) => {
          console.error("Error fetching projects:", error);
          setLoadingProjects(false);
        });
    } else {
      setProjects([]);
      setLoadingProjects(false);
    }
  }, [isTestMode, isConnected]);

  const handleDonate = async (projectId: number) => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setDonationStatus({ type: 'error', message: 'Please enter a valid contribution amount.' });
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
        args: [projectId],
        value: donationAmountWei,
      });

      setDonationStatus({ type: 'success', message: `Contribution successful! Tx: ${tx}` });
      setDonatingTo(null);
      setDonationAmount('');
      // Refetch projects to show updated funds
      getAllDisasters(isTestMode)
        .then((fetchedProjects) => {
          setProjects(fetchedProjects.filter(p => p.active));
        });

    } catch (error: any) {
      console.error("Error contributing:", error);
      setDonationStatus({ type: 'error', message: error.shortMessage || error.message || 'Contribution failed.' });
    } finally {
      setProcessingDonation(false);
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {donationStatus && (
        <div className={`fixed top-8 right-8 z-50 p-4 rounded-2xl shadow-lg ${donationStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {donationStatus.message}
        </div>
      )}
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1 className="text-7xl font-extralight text-gray-900 mb-8 tracking-tight">
            Community
          </h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed mb-12">
            Transparent funding for local initiatives.<br />
            Verify your identity to participate in community projects.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <LaunchMode isTest={isTestMode} setIsTestMode={setIsTestMode} />
            {isConnected ? (
              <LaunchProveModal
                nullifierSeed={Math.floor(Math.random() * 1983248)}
                signal={address}
                fieldsToReveal={["revealPinCode"]}
                buttonStyle={{
                  borderRadius: "25px",
                  border: "2px solid #3B82F6",
                  backgroundColor: "#3B82F6",
                  color: "white",
                  padding: "16px 32px",
                  fontWeight: "400",
                  fontSize: "16px",
                  boxShadow: "0 8px 25px rgba(59, 130, 246, 0.2)",
                }}
                buttonTitle={isTestMode ? "Verify Identity (Test)" : "Verify Identity"}
              />
            ) : (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-light shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => open()}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="max-w-6xl mx-auto">          
          {loadingProjects ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project: Disaster) => (
                <div key={project.id} className="group bg-gray-50 rounded-3xl p-8 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-3">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">{project.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Area</span>
                        <span className="font-medium text-gray-600">{project.pincode}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Total</span>
                        <span className="font-medium text-gray-600">{formatFunds(project.totalFunds)} ETH</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Distributed</span>
                        <span className="font-medium text-gray-600">{formatFunds(project.claimedFunds)} ETH</span>
                      </div>
                      
                      {/* Minimal Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-4">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min((parseFloat(project.claimedFunds) / parseFloat(project.totalFunds)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contribution Section */}
                  {donatingTo === project.id ? (
                    <div className="space-y-4">
                      <input
                        type="number"
                        step="any"
                        placeholder="ETH amount"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="w-full border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent pb-2 placeholder-gray-300 transition-colors"
                        disabled={processingDonation}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDonate(project.id)}
                          disabled={processingDonation || !isConnected}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-full font-medium disabled:opacity-40 transition-all duration-200"
                        >
                          {processingDonation ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                          ) : 'Contribute'}
                        </button>
                        <button
                          onClick={() => setDonatingTo(null)}
                          disabled={processingDonation}
                          className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { 
                        setDonatingTo(project.id); 
                        setDonationAmount(''); 
                        setDonationStatus(null); 
                      }}
                      disabled={!isConnected}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-full font-medium disabled:opacity-40 transition-all duration-200 hover:shadow-lg"
                    >
                      {isConnected ? 'Contribute' : 'Connect to Contribute'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-4">No Active Initiatives</h3>
              <p className="text-gray-400">Community projects will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
