"use client";

import { useCounter } from "@/hooks/useCounter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

export default function RankingMinimalPage() {
  const { data, isInitializing } = useCounter();

  const sortedParticipants = useMemo(() => {
    return [...(data.participants || [])]
      .filter(p => p.status === 'approved')
      .sort((a, b) => b.count - a.count);
  }, [data.participants]);

  const getParticipantAvatar = (p: any) => {
    if (p.imageUrl) return p.imageUrl;
    return `https://picsum.photos/seed/${p.id}-character-movie-drawing-anime-portrait-face/200/200`;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col gap-3 w-full max-w-[320px] select-none overflow-hidden">
      <div className="mb-2">
        <h2 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] italic">
          Ranking <span className="text-primary">Elite</span>
        </h2>
      </div>
      
      {sortedParticipants.map((p, i) => (
        <div 
          key={p.id} 
          className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-white/10 animate-in slide-in-from-left duration-500 shadow-xl" 
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="relative">
            <Avatar className="w-12 h-12 border-2 border-primary/50 shadow-lg">
              <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
              <AvatarFallback className="bg-white/5 font-black uppercase text-xs">
                {p.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border border-white/20 shadow-md">
              {i + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black italic uppercase text-[12px] truncate tracking-tighter leading-none mb-1">
              {p.name}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-primary font-black text-xl leading-none drop-shadow-md">
                {p.count}
              </span>
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest truncate">
                {p.category}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {sortedParticipants.length === 0 && (
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 text-center">
          <p className="text-[10px] font-black text-white/20 uppercase italic tracking-widest">
            Aguardando Ranking...
          </p>
        </div>
      )}
    </div>
  );
}
