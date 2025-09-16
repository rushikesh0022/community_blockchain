import { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { writeContract } from '@wagmi/core';
import { LaunchProveModal, useAnonAadhaar } from "@anon-aadhaar/react";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { AppContext } from './_app';
import { getAllDisasters, Disaster, formatFunds, cleanupProvider, shortenAddress } from '@/utils';
import { wagmiConfig } from '@/config';
import disasterFundPoolAbi from '../../public/DisasterFundPool.json';
import { Loader } from '@/components/Loader';
import { Toaster } from '@/components/Toaster';

const HARDCODED_OWNER_ADDRESS = "0xF0f5A871c46f798785B93301c0cd5C0706CccD31"; // Hardcoded owner address

export default function Admin() {
  const { isConnected, address } = useAccount();
  const [anonAadhaar] = useAnonAadhaar();
  const { open } = useWeb3Modal();
  const { isTestMode } = useContext(AppContext);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [projects, setProjects] = useState<Disaster[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingTx, setProcessingTx] = useState<boolean>(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPincode, setProjectPincode] = useState('');
  const [projectFundAmount, setProjectFundAmount] = useState('');

  // Check access based on hardcoded owner address only
  useEffect(() => {
    if (isConnected && address) {
      setIsOwner(address.toLowerCase() === HARDCODED_OWNER_ADDRESS.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [isConnected, address]);

  // Cleanup provider when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      cleanupProvider();
      setProjects([]);
      setLoadingProjects(false);
    }
  }, [isConnected]);

  // Fetch all projects if owner (Aadhaar not required for admin)
  useEffect(() => {
    if (isOwner && isConnected) {
      setLoadingProjects(true);
      getAllDisasters(isTestMode)
        .then(setProjects)
        .catch((error) => {
          console.error("Error fetching projects:", error);
          setStatus({ type: 'error', message: 'Failed to load projects.' });
        })
        .finally(() => setLoadingProjects(false));
    }
  }, [isOwner, isTestMode, isConnected]);

  const handleRegisterProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectPincode || !projectFundAmount) {
      setStatus({ type: 'error', message: 'Please fill all required fields.' });
      return;
    }
    setProcessingTx(true);
    setStatus(null);

    try {
      const fundAmountWei = ethers.parseEther(projectFundAmount);
      const pincodeNum = parseInt(projectPincode, 10);

      if (isNaN(pincodeNum) || pincodeNum <= 0) {
         throw new Error("Invalid Pincode.");
      }

      const tx = await writeContract(wagmiConfig, {
        abi: disasterFundPoolAbi.abi,
        address: (
          isTestMode
            ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD
        ) as `0x${string}`,
        functionName: 'registerDisaster',
        args: [projectName, projectDesc, pincodeNum, fundAmountWei],
        value: fundAmountWei, // Send ETH along with the transaction
      });

      setStatus({ type: 'success', message: `Community project registered! Tx: ${tx}` });
      // Reset form and refetch projects
      setProjectName('');
      setProjectDesc('');
      setProjectPincode('');
      setProjectFundAmount('');
      getAllDisasters(isTestMode)
        .then((updatedProjects) => {
          setProjects(updatedProjects); // Force re-render by updating state
        });

    } catch (error: any) {
      console.error("Error registering project:", error);
      setStatus({ type: 'error', message: error.shortMessage || error.message || 'Failed to register project.' });
    } finally {
      setProcessingTx(false);
    }
  };

  const handleSetStatus = async (projectId: number, newStatus: boolean) => {
    setProcessingTx(true);
    setStatus(null);

    try {
      const tx = await writeContract(wagmiConfig, {
        abi: disasterFundPoolAbi.abi,
        address: (
          isTestMode
            ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD
        ) as `0x${string}`,
        functionName: 'setDisasterStatus',
        args: [projectId, newStatus],
      });

      setStatus({ type: 'success', message: `Project status updated! Tx: ${tx}` });
      // Refetch projects
      getAllDisasters(isTestMode).then(setProjects);

    } catch (error: any) {
      console.error("Error setting project status:", error);
      setStatus({ type: 'error', message: error.shortMessage || error.message || 'Failed to update status.' });
    } finally {
      setProcessingTx(false);
    }
  };


  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-8">Access the community management panel</p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-light shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            onClick={() => open()}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-400">Administrator access only</p>
          <p className="text-sm text-gray-300 mt-2">{shortenAddress(HARDCODED_OWNER_ADDRESS)}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Minimalist Header */}
        <div className="mb-16">
          <h1 className="text-5xl font-extralight text-gray-900 mb-3 tracking-tight">
            Community
          </h1>
          <p className="text-lg text-gray-400 font-light">
            Transparent funding for local initiatives
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`mb-12 p-6 rounded-2xl border-l-4 ${
            status.type === 'success' 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700' 
              : 'bg-rose-50 border-rose-400 text-rose-700'
          }`}>
            <p className="font-medium">{status.message}</p>
          </div>
        )}

        {/* Create Project Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-light text-gray-900 mb-8">New Initiative</h2>
          <form onSubmit={handleRegisterProject} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div>
                  <input 
                    type="text" 
                    value={projectName} 
                    onChange={(e) => setProjectName(e.target.value)} 
                    required 
                    className="w-full text-xl font-light border-0 border-b-2 border-gray-100 focus:border-blue-500 focus:ring-0 bg-transparent pb-3 placeholder-gray-300 transition-colors"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    value={projectPincode} 
                    onChange={(e) => setProjectPincode(e.target.value)} 
                    required 
                    className="w-full text-xl font-light border-0 border-b-2 border-gray-100 focus:border-blue-500 focus:ring-0 bg-transparent pb-3 placeholder-gray-300 transition-colors"
                    placeholder="Area code"
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    step="any" 
                    value={projectFundAmount} 
                    onChange={(e) => setProjectFundAmount(e.target.value)} 
                    required 
                    className="w-full text-xl font-light border-0 border-b-2 border-gray-100 focus:border-blue-500 focus:ring-0 bg-transparent pb-3 placeholder-gray-300 transition-colors"
                    placeholder="Initial funding (ETH)"
                  />
                </div>
              </div>
              
              <div>
                <textarea 
                  value={projectDesc} 
                  onChange={(e) => setProjectDesc(e.target.value)} 
                  rows={6} 
                  className="w-full text-lg font-light border-0 border-b-2 border-gray-100 focus:border-blue-500 focus:ring-0 bg-transparent pb-3 placeholder-gray-300 resize-none transition-colors"
                  placeholder="Describe your community initiative..."
                />
              </div>
            </div>
            
            <div className="pt-8">
              <button 
                type="submit" 
                disabled={processingTx} 
                className="px-12 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-40 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {processingTx ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Creating...
                  </div>
                ) : 'Create Initiative'}
              </button>
            </div>
          </form>
        </div>

        {/* Active Projects Section */}
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-8">Active Initiatives</h2>
          {loadingProjects ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.length > 0 ? projects.map(project => (
                <div key={project.id} className="group p-8 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{project.name}</h3>
                      {project.description && (
                        <p className="text-gray-500 mb-6 leading-relaxed">{project.description}</p>
                      )}
                      <div className="flex items-center space-x-8 text-sm text-gray-400">
                        <span>#{project.id}</span>
                        <span>Area {project.pincode}</span>
                        <span>{formatFunds(project.totalFunds)} ETH raised</span>
                        <span>{formatFunds(project.claimedFunds)} ETH distributed</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetStatus(project.id, !project.active)}
                      disabled={processingTx}
                      className={`ml-8 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-40 ${
                        project.active 
                          ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      }`}
                    >
                      {processingTx ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (project.active ? 'Pause' : 'Resume')}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No initiatives yet</h3>
                  <p className="text-gray-500">Create your first community initiative above</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
