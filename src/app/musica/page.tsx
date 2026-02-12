
"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Music, Send, Loader2, Disc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function MusicaPage() {
  const { data, sendMusicRequest, isInitializing } = useCounter();
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (artist.trim() && song.trim()) {
      sendMusicRequest(artist.trim(), song.trim());
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setArtist("");
        setSong("");
      }, 3000);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Music className="w-10 h-10 text-blue-500 animate-bounce" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Pedir <span className="text-blue-500">Música</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            {data.brandName} • O que quer ouvir?
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8">
            {sent ? (
              <div className="py-10 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Disc className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white">Pedido Enviado!</h3>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2">
                  Aguarde a aprovação para aparecer no telão
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Banda / Artista:</label>
                  <Input 
                    placeholder="Quem canta?" 
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Música:</label>
                  <Input 
                    placeholder="Qual o nome da música?" 
                    value={song}
                    onChange={(e) => setSong(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 font-bold"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!artist || !song}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-black italic uppercase tracking-tighter rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  <Send className="w-5 h-5 mr-2" /> Pedir para o Telão
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <footer className="text-center">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} {data.brandName}
          </p>
        </footer>
      </div>
    </div>
  );
}
