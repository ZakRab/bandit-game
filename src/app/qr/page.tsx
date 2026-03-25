"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export default function QRPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    // Use current origin, or override with env var
    setUrl(process.env.NEXT_PUBLIC_GAME_URL || window.location.origin);
  }, []);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8">
      <h1 className="text-4xl font-bold mb-2">Scan to Play</h1>
      <p className="text-xl text-gray-500 mb-8">Multi-Armed Bandits: Network Builder</p>
      <QRCodeSVG value={url} size={400} level="H" includeMargin />
      <p className="mt-6 text-lg text-gray-400 font-mono">{url}</p>
    </div>
  );
}
