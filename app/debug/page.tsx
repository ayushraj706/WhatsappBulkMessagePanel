"use client";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [info, setInfo] = useState({
    permission: "Checking...",
    swActive: "Checking...",
    subscription: "None",
  });

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Permission Check
      const perm = Notification.permission;
      
      // 2. Service Worker Check
      const reg = await navigator.serviceWorker.ready;
      const swStatus = reg.active ? "Active ✅" : "Not Active ❌";

      // 3. Subscription Check
      const sub = await reg.pushManager.getSubscription();
      
      setInfo({
        permission: perm,
        swActive: swStatus,
        subscription: sub ? JSON.stringify(sub, null, 2) : "Token Nahi Mila ❌",
      });
    };
    checkStatus();
  }, []);

  return (
    <div className="p-6 bg-black text-white min-h-screen font-mono text-sm">
      <h1 className="text-xl font-bold text-green-500 mb-4">BaseKey System Check</h1>
      
      <div className="space-y-4">
        <div className="border border-zinc-800 p-3 rounded">
          <p className="text-zinc-500">Notification Permission:</p>
          <p className={info.permission === "granted" ? "text-green-400" : "text-red-400"}>
            {info.permission}
          </p>
        </div>

        <div className="border border-zinc-800 p-3 rounded">
          <p className="text-zinc-500">Service Worker Status:</p>
          <p>{info.swActive}</p>
        </div>

        <div className="border border-zinc-800 p-3 rounded overflow-hidden">
          <p className="text-zinc-500">Push Token (Firebase Data):</p>
          <pre className="text-[10px] whitespace-pre-wrap break-all bg-zinc-900 p-2 mt-2">
            {info.subscription}
          </pre>
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="mt-6 w-full bg-blue-600 py-3 rounded-lg font-bold"
      >
        Refresh Check
      </button>
    </div>
  );
}
