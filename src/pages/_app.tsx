import "@/styles/globals.css";
import Head from "next/head";
import { useState, useEffect, createContext } from "react";
import type { AppProps } from "next/app";
import { AnonAadhaarProvider } from "@anon-aadhaar/react";
import { Header } from "../components/Header";
import { WagmiProvider } from "wagmi";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../config";
import { cleanupProvider } from "@/utils";

const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId,
});

// Removed setVoted from AppContext
export const AppContext = createContext({
  isTestMode: false,
  setIsTestMode: (isTest: boolean) => {},
});

export default function App({ Component, pageProps }: AppProps) {
  // Removed isDisplayed and voted state
  const [ready, setReady] = useState(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    setReady(true);
    
    // Cleanup function when app unmounts
    return () => {
      cleanupProvider();
    };
  }, []);

  // Removed useEffect related to voted state

  return (
    <>
      <Head>
        <title>Community Fund Management</title>
        <meta property="og:title" content="Community Fund Management" key="title" />
        <meta
          property="og:image"
          content="https://anon-aadhaar-example.vercel.app/AnonAadhaarBanner.png"
          key="image"
        />
        <meta
          property="og:description"
          name="description"
          content="Anonymous community funding platform with zero-knowledge identity verification."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {ready ? (
        // Removed setVoted from AppContext provider value
        <AppContext.Provider
          value={{
            isTestMode,
            setIsTestMode,
          }}
        >
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <AnonAadhaarProvider _useTestAadhaar={isTestMode}>
                <div className="relative min-h-screen flex flex-col justify-between">
                  <div className="flex-grow">
                    <Header />
                    <Component {...pageProps} />
                  </div>
                  {/* Removed props passed to Footer */}
                </div>
              </AnonAadhaarProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </AppContext.Provider>
      ) : null}
    </>
  );
}
