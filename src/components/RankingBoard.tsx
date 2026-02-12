
"use client";

import { useState, useEffect, useRef } from 'react';
import { useCounter, Participant } from '@/hooks/useCounter';
import { 
  Trophy, Medal, Star, Flame, Loader2, 
  Beer, Wine, CupSoda, GlassWater, Music, Pizza, Zap, Megaphone,
  Heart, Disc, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Beer, Wine, CupSoda, GlassWater, Trophy, Star, Flame, Music, Pizza
};

const SOUND_URLS = {
  point: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  leader: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  challenge: 'https://assets.mixkit.co/active_storage/sfx/950/950-preview.mp3',
  announcement: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  heart: 'https://assets.mixkit.co/active_storage/sfx/1360/1360-preview.mp3'
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
  const [qrCorreioUrl, setQrCorreioUrl] = useState("");
  const [qrCadastroUrl, setQrCadastroUrl] = useState("");
  const [qrMusicaUrl, setQrMusicaUrl] = useState("");
  
  const [notification, setNotification] = useState<{ 
    userName: string; 
    count: number; 
    type: 'point' | 'leader' | 'lantern';
    title?: string;
  } | null>(null);
  
  const lastParticipantsRef = useRef<Participant[]>([]);
  const lastLeaderIdRef = useRef<string | null>(null);
  const lastLanternIdRef = useRef<string | null>(null);
  const lastAnnouncementTimeRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastApprovedMusicIdRef = useRef<string | null>(null);
  const challengeAudioRef = useRef<HTMLAudioElement | null>(null);

  const CustomIcon = ICON_MAP[data.brandIcon] || Beer;
  const brandImageUrl = data.brandImageUrl || "";

  const playSound = (type: keyof typeof SOUND_URLS) => {
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
    if (typeof window !== 'undefined') {
      let origin = window.location.origin;
      
      if (origin.includes("cloudworkstations.dev")) {
        origin = origin.replace(/:\d+/, ':9000');
      }
      
      setQrCorreioUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/correio')}`);
      setQrCadastroUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/cadastro')}`);
      setQrMusicaUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/musica')}`);
    }
  }, []);

  const approvedParticipants = (data.participants || []).filter(p => p.status === 'approved');

  const sortedParticipants = [...approvedParticipants].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    // Ordem de adição para empates em pontos
    const indexA = data.participants.findIndex(p => p.id === a.id);
    const indexB = data.participants.findIndex(p => p.id === b.id);
    return indexA - indexB;
  });

  useEffect(() => {
    if (!overlay || approvedParticipants.length === 0) return;

    const currentLeader = sortedParticipants[0];
    const top10Current = sortedParticipants.slice(0, 10);
    const currentLantern = (top10Current.length > 3 && top10Current[top10Current.length - 1].count > 0) 
      ? top10Current[top10Current.length - 1] 
      : null;

    if (lastParticipantsRef.current.length === 0) {
      lastParticipantsRef.current = approvedParticipants;
      lastLeaderIdRef.current = currentLeader?.id || null;
      lastLanternIdRef.current = currentLantern?.id || null;
      return;
    }

    const prev = lastParticipantsRef.current;
    const current = approvedParticipants;

    const updatedUser = current.find(p => {
      const prevP = prev.find(pp => pp.id === p.id);
      return prevP && p.count > prevP.count;
    });

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
    } 
    else if (currentLantern && lastLanternIdRef.current && currentLantern.id !== lastLanternIdRef.current) {
      playSound('announcement');
      setNotification({
        userName: currentLantern.name,
        count: currentLantern.count,
        type: 'lantern',
        title: "NOVO LANTERNINHA! 🤡"
      });
      lastLanternIdRef.current = currentLantern.id;
      setTimeout(() => setNotification(null), 5000);
    }
    else if (updatedUser) {
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
  }, [data.participants, overlay, approvedParticipants, sortedParticipants]);

  useEffect(() => {
    if (!overlay || !data.messages || data.messages.length === 0) return;
    const approvedMessages = data.messages.filter(m => m.status === 'approved');
    if (approvedMessages.length === 0) return;
    const latest = approvedMessages[approvedMessages.length - 1];
    if (latest.id !== lastMessageIdRef.current) {
      playSound('heart');
      lastMessageIdRef.current = latest.id;
    }
  }, [data.messages, overlay]);

  useEffect(() => {
    if (!overlay || !data.musicRequests || data.musicRequests.length === 0) return;
    const approvedMusic = data.musicRequests.filter(m => m.status === 'approved');
    if (approvedMusic.length === 0) return;
    const latest = approvedMusic[approvedMusic.length - 1];
    if (latest.id !== lastApprovedMusicIdRef.current) {
      playSound('announcement');
      lastApprovedMusicIdRef.current = latest.id;
    }
  }, [data.musicRequests, overlay]);

  useEffect(() => {
    if (!overlay || !data.announcement?.isActive || !data.announcement.timestamp) return;
    if (data.announcement.timestamp !== lastAnnouncementTimeRef.current) {
      playSound('announcement');
      lastAnnouncementTimeRef.current = data.announcement.timestamp;
    }
  }, [data.announcement, overlay]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let winnerTimeout: NodeJS.Timeout;

    if (data.raffle?.isRaffling) {
      const candidates = data.raffle.candidates || [];
      const isChallenge = data.raffle.type === 'challenge';

      if (candidates.length > 0) {
        let i = 0;
        interval = setInterval(() => {
          // Garante que passa por todos os nomes da lista de candidatos enviada
          setCurrentRaffleName(candidates[i % candidates.length]);
          i++;
        }, 100);

        winnerTimeout = setTimeout(() => {
          clearInterval(interval);
          const winner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);
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
      setCurrentRaffleName("");
      stopChallengeSound();
    }
    return () => { 
      if (interval) clearInterval(interval); 
      if (winnerTimeout) clearTimeout(winnerTimeout);
      stopChallengeSound();
    };
  }, [data.raffle?.isRaffling, data.raffle?.winnerId, approvedParticipants]);

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

  const top3 = sortedParticipants.slice(0, 3);
  const leader = top3[0];
  const top10 = sortedParticipants.slice(0, 10);
  const lanterninha = (top10.length > 3 && top10[top10.length - 1].count > 0) ? top10[top10.length - 1] : null;

  const ranks4to10 = sortedParticipants.slice(3, 10);
  
  const approvedMessages = data.messages.filter(m => m.status === 'approved');
  const latestMessage = approvedMessages.length > 0 ? approvedMessages[approvedMessages.length - 1] : null;

  const approvedMusic = (data.musicRequests || [])
    .filter(m => m.status === 'approved')
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-10);

  const raffleWinner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);

  return (
    <div className={cn("flex flex-col items-center w-full relative", overlay ? "bg-transparent min-h-screen justify-center p-12 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12")}>
      
      {overlay && brandImageUrl && (
        <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
          <img src={brandImageUrl} alt="Watermark" className="w-[80vw] h-[80vh] object-contain grayscale blur-[2px] scale-125 rotate-[-15deg]" />
        </div>
      )}

      {overlay && ranks4to10.length > 0 && (
        <div className="fixed top-8 left-8 flex flex-col gap-2 z-[70] animate-in slide-in-from-left-10 duration-700">
          <div className="bg-primary/20 px-4 py-1 rounded-full border border-primary/30 flex items-center gap-2 mb-1 justify-center">
            <Flame className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Em Disputa</span>
          </div>
          {ranks4to10.map((p, i) => (
            <div key={p.id} className="glass px-3 py-2 rounded-2xl flex items-center gap-3 border-white/5 shadow-lg backdrop-blur-md min-w-[150px]">
              <span className="text-[10px] font-black text-white/30 italic">{i + 4}º</span>
              <Avatar className="w-10 h-10 border border-white/10">
                {p.imageUrl ? <AvatarImage src={p.imageUrl} className="object-cover" /> : null}
                <AvatarFallback className="bg-white/5 text-[10px] font-bold">{p.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase max-w-[80px] truncate leading-tight">{p.name}</span>
                <span className="text-[10px] font-black text-primary leading-none mt-1">{p.count} {p.category.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {overlay && approvedMusic.length > 0 && (
        <div className="fixed top-8 right-8 flex flex-col gap-2 z-[70] animate-in slide-in-from-right-10 duration-700">
          <div className="bg-blue-600/20 px-4 py-1 rounded-full border border-blue-500/30 flex items-center gap-2 mb-1 justify-center">
            <Music className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black text-blue-300 uppercase italic tracking-widest">Playlist da Vez</span>
          </div>
          {approvedMusic.map((m) => (
            <div key={m.id} className="glass px-4 py-2 rounded-2xl flex items-center gap-3 border-white/5 shadow-lg backdrop-blur-md animate-in slide-in-from-right-5">
              <Disc className="w-5 h-5 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white uppercase italic truncate max-w-[180px] leading-tight">{m.artist} - {m.song}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {overlay && (
        <>
          <div className="fixed left-8 bottom-32 z-[80] animate-in slide-in-from-left-10 duration-700">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Correio Elegante</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-primary/20">
                <img src={qrCorreioUrl} alt="QR Code" className="w-24 h-24" />
              </div>
            </div>
          </div>

          <div className="fixed right-8 bottom-32 z-[80] flex flex-col gap-4 animate-in slide-in-from-right-10 duration-700">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Pedir Música</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-blue-500/20">
                <img src={qrMusicaUrl} alt="QR Code" className="w-24 h-24" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Cadastro</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-secondary/20">
                <img src={qrCadastroUrl} alt="QR Code" className="w-24 h-24" />
              </div>
            </div>
          </div>
        </>
      )}

      {overlay && latestMessage && (
        <div className="fixed left-8 top-[50%] -translate-y-1/2 z-[80] animate-in slide-in-from-left-10 duration-500">
          <div className="bg-pink-600/90 backdrop-blur-xl border-4 border-pink-400 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(219,39,119,0.5)] flex flex-col items-center text-center max-w-[240px] rotate-[-2deg]">
            <div className="bg-white/20 p-2 rounded-full mb-3">
              <Heart className="w-8 h-8 text-pink-100 fill-pink-100" />
            </div>
            <div className="space-y-1 mb-3">
              <span className="text-[10px] font-black uppercase text-pink-100 block">De: {latestMessage.from}</span>
              <span className="text-[10px] font-black uppercase text-pink-100 block">Para: {latestMessage.to}</span>
            </div>
            <p className="text-xl font-black italic text-white uppercase drop-shadow-md leading-tight">
              &ldquo;{latestMessage.content}&rdquo;
            </p>
          </div>
        </div>
      )}

      {overlay && notification && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none p-10 animate-in fade-in zoom-in duration-300">
          <div className={cn(
            "max-w-4xl w-full p-12 rounded-[3rem] border-4 text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl transform rotate-1 flex flex-col items-center justify-center",
            notification.type === 'leader' ? "bg-yellow-500/95 border-yellow-300 text-black animate-bounce" : 
            notification.type === 'lantern' ? "bg-red-600/95 border-red-300 text-white animate-pulse" :
            "bg-primary/95 border-primary-foreground/20 text-white"
          )}>
            {notification.title && <h2 className="text-4xl font-black italic uppercase tracking-[0.2em] mb-8 opacity-70">{notification.title}</h2>}
            <h2 className="text-[10rem] font-black italic uppercase tracking-tighter mb-8 drop-shadow-2xl leading-none">{notification.userName}</h2>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex flex-col items-end">
                <span className="text-5xl font-black italic uppercase tracking-widest opacity-80 leading-none">
                  {notification.type === 'lantern' ? "Tá Devendo" : "Bebeu"}
                </span>
                {notification.type === 'leader' && <Trophy className="w-8 h-8 mt-2" />}
                {notification.type === 'lantern' && <CryingIcon className="w-8 h-8 mt-2" />}
              </div>
              <span className={cn(
                "text-8xl font-black italic uppercase tracking-tighter drop-shadow-md px-8 py-4 rounded-[2rem]", 
                notification.type === 'leader' ? "bg-black text-yellow-400" : 
                notification.type === 'lantern' ? "bg-black text-red-500" :
                "bg-white/20 text-white"
              )}>{notification.count}</span>
            </div>
          </div>
        </div>
      )}

      {overlay && data.raffle?.isRaffling && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={cn(
            "max-w-4xl w-full p-16 rounded-[4rem] border-8 text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center animate-pulse",
            data.raffle.type === 'challenge' 
              ? "bg-purple-600 border-purple-400 text-white" 
              : "bg-yellow-500 border-yellow-300 text-black"
          )}>
            <div className="flex items-center gap-6 mb-8">
              {data.raffle.type === 'challenge' ? <Zap className="w-20 h-20" /> : <Sparkles className="w-20 h-20" />}
              <h2 className="text-6xl font-black italic uppercase tracking-[0.2em] drop-shadow-lg">
                {data.raffle.type === 'challenge' ? 'DESAFIO SURPRESA' : 'SORTEIO GERAL'}
              </h2>
              {data.raffle.type === 'challenge' ? <Zap className="w-20 h-20" /> : <Sparkles className="w-20 h-20" />}
            </div>
            <div className="bg-black/20 px-12 py-8 rounded-[3rem] w-full min-h-[200px] flex items-center justify-center border-4 border-white/10">
              <span className="text-8xl font-black italic uppercase tracking-tighter animate-in slide-in-from-bottom-10">
                {currentRaffleName || '...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {overlay && !data.raffle?.isRaffling && raffleWinner && (
        <div className="fixed top-8 left-[50%] -translate-x-1/2 z-[60] animate-in slide-in-from-top-10 duration-500">
          <div className={cn(
            "px-8 py-4 rounded-[2rem] border-4 shadow-2xl flex items-center gap-6 rotate-1",
            data.raffle?.type === 'challenge' 
              ? "bg-purple-600/95 border-purple-300 text-white shadow-purple-500/20" 
              : "bg-yellow-500/95 border-yellow-300 text-black shadow-yellow-500/20"
          )}>
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                {raffleWinner.imageUrl ? <AvatarImage src={raffleWinner.imageUrl} className="object-cover" /> : null}
                <AvatarFallback className="bg-white/10 font-bold uppercase">{raffleWinner.name[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black p-1 rounded-full uppercase italic animate-bounce border border-white/20">
                Último Ganhador!
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {data.raffle?.type === 'challenge' ? 'DESAFIO VENCIDO' : 'SORTEADO DA VEZ'}
              </span>
              <span className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                {raffleWinner.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {overlay && data.announcement?.isActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-10 animate-in fade-in zoom-in duration-500 bg-red-950/40 backdrop-blur-sm">
          <div className="max-w-5xl w-full bg-red-600 border-4 border-yellow-400 p-12 rounded-[3rem] shadow-[0_0_150px_rgba(220,38,38,0.8)] text-center transform -rotate-1 animate-bounce">
            <div className="flex items-center justify-center gap-6 mb-8">
              <Megaphone className="w-20 h-20 text-yellow-400 animate-pulse" />
              <h2 className="text-7xl font-black italic text-white uppercase tracking-[0.2em] drop-shadow-lg">ATENÇÃO</h2>
              <Megaphone className="w-20 h-20 text-yellow-400 animate-pulse scale-x-[-1]" />
            </div>
            <p className="text-6xl font-black italic text-white uppercase tracking-tighter drop-shadow-2xl leading-tight">{data.announcement.message}</p>
          </div>
        </div>
      )}

      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className={cn("rounded-xl shadow-lg overflow-hidden flex items-center justify-center w-12 h-12", brandImageUrl ? "p-0" : "p-2 bg-primary/20")}>
            {brandImageUrl ? <img src={brandImageUrl} className="w-full h-full object-cover" alt="Logo" /> : <CustomIcon className="w-full h-full text-primary" />}
          </div>
          <span className="text-xl font-black italic uppercase text-white/40 tracking-widest">{data.brandName}</span>
        </div>
        <h1 className={cn("font-black italic text-white uppercase tracking-tighter drop-shadow-lg", overlay ? "text-6xl md:text-7xl" : "text-5xl md:text-6xl")}>{data.title}</h1>
        <div className="h-2 w-48 bg-gradient-to-r from-primary via-secondary to-primary mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-end max-w-5xl mb-12">
        {[1, 0, 2].map((actualIndex) => {
          const p = top3[actualIndex];
          if (!p) return <div key={actualIndex} className="hidden md:block" />;
          return (
            <Card key={p.id} className={cn("relative overflow-hidden transition-all border-2 glass", actualIndex === 0 ? "border-yellow-400/50 scale-110 z-20 bg-yellow-400/10 order-1 md:order-2" : actualIndex === 1 ? "border-zinc-300/30 bg-zinc-300/5 order-2 md:order-1" : "border-amber-700/30 bg-amber-700/5 order-3")}>
              <CardContent className="pt-12 pb-14 flex flex-col items-center space-y-8">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
                    {p.imageUrl ? <AvatarImage src={p.imageUrl} className="object-cover" /> : null}
                    <AvatarFallback className="bg-white/10 text-4xl font-black text-white/20">{p.name[0]}</AvatarFallback>
                  </Avatar>
                  {p.count > 0 && (
                    <>
                      <div className="absolute -bottom-3 -right-3 bg-background border-2 border-primary rounded-full w-10 h-10 flex items-center justify-center font-black italic text-primary z-30">{actualIndex + 1}º</div>
                      <div className="absolute -top-4 -left-4 z-30">
                        {actualIndex === 0 ? <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" /> : <Medal className={cn("w-10 h-10", actualIndex === 1 ? "text-zinc-300" : "text-amber-700")} />}
                      </div>
                    </>
                  )}
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
        <div className="w-full max-w-md bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-destructive/40 shadow-xl">
                {lanterninha.imageUrl ? <AvatarImage src={lanterninha.imageUrl} className="object-cover" /> : null}
                <AvatarFallback className="bg-destructive/10"><CryingIcon className="w-8 h-8 text-destructive" /></AvatarFallback>
              </Avatar>
              <CryingIcon className="absolute -top-2 -right-2 w-6 h-6 text-destructive animate-pulse" />
            </div>
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
                  Liderança: <span className="text-white">{leader?.count > 0 ? leader.name : "---"}</span> {leader?.count > 0 && <span>com <span className="text-white">{leader.count}</span> pontos</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
