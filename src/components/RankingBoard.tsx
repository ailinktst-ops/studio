
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

  const sortedParticipants = [...data.participants].sort((a, b) => b.count - a.count);
  const top3 = sortedParticipants.slice(0, 3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-14 h-14 text-yellow-400 animate-float" />;
      case 1: return <Medal className="w-12 h-12 text-zinc-300" />;
      case 2: return <Medal className="w-12 h-12 text-amber-700" />;
      default: return null;
    }
  };

  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: return "border-yellow-400/30 scale-110 z-20 ranking-card-glow-0 bg-yellow-400/5";
      case 1: return "border-zinc-300/30 ranking-card-glow-1 bg-zinc-300/5";
      case 2: return "border-amber-700/30 ranking-card-glow-2 bg-amber-700/5";
      default: return "";
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center w-full max-w-6xl mx-auto space-y-12 transition-all duration-1000",
      overlay ? "bg-transparent h-screen justify-center p-12" : "p-8"
    )}>
      <div className="text-center space-y-2">
        <h1 className={cn(
          "font-black italic text-white uppercase tracking-tighter transition-all duration-700 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]",
          overlay ? "text-8xl" : "text-5xl"
        )}>
          {data.title}
        </h1>
        <div className="h-2 w-40 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full items-end">
        {top3.length > 0 ? (
          // Reorder for visual hierarchy: 2, 1, 3
          [top3[1], top3[0], top3[2]].map((participant, visualIndex) => {
            if (!participant) return <div key={visualIndex} className="hidden md:block" />;
            
            // Map visual index back to actual rank index
            const actualIndex = visualIndex === 1 ? 0 : visualIndex === 0 ? 1 : 2;
            
            return (
              <Card 
                key={participant.id} 
                className={cn(
                  "relative overflow-hidden transition-all duration-700 transform border-2 backdrop-blur-md",
                  getRankStyles(actualIndex),
                  actualIndex === 0 ? "order-2" : actualIndex === 1 ? "order-1" : "order-3"
                )}
              >
                <CardContent className="pt-10 pb-12 flex flex-col items-center space-y-6">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Star className="w-32 h-32" />
                  </div>
                  
                  <div className="relative">
                    {getRankIcon(actualIndex)}
                    <div className="absolute -bottom-2 -right-2 bg-background border border-white/10 rounded-full w-10 h-10 flex items-center justify-center font-black text-xl italic text-primary">
                      {actualIndex + 1}
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
                      {participant.name}
                    </h2>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 block border-t border-white/5 pt-2">
                      {participant.category}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-7xl font-black text-primary drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      {participant.count}
                    </span>
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                      Unidades Consumidas
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-3xl font-black italic text-white/20 uppercase tracking-widest">Aguardando Rodada...</p>
          </div>
        )}
      </div>

      {overlay && top3.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white/60 text-sm font-black italic uppercase tracking-widest">
              Live Ranking Feed • RankUp Counter
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
