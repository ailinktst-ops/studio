"use client";

import { useEffect, useState } from 'react';
import { Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CadastroQrPage() {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const formatUrlWithCorrectPort = (path: string) => {
    if (typeof window === 'undefined') return path;
    let origin = window.location.origin;
    if (origin.includes("cloudworkstations.dev")) {
      origin = origin.replace(/https?:\/\/(\d+)-/, (match, port) => match.replace(port, '9000'));
    } else if (origin.includes("localhost")) {
      origin = "http://localhost:9000";
    }
    return `${origin}${path}`;
  };

  useEffect(() => {
    const origin = formatUrlWithCorrectPort('');
    const url = `${origin}/cadastro`;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`);
  }, []);

  const copyLink = () => {
    const url = formatUrlWithCorrectPort('/cadastro');
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 space-y-4 select-none overflow-hidden border-2 border-white/5">
      <div className="text-center">
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">QR CADASTRO</h1>
      </div>

      <div className="p-3 bg-white rounded-2xl shadow-2xl">
        {qrUrl ? (
          <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
        ) : (
          <div className="w-40 h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <Button 
        onClick={copyLink}
        size="sm"
        className="w-full h-9 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-widest rounded-lg border border-white/10"
      >
        {copied ? "COPIADO!" : "COPIAR LINK"}
      </Button>
      
      <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">RankUp Counter</p>
    </div>
  );
}
