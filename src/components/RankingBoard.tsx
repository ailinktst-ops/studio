
"use client";

import { useState, useEffect, useRef } from 'react';
import { useCounter, Participant } from '@/hooks/useCounter';
import { 
  Trophy, Medal, Star, Flame, Sparkles, Loader2, 
  Beer, Wine, CupSoda, GlassWater, Music, Pizza, AlertCircle, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Beer, Wine, CupSoda, GlassWater, Trophy, Star, Flame, Music, Pizza
};

const SOUND_URLS = {
  point: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  leader: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  challenge: 'https://assets.mixkit.co/active_storage/sfx/950/950-preview.mp3' // Alarme de emergência
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
  
  const [notification, setNotification] = useState<{ 
    userName: string; 
    count: number; 
    type: 'point' | 'leader';
    title?: string;
  } | null>(null);
  
  const lastParticipantsRef = useRef<Participant[]>([]);
  const lastLeaderIdRef = useRef<string | null>(null);
  const challengeAudioRef = useRef<HTMLAudioElement | null>(null);

  const CustomIcon = ICON_MAP[data.brandIcon] || Beer;
  const brandImageUrl = data.brandImageUrl || "";

  const playSound = (type: 'point' | 'leader' | 'challenge') => {
    const audio = new Audio(SOUND_URLS[type]);
    if (type === 'challenge') {
      audio.loop = true;
      challengeAudioRef.current = audio;
    }
    audio.play().catch(() => {});
  };

  const stopChallengeSound = () => {
    if (challengeAudioRef.current) {
      challengeAudioRef.current.pause();
      challengeAudioRef.current = null;
    }
  };

  useEffect(() => {
    if (!overlay || data.participants.length === 0) return;

    if (lastParticipantsRef.current.length === 0) {
      lastParticipantsRef.current = data.participants;
      const initialSorted = [...data.participants].sort((a, b) => b.count - a.count);
      lastLeaderIdRef.current = initialSorted[0]?.id || null;
      return;
    }

    const prev = lastParticipantsRef.current;
    const current = data.participants;

    const updatedUser = current.find(p => {
      const prevP = prev.find(pp => pp.id === p.id);
      return prevP && p.count > prevP.count;
    });

    const sortedCurrent = [...current].sort((a, b) => b.count - a.count);
    const currentLeader = sortedCurrent[0];

    if (currentLeader && lastLeaderIdRef.current && currentLeader.id !== lastLeaderIdRef.current && currentLeader.count > 0) {
      playSound('leader');
      setNotification({
        userName: currentLeader.name,
        count: currentLeader.count,
        type: 'leader',
        title: "NOVO LÍDER!"
      });
      lastLeaderIdRef.current = currentLeader.id;
      setTimeout(() => setNotification(null), 5000);
    } else if (updatedUser) {
      playSound('point');
      setNotification({
        userName: updatedUser.name,
        count: updatedUser.count,
        type: 'point',
        title: "MAIS UMA PARA!"
      });
      setTimeout(() => setNotification(null), 3500);
    }

    lastParticipantsRef.current = current;
  }, [data.participants, overlay]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let winnerTimeout: NodeJS.Timeout;

    if (data.raffle?.isRaffling) {
      const candidates = data.raffle.candidates || [];
      const isChallenge = data.raffle.type === 'challenge';

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
            if (isChallenge) {
              playSound('challenge');
            } else {
              playSound('leader');
            }
          }
        }, 5000);
      }
    } else {
      setShowWinner(false);
      setCurrentRaffleName("");
      stopChallengeSound();
    }
    return () => { 
      if (interval) clearInterval(interval); 
      if (winnerTimeout) clearTimeout(winnerTimeout);
      stopChallengeSound();
    };
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
  
  const top6 = sortedParticipants.slice(0, 6);
  const lanterninha = (top6.length > 3) 
    ? top6[top6.length - 1] 
    : null;

  const isChallengeType = data.raffle?.type === 'challenge';
  const lastChallengedWinner = data.participants.find(p => p.id === data.raffle?.winnerId);
  const showPersistentChallenge = overlay && data.raffle?.type === 'challenge' && !data.raffle?.isRaffling && lastChallengedWinner;

  return (
    <div className={cn("flex flex-col items-center w-full relative", overlay ? "bg-transparent min-h-screen justify-center p-12 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12")}>
      
      {overlay && brandImageUrl && (
        <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
          <img src={brandImageUrl} alt="Watermark" className="w-[80vw] h-[80vh] object-contain grayscale blur-[2px] scale-125 rotate-[-15deg]" />
        </div>
      )}

      {/* Miniatura do Desafiado (Lado Direito) */}
      {showPersistentChallenge && (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[80] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-blue-600/90 backdrop-blur-xl border-4 border-blue-400 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(59,130,246,0.5)] flex flex-col items-center text-center max-w-[200px] rotate-2">
            <div className="bg-white/20 p-2 rounded-full mb-3">
              <Zap className="w-8 h-8 text-blue-100" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1">Último Desafiado:</span>
            <h3 className="text-2xl font-black italic text-white uppercase drop-shadow-lg leading-tight">{lastChallengedWinner.name}</h3>
            <div className="h-1 w-full bg-white/30 rounded-full mt-3"></div>
          </div>
        </div>
      )}

      {overlay && notification && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none p-10 animate-in fade-in zoom-in duration-300">
          <div className={cn(
            "max-w-4xl w-full p-12 rounded-[3rem] border-4 text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl transform rotate-1 flex flex-col items-center justify-center transition-colors duration-500",
            notification.type === 'leader' 
              ? "bg-yellow-500/95 border-yellow-300 text-black animate-bounce" 
              : "bg-primary/95 border-primary-foreground/20 text-white"
          )}>
            {notification.title && <h2 className="text-4xl font-black italic uppercase tracking-[0.2em] mb-8 opacity-70">{notification.title}</h2>}
            <h2 className="text-[10rem] font-black italic uppercase tracking-tighter mb-8 drop-shadow-2xl leading-none">{notification.userName}</h2>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex flex-col items-end">
                <span className="text-5xl font-black italic uppercase tracking-widest opacity-80 leading-none">Bebeu</span>
                {notification.type === 'leader' && <Trophy className="w-8 h-8 mt-2" />}
              </div>
              <span className={cn("text-8xl font-black italic uppercase tracking-tighter drop-shadow-md px-8 py-4 rounded-[2rem]", notification.type === 'leader' ? "bg-black text-yellow-400" : "bg-white/20 text-white")}>{notification.count}</span>
            </div>
          </div>
        </div>
      )}

      {data.raffle?.isRaffling && (
        <div className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500 backdrop-blur-3xl",
          isChallengeType ? "bg-indigo-950/95" : "bg-black/95"
        )}>
          {isChallengeType ? (
            <Zap className="w-32 h-32 text-blue-400 animate-bounce mb-8 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          ) : (
            <Star className="w-32 h-32 text-yellow-500 animate-pulse mb-8" />
          )}
          
          <h2 className="text-4xl font-black italic text-white/60 uppercase mb-8">
            {showWinner 
              ? (isChallengeType ? "⚡ DESAFIO ACEITO:" : "🏆 O Vencedor é:") 
              : (isChallengeType ? "🎲 Escolhendo um Desafiado..." : "🎰 Sorteando entre o Top 6...")}
          </h2>

          <div className={cn(
            "text-[10rem] font-black italic uppercase tracking-tighter transition-all duration-500",
            showWinner 
              ? (isChallengeType 
                  ? "text-blue-400 drop-shadow-[0_0_60px_rgba(59,130,246,0.8)] scale-125" 
                  : "text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.8)] scale-110")
              : "text-white"
          )}>
            {currentRaffleName || "..."}
          </div>

          {showWinner && isChallengeType && (
            <div className="mt-12 py-4 px-12 bg-blue-500/20 border border-blue-400/50 rounded-full animate-pulse">
              <span className="text-4xl font-black italic text-blue-300 uppercase tracking-widest">FOI DESAFIADO! ⚡</span>
            </div>
          )}
        </div>
      )}

      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className={cn("rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] overflow-hidden flex items-center justify-center w-12 h-12", brandImageUrl ? "p-0" : "p-2 bg-primary/20")}>
            {brandImageUrl ? <img src={brandImageUrl} className="w-full h-full object-cover" alt="Logo" /> : <CustomIcon className="w-full h-full text-primary" />}
          </div>
          <span className="text-xl font-black italic uppercase text-white/40 tracking-widest">{data.brandName}</span>
        </div>
        <h1 className={cn("font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]", overlay ? "text-6xl md:text-7xl" : "text-5xl md:text-6xl")}>{data.title}</h1>
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
