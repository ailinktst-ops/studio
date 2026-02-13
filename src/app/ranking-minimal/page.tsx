"use client";

import { useCounter } from "@/hooks/useCounter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function RankingMinimalPage() {
  const { data, isInitializing } = useCounter();

  // Forçar fundo totalmente transparente apenas para esta página
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    // Salva os estilos originais para restaurar se necessário (embora esta janela costume ser fechada)
    const originalHtmlBg = html.style.background;
    const originalBodyBg = body.style.background;
    const originalBodyBgImage = body.style.backgroundImage;

    // Aplica transparência total com prioridade
    html.style.setProperty('background', 'transparent', 'important');
    body.style.setProperty('background', 'transparent', 'important');
    body.style.setProperty('background-image', 'none', 'important');
    body.style.setProperty('background-color', 'transparent', 'important');

    return () => {
      html.style.background = originalHtmlBg;
      body.style.background = originalBodyBg;
      body.style.backgroundImage = originalBodyBgImage;
    };
  }, []);

  const sortedParticipants = useMemo(() => {
    return [...(data.participants || [])]
      .filter(p => p.status === 'approved')
      .sort((a, b) => b.count - a.count);
  }, [data.participants]);

  const getParticipantAvatar = (p: any) => {
    if (p.imageUrl) return p.imageUrl;
    // Semente consistente para personagens variados
    return `https://picsum.photos/seed/${p.id}-character-movie-drawing-anime-portrait-face/200/200`;
  };

  if (isInitializing) {
    return (
      <div className="p-4 bg-transparent">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 flex flex-col gap-2 w-64 select-none overflow-hidden">
      {sortedParticipants.map((p, i) => (
        <div 
          key={p.id} 
          className="flex items-center gap-3 bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 animate-in slide-in-from-left duration-500 shadow-2xl" 
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
            <p className="text-white font-black italic uppercase text-[11px] truncate tracking-tighter leading-none mb-1">
              {p.name}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-primary font-black text-lg leading-none drop-shadow-md">
                {p.count}
              </span>
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest truncate">
                {p.category}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
