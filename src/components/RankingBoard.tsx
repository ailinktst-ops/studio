
"use client";

import { useState, useEffect } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { 
  Trophy, Medal, Star, Flame, Sparkles, Loader2, 
  Beer, Wine, CupSoda, GlassWater, Music, Pizza 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Beer, Wine, CupSoda, GlassWater, Trophy, Star, Flame, Music, Pizza
};

const CryingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
    <path d="M9 11v2" className="animate-pulse" />
    <path d="M15 11v2" className="animate-pulse" />
  </svg>
);

export function RankingBoard({ overlay = false }: { overlay?: boolean }) {
  const { data, loading, isInitializing } = useCounter();
  const [currentRaffleName, setCurrentRaffleName] = useState("");
  const [showWinner, setShowWinner] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  const CustomIcon = ICON_MAP[data.brandIcon] || Beer;
  const brandImageUrl = data.brandImageUrl || "";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let winnerTimeout: NodeJS.Timeout;

    if (data.raffle?.isRaffling) {
      const candidates = data.raffle.candidates || [];
      if (candidates.length > 0) {
        let i = 0;
        interval = setInterval(() => {
          setCurrentRaffleName(candidates[i % candidates.length]);
          i++;
        }, 100);
        winnerTimeout = setTimeout(() => {
          clearInterval(interval);
          const winner = data.participants.find(p => p.id === data.raffle?.winnerId);
          if (winner) {
            setCurrentRaffleName(winner.name);
            setShowWinner(true);
          }
        }, 5000);
      }
    } else {
      setShowWinner(false);
      setCurrentRaffleName("");
    }
    return () => { if (interval) clearInterval(interval); if (winnerTimeout) clearTimeout(winnerTimeout); };
  }, [data.raffle?.isRaffling, data.raffle?.winnerId, data.participants]);

  useEffect(() => {
    if (!overlay) return;
    const totalPhrases = (data.customPhrases?.length || 0) + 1;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % totalPhrases);
    }, 6000);
    return () => clearInterval(interval);
  }, [overlay, data.customPhrases]);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader2 className="h-20 w-20 text-primary animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest">Sincronizando...</p>
      </div>
    );
  }

  const sortedParticipants = [...data.participants].sort((a, b) => b.count - a.count);
  const top3 = sortedParticipants.slice(0, 3);
  const leader = top3[0];
  
  const lanterninha = (sortedParticipants.length > 3 && sortedParticipants.length <= 6) 
    ? sortedParticipants[sortedParticipants.length - 1] 
    : null;

  return (
    <div className={cn("flex flex-col items-center w-full relative", overlay ? "bg-transparent min-h-screen justify-center p-12 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12")}>
      
      {data.raffle?.isRaffling && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500">
          <Star className="w-32 h-32 text-yellow-500 animate-pulse mb-8" />
          <h2 className="text-4xl font-black italic text-white/60 uppercase mb-8">{showWinner ? "🏆 O Vencedor é:" : "🎰 Sorteando entre o Top 6..."}</h2>
          <div className={cn("text-[10rem] font-black italic uppercase tracking-tighter transition-all", showWinner ? "text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.8)] scale-110" : "text-white")}>
            {currentRaffleName || "..."}
          </div>
        </div>
      )}

      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className={cn(
            "rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] overflow-hidden flex items-center justify-center w-12 h-12",
            brandImageUrl ? "p-0" : "p-2 bg-primary/20"
          )}>
            {brandImageUrl ? (
              <img src={brandImageUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <CustomIcon className="w-full h-full text-primary" />
            )}
          </div>
          <span className="text-xl font-black italic uppercase text-white/40 tracking-widest">{data.brandName}</span>
        </div>
        <h1 className={cn("font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]", overlay ? "text-6xl md:text-7xl" : "text-5xl md:text-6xl")}>
          {data.title}
        </h1>
        <div className="h-2 w-48 bg-gradient-to-r from-primary via-secondary to-primary mx-auto rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-end max-w-5xl mb-12">
        {[1, 0, 2].map((actualIndex) => {
          const p = top3[actualIndex];
          if (!p) return <div key={actualIndex} className="hidden md:block" />;
          return (
            <Card key={p.id} className={cn("relative overflow-hidden transition-all border-2 glass", actualIndex === 0 ? "border-yellow-400/50 scale-110 z-20 bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.3)] order-1 md:order-2" : actualIndex === 1 ? "border-zinc-300/30 bg-zinc-300/5 order-2 md:order-1" : "border-amber-700/30 bg-amber-700/5 order-3")}>
              <CardContent className="pt-12 pb-14 flex flex-col items-center space-y-8">
                <div className="relative">
                  {actualIndex === 0 ? <Trophy className="w-20 h-20 text-yellow-400 animate-float" /> : <Medal className={cn("w-16 h-16", actualIndex === 1 ? "text-zinc-300" : "text-amber-700")} />}
                  <div className="absolute -bottom-3 -right-3 bg-background border-2 border-primary rounded-full w-10 h-10 flex items-center justify-center font-black italic text-primary">{actualIndex + 1}</div>
                </div>
                <h2 className="text-4xl font-black italic text-white uppercase truncate px-4">{p.name}</h2>
                <div className="flex flex-col items-center">
                  <span className="text-8xl font-black text-primary">{p.count}</span>
                  <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">{p.category}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lanterninha && (
        <div className="w-full max-w-md bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-6 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            <CryingIcon className="w-10 h-10 text-destructive animate-pulse" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Lanterninha 🤡</span>
              <h3 className="text-2xl font-black italic text-white uppercase">{lanterninha.name}</h3>
            </div>
          </div>
          <span className="text-3xl font-black text-destructive">{lanterninha.count}</span>
        </div>
      )}

      {overlay && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4">
          <div className="bg-black/60 backdrop-blur-2xl px-12 py-4 rounded-full border border-white/10 flex items-center shadow-2xl min-w-[500px] justify-center overflow-hidden">
            <div className="relative h-6 w-full flex items-center justify-center">
              {data.customPhrases.map((phrase, i) => (
                <div key={i} className={cn("absolute transition-all duration-1000 transform", tickerIndex === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                  <span className="text-white/80 text-sm font-black italic uppercase tracking-[0.2em]">{phrase}</span>
                </div>
              ))}
              <div className={cn("absolute transition-all duration-1000 transform", tickerIndex === data.customPhrases.length ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                <span className="text-secondary text-sm font-black italic uppercase tracking-widest">
                  Liderança: <span className="text-white">{leader?.name || "---"}</span> com <span className="text-white">{leader?.count || 0}</span> pontos
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
