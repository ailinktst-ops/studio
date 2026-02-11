
"use client";

import { useState, useEffect } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Trophy, Medal, Star, Flame, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function RankingBoard({ overlay = false }: { overlay?: boolean }) {
  const { data, loading, isInitializing } = useCounter();
  const [currentRaffleName, setCurrentRaffleName] = useState("");
  const [showWinner, setShowWinner] = useState(false);

  // Lógica da animação do sorteio sincronizada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let winnerTimeout: NodeJS.Timeout;

    if (data.raffle?.isRaffling) {
      setShowWinner(false);
      const candidates = data.raffle.candidates || [];
      
      if (candidates.length > 0) {
        let i = 0;
        interval = setInterval(() => {
          setCurrentRaffleName(candidates[i % candidates.length]);
          i++;
        }, 100);

        // Após 5 segundos de "giro", mostra o vencedor
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

    return () => {
      if (interval) clearInterval(interval);
      if (winnerTimeout) clearTimeout(winnerTimeout);
    };
  }, [data.raffle?.isRaffling, data.raffle?.winnerId, data.participants, data.raffle?.candidates]);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="relative">
          <Loader2 className="h-20 w-20 text-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-white/40 font-bold uppercase tracking-widest animate-pulse">
          Sincronizando Ranking...
        </p>
      </div>
    );
  }

  const sortedParticipants = [...(data?.participants || [])].sort((a, b) => b.count - a.count);
  const top3 = sortedParticipants.slice(0, 3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-20 h-20 text-yellow-400 animate-float drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />;
      case 1: return <Medal className="w-16 h-16 text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.3)]" />;
      case 2: return <Medal className="w-16 h-16 text-amber-700 drop-shadow-[0_0_10px_rgba(120,53,15,0.3)]" />;
      default: return null;
    }
  };

  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: return "border-yellow-400/50 scale-110 z-20 ranking-card-glow-0 bg-yellow-400/10";
      case 1: return "border-zinc-300/30 ranking-card-glow-1 bg-zinc-300/5";
      case 2: return "border-amber-700/30 ranking-card-glow-2 bg-amber-700/5";
      default: return "";
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center w-full transition-all duration-1000 relative",
      overlay ? "bg-transparent min-h-screen justify-center p-12 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12"
    )}>
      
      {/* Raffle Overlay Animation */}
      {data.raffle?.isRaffling && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500">
          <div className="relative mb-12">
            <Sparkles className="w-32 h-32 text-yellow-500 animate-pulse" />
            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
          </div>
          
          <h2 className="text-4xl font-black italic text-white/60 uppercase tracking-widest mb-8">
            {showWinner ? "🏆 O Vencedor do Sorteio é:" : "🎰 Sorteando entre o Top 6..."}
          </h2>

          <div className={cn(
            "text-[10rem] md:text-[12rem] font-black italic uppercase tracking-tighter leading-none transition-all duration-300 px-4 break-words",
            showWinner ? "text-yellow-400 scale-110 drop-shadow-[0_0_50px_rgba(250,204,21,0.8)]" : "text-white/90"
          )}>
            {currentRaffleName || "..."}
          </div>

          {showWinner && (
            <div className="mt-12 animate-bounce">
              <span className="bg-yellow-500 text-black px-10 py-4 rounded-full font-black text-3xl uppercase italic shadow-[0_0_30px_rgba(234,179,8,0.6)]">
                Parabéns, lenda!
              </span>
            </div>
          )}
        </div>
      )}

      <div className="text-center space-y-4 mb-8">
        <h1 className={cn(
          "font-black italic text-white uppercase tracking-tighter transition-all duration-700 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]",
          overlay ? "text-7xl md:text-9xl" : "text-5xl md:text-6xl"
        )}>
          {data.title}
        </h1>
        <div className="h-2 w-48 bg-gradient-to-r from-primary via-secondary to-primary mx-auto rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-end max-w-5xl">
        {top3.length > 0 ? (
          // Ordem visual: 2º (esquerda), 1º (centro), 3º (direita)
          [1, 0, 2].map((actualIndex) => {
            const participant = top3[actualIndex];
            if (!participant) return <div key={actualIndex} className="hidden md:block" />;
            
            return (
              <Card 
                key={participant.id} 
                className={cn(
                  "relative overflow-hidden transition-all duration-700 transform border-2 glass",
                  getRankStyles(actualIndex),
                  actualIndex === 0 ? "order-1 md:order-2" : actualIndex === 1 ? "order-2 md:order-1" : "order-3 md:order-3"
                )}
              >
                <CardContent className="pt-12 pb-14 flex flex-col items-center space-y-8">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Star className="w-40 h-40" />
                  </div>
                  
                  <div className="relative">
                    {getRankIcon(actualIndex)}
                    <div className="absolute -bottom-3 -right-3 bg-background border-2 border-primary rounded-full w-12 h-12 flex items-center justify-center font-black text-2xl italic text-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                      {actualIndex + 1}
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter truncate w-full px-4">
                      {participant.name}
                    </h2>
                    <div className="flex justify-center">
                      <span className="text-[10px] font-bold text-secondary-foreground bg-secondary/20 px-3 py-1 rounded-full border border-secondary/30 uppercase tracking-widest">
                        {participant.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-8xl font-black text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                      {participant.count}
                    </span>
                    <span className="text-white/40 font-bold uppercase text-xs tracking-[0.2em] mt-2">
                      Unidades
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center">
            <p className="text-4xl font-black italic text-white/10 uppercase tracking-[0.3em] animate-pulse">
              Aguardando os Primeiros Goles...
            </p>
          </div>
        )}
      </div>

      {overlay && top3.length > 0 && (
        <div className="fixed bottom-12 left-0 right-0 flex justify-center">
          <div className="bg-black/80 backdrop-blur-xl px-10 py-4 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
            <span className="text-white/80 text-lg font-black italic uppercase tracking-[0.2em]">
              Feed Ao Vivo • RankUp Counter
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
