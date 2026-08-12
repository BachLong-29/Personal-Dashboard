'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

import { clientEnv } from '@/configs/env';

import { useGoogleLogin } from '../hooks/useGoogleLogin';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * Renders Google's own "Sign in with Google" button (branding rules forbid a
 * custom-styled one) inside the app's `.auth-stone` slot. Hidden entirely when
 * `NEXT_PUBLIC_GOOGLE_CLIENT_ID` isn't configured, so the rest of auth keeps
 * working before Google OAuth credentials exist.
 */
export function GoogleSignInButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const googleLogin = useGoogleLogin();
  const clientId = clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptReady || !clientId || !containerRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => googleLogin.mutate(response.credential),
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'icon',
      shape: 'circle',
      theme: 'outline',
      size: 'large',
    });
    // googleLogin is a fresh useMutation object every render — only re-init on script load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, clientId]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="auth-stone stone-gold" aria-label="Continue with Google" />
    </>
  );
}
