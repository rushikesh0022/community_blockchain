import { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { writeContract } from '@wagmi/core';
import { AppContext } from './_app';
import { getAllDisasters, Disaster, formatFunds, shortenAddress } from '@/utils';
import { wagmiConfig } from '@/config';
import disasterFundPoolAbi from '../../public/DisasterFundPool.json';
import { Loader } from '@/components/Loader';
import { Toaster } from '@/components/Toaster';

const HARDCODED_OWNER_ADDRESS = "0xF0f5A871c46f798785B93301c0cd5C0706CccD31"; // Hardcoded owner address

export default function Admin() {
  const { isConnected, address } = useAccount();
  const { isTestMode } = useContext(AppContext);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loadingDisasters, setLoadingDisasters] = useState<boolean>(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingTx, setProcessingTx] = useState<boolean>(false);

  // Form state
  const [disasterName, setDisasterName] = useState('');
  const [disasterDesc, setDisasterDesc] = useState('');
  const [disasterPincode, setDisasterPincode] = useState('');
  const [disasterFundAmount, setDisasterFundAmount] = useState('');

  // Check access based on hardcoded owner address
  useEffect(() => {
    if (isConnected && address) {
      setIsOwner(address.toLowerCase() === HARDCODED_OWNER_ADDRESS.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [isConnected, address]);

  // Fetch all disasters if owner
  useEffect(() => {
    if (isOwner) {
      setLoadingDisasters(true);
      getAllDisasters(isTestMode)
        .then(setDisasters)
        .catch((error) => {
          console.error("Error fetching disasters:", error);
          setStatus({ type: 'error', message: 'Failed to load disasters.' });
        })
        .finally(() => setLoadingDisasters(false));
    }
  }, [isOwner, isTestMode]);

  const handleRegisterDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disasterName || !disasterPincode || !disasterFundAmount) {
      setStatus({ type: 'error', message: 'Please fill all required fields.' });
      return;
    }
    setProcessingTx(true);
    setStatus(null);

    try {
      const fundAmountWei = ethers.parseEther(disasterFundAmount);
      const pincodeNum = parseInt(disasterPincode, 10);

      if (isNaN(pincodeNum) || pincodeNum <= 0) {
         throw new Error("Invalid Pincode.");
      }

      const tx = await writeContract(wagmiConfig, {
        abi: disasterFundPoolAbi.abi,
        address: `0x${
          isTestMode
            ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD
        }`,
        functionName: 'registerDisaster',
        args: [disasterName, disasterDesc, pincodeNum, fundAmountWei],
        value: fundAmountWei, // Send ETH along with the transaction
      });

      setStatus({ type: 'success', message: `Disaster registered! Tx: ${tx}` });
      // Reset form and refetch disasters
      setDisasterName('');
      setDisasterDesc('');
      setDisasterPincode('');
      setDisasterFundAmount('');
      getAllDisasters(isTestMode)
        .then((updatedDisasters) => {
          setDisasters(updatedDisasters); // Force re-render by updating state
        });

    } catch (error: any) {
      console.error("Error registering disaster:", error);
      setStatus({ type: 'error', message: error.shortMessage || error.message || 'Failed to register disaster.' });
    } finally {
      setProcessingTx(false);
    }
  };

  const handleSetStatus = async (disasterId: number, newStatus: boolean) => {
    setProcessingTx(true);
    setStatus(null);

    try {
      const tx = await writeContract(wagmiConfig, {
        abi: disasterFundPoolAbi.abi,
        address: `0x${
          isTestMode
            ? process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_DISASTER_FUND_POOL_ADDRESS_PROD
        }`,
        functionName: 'setDisasterStatus',
        args: [disasterId, newStatus],
      });

      setStatus({ type: 'success', message: `Disaster status updated! Tx: ${tx}` });
      // Refetch disasters
      getAllDisasters(isTestMode).then(setDisasters);

    } catch (error: any) {
      console.error("Error setting disaster status:", error);
      setStatus({ type: 'error', message: error.shortMessage || error.message || 'Failed to update status.' });
    } finally {
      setProcessingTx(false);
    }
  };


  if (!isConnected) {
     return <div className="text-center py-10">Please connect your wallet.</div>;
  }

  // Directly check against the hardcoded address
  if (!isOwner) {
    return <div className="text-center py-10 text-red-600">Access Denied. Only the contract owner ({shortenAddress(HARDCODED_OWNER_ADDRESS)}) can access this page.</div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 font-rajdhani">Admin Panel</h1>

      {status && <Toaster type={status.type} message={status.message} />}

      {/* Register New Disaster Form */}
      <section className="mb-12 p-6 border rounded-lg shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-4 font-rajdhani">Register New Disaster</h2>
        <form onSubmit={handleRegisterDisaster} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name*</label>
            <input type="text" id="name" value={disasterName} onChange={(e) => setDisasterName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" value={disasterDesc} onChange={(e) => setDisasterDesc(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div>
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode*</label>
            <input type="number" id="pincode" value={disasterPincode} onChange={(e) => setDisasterPincode(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="fundAmount" className="block text-sm font-medium text-gray-700">Initial Fund Amount (ETH)*</label>
            <input type="number" step="any" id="fundAmount" value={disasterFundAmount} onChange={(e) => setDisasterFundAmount(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <button type="submit" disabled={processingTx} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {processingTx ? <Loader /> : 'Register Disaster'}
          </button>
        </form>
      </section>

      {/* Manage Existing Disasters */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 font-rajdhani">Manage Disasters</h2>
        {loadingDisasters ? <Loader /> : (
          <div className="space-y-4">
            {disasters.length > 0 ? disasters.map(d => (
              <div key={d.id} className="p-4 border rounded-lg shadow-sm bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{d.name} (ID: {d.id})</h3>
                  <p className="text-sm text-gray-600">Pincode: {d.pincode}</p>
                  <p className="text-sm text-gray-600">Funds: {formatFunds(d.totalFunds)} / Claimed: {formatFunds(d.claimedFunds)}</p>
                </div>
                <button
                  onClick={() => handleSetStatus(d.id, !d.active)}
                  disabled={processingTx}
                  className={`py-1 px-3 rounded-md text-sm font-medium text-white disabled:opacity-50 ${d.active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {processingTx ? <Loader /> : (d.active ? 'Deactivate' : 'Activate')}
                </button>
              </div>
            )) : <p>No disasters found.</p>}
          </div>
        )}
      </section>
    </main>
  );
}
