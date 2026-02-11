
"use client";

import { useCounter } from '@/hooks/useCounter';
import { Trophy, Medal, Star, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function RankingBoard({ overlay = false }: { overlay?: boolean }) {
  const { data, loading } = useCounter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-t-4 border-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
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
      "flex flex-col items-center w-full transition-all duration-1000",
      overlay ? "bg-transparent min-h-screen justify-center p-12 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12"
    )}>
      <div className="text-center space-y-4 mb-8">
        <h1 className={cn(
          "font-black italic text-white uppercase tracking-tighter transition-all duration-700 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]",
          overlay ? "text-9xl" : "text-6xl"
        )}>
          {data.title}
        </h1>
        <div className="h-2 w-48 bg-gradient-to-r from-primary via-secondary to-primary mx-auto rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-end">
        {top3.length > 0 ? (
          // Ordem visual: 2º, 1º, 3º
          [top3[1], top3[0], top3[2]].map((participant, visualIndex) => {
            if (!participant) return <div key={visualIndex} className="hidden md:block" />;
            
            // Mapear índice visual de volta para o rank real (0 = 1º, 1 = 2º, 2 = 3º)
            const actualIndex = visualIndex === 1 ? 0 : visualIndex === 0 ? 1 : 2;
            
            return (
              <Card 
                key={participant.id} 
                className={cn(
                  "relative overflow-hidden transition-all duration-700 transform border-2 glass",
                  getRankStyles(actualIndex),
                  actualIndex === 0 ? "md:order-2" : actualIndex === 1 ? "md:order-1" : "md:order-3"
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
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
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
