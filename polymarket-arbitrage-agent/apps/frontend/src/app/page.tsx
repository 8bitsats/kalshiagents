"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { wsClient } from "@/lib/ws";
import { apiClient } from "@/lib/api";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  const { setState, setDecision, setSystemState, setWsConnected } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial state fetch
    apiClient.getState().then((systemState) => {
      setSystemState(systemState);
      setState(systemState.state);
      setLoading(false);
    });

    // WebSocket connection
    wsClient.connect();

    const unsubscribeTick = wsClient.onTick((msg) => {
      setState(msg.state);
      setDecision(msg.decision);
    });

    const unsubscribeConnect = wsClient.onConnect(() => {
      setWsConnected(true);
    });

    const unsubscribeDisconnect = wsClient.onDisconnect(() => {
      setWsConnected(false);
    });

    // Poll for system state updates every 5 seconds
    const pollInterval = setInterval(() => {
      apiClient.getState().then(setSystemState);
    }, 5000);

    return () => {
      unsubscribeTick();
      unsubscribeConnect();
      unsubscribeDisconnect();
      clearInterval(pollInterval);
      wsClient.disconnect();
    };
  }, [setState, setDecision, setSystemState, setWsConnected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary text-text-primary">
        <div className="text-center">
          <div className="text-accent-blue text-2xl mb-4">Loading...</div>
          <div className="text-text-dim">Connecting to backend...</div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

