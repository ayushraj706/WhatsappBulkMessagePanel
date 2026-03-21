"use client";
import { useState } from "react";

export default function TestPush() {
  const [status, setStatus] = useState("Ready");

  const sendTest = async () => {
    setStatus("Bhej raha hoon...");
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        body: JSON.stringify({
          entry: [{
            changes: [{
              value: {
                messages: [{
                  from: "919999999999",
                  text: { body: "Bhai, ye Test Notification hai! 🔥" },
                  type: "text"
                }],
                contacts: [{ profile: { name: "Test Sender" } }]
              }
            }]
          }]
        })
      });
      if(res.ok) setStatus("Server se nikal gaya! Ab phone check karo.");
      else setStatus("Server Error!");
    } catch (e) { setStatus("Error!"); }
  };

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-5">Push Notification Tester</h1>
      <button 
        onClick={sendTest}
        className="bg-blue-600 px-6 py-3 rounded-full font-bold active:scale-95 transition-all"
      >
        Test Notification Bhejo
      </button>
      <p className="mt-5 text-zinc-400">{status}</p>
    </div>
  );
}
