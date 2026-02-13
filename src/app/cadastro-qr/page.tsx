
"use client";

import { useEffect, useState } from 'react';
import { Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 space-y-8 select-none overflow-hidden">
      <div className="text-center space-y-2">
        <div className="bg-secondary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary/20">
          <Smartphone className="w-10 h-10 text-secondary" />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">QR CADASTRO</h1>
        <p className="text-[10px] font-bold uppercase text-white/40 tracking-[0.3em]">Aponte a câmera para participar</p>
      </div>

      <div className="p-6 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-in zoom-in duration-300">
        {qrUrl ? (
          <img src={qrUrl} alt="QR Code" className="w-64 h-64" />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <Button 
        onClick={copyLink}
        className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-widest rounded-xl border border-white/10 transition-all active:scale-95"
      >
        {copied ? (
          <><Check className="w-5 h-5 mr-2 text-green-500" /> Copiado!</>
        ) : (
          <><Copy className="w-5 h-5 mr-2" /> Copiar Link</>
        )}
      </Button>
      
      <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.5em]">RankUp Counter • Independente</p>
    </div>
  );
}
