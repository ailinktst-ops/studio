
"use client";

import { useCounter } from '@/hooks/useCounter';
import { Trophy, Medal, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function RankingBoard({ overlay = false }: { overlay?: boolean }) {
  const { data, loading } = useCounter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sortedParticipants = [...data.participants].sort((a, b) => b.count - a.count);
  const top3 = sortedParticipants.slice(0, 3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-10 h-10 text-yellow-500" />;
      case 1: return <Medal className="w-8 h-8 text-gray-400" />;
      case 2: return <Medal className="w-8 h-8 text-amber-600" />;
      default: return null;
    }
  };

  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: return "border-yellow-500 shadow-yellow-100 scale-110 z-10 bg-yellow-50/50";
      case 1: return "border-gray-400 shadow-gray-100";
      case 2: return "border-amber-600 shadow-amber-100";
      default: return "";
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center w-full max-w-4xl mx-auto space-y-12 p-8 transition-all duration-1000",
      overlay ? "bg-transparent h-screen justify-center" : ""
    )}>
      <div className="text-center space-y-4">
        <h1 className={cn(
          "font-headline font-bold text-primary transition-all duration-700",
          overlay ? "text-6xl uppercase tracking-widest" : "text-4xl"
        )}>
          {data.title}
        </h1>
        <div className="h-1 w-24 bg-secondary mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {top3.length > 0 ? (
          top3.map((participant, index) => (
            <Card 
              key={participant.id} 
              className={cn(
                "relative overflow-hidden transition-all duration-500 transform hover:-translate-y-2",
                getRankStyles(index)
              )}
            >
              <CardContent className="pt-8 pb-10 flex flex-col items-center space-y-4">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Star className="w-20 h-20" />
                </div>
                
                <div className="p-3 rounded-full bg-white shadow-md border border-muted">
                  {getRankIcon(index)}
                </div>

                <div className="text-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                    #{index + 1} Lugar
                  </span>
                  <h2 className="text-2xl font-bold font-headline text-foreground">
                    {participant.name}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-5xl font-black font-headline text-primary">
                    {participant.count}
                  </span>
                  <span className="text-muted-foreground font-medium uppercase text-xs">
                    unidades
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <p className="text-xl italic">Aguardando participantes...</p>
          </div>
        )}
      </div>

      {overlay && top3.length > 0 && (
        <div className="fixed bottom-10 text-muted-foreground text-sm font-medium animate-pulse">
          RankUp Counter • Live Feed
        </div>
      )}
    </div>
  );
}
