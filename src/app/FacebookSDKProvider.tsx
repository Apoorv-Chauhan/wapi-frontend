/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Script from "next/script";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useAppSelector } from "../redux/hooks";

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

const FacebookContext = createContext<boolean>(false);

export const useFacebookReady = () => useContext(FacebookContext);

export default function FacebookSDKProvider({ children }: { children: ReactNode }) {
  const { setting } = useAppSelector((state) => state.setting);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('🔍 FacebookSDK Debug:', { 
      hasAppId: !!setting?.app_id, 
      appId: setting?.app_id,
      hasFB: !!window.FB,
      ready 
    });

    if (!setting?.app_id) {
      console.log('⚠️ No app_id in settings');
      return;
    }

    // If FB is already loaded and initialized, mark ready immediately
    if (window.FB) {
      console.log('✅ FB already loaded, marking ready');
      setReady(true);
      return;
    }

    // Set up the async init callback — called by the SDK once it loads
    window.fbAsyncInit = function () {
      console.log('✅ FB SDK loaded, initializing...');
      window.FB.init({
        appId: setting.app_id,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      console.log('✅ FB SDK ready');
      setReady(true);
    };
  }, [setting?.app_id, ready]);

  // Log when script should be loaded
  if (setting?.app_id && !window.FB) {
    console.log('📥 Loading FB SDK script...');
  }

  return (
    <FacebookContext.Provider value={ready}>
      {setting?.app_id && !window.FB && (
        <Script id="facebook-sdk" src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" />
      )}
      {children}
    </FacebookContext.Provider>
  );
}
