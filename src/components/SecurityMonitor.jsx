import React, { useEffect } from 'react';

// Client-side rate limiting state for AI Tutor requests
let apiCalls = 0;
let lastReset = Date.now();

export const checkAPIRateLimit = () => {
  const now = Date.now();
  if (now - lastReset > 60000) {
    apiCalls = 0;
    lastReset = now;
  }
  apiCalls++;
  if (apiCalls > 15) {
    console.warn("Rate limit exceeded: Too many AI requests in the last minute.");
    return false;
  }
  return true;
};

export default function SecurityMonitor({ children }) {
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.warn("Runtime exception captured by SecurityMonitor:", event?.message);
    };

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason ? event.reason.toString() : 'Unknown Promise Rejection';
      console.warn("Unhandled promise rejection:", reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}
