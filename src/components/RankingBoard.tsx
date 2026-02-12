
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useCounter, Participant } from '@/hooks/useCounter';
import { 
  Trophy, Medal, Star, Flame, Loader2, 
  Beer, Wine, CupSoda, GlassWater, Music, Pizza, Zap, Megaphone,
  Heart, Disc, Sparkles, Instagram, Youtube, Mic, ListOrdered
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
  heart: 'https://assets.mixkit.co/active_storage/sfx/1360/1360-preview.mp3',
  social: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};

export function RankingBoard({ overlay = false }: { overlay?: boolean }) {
  const { data, loading, isInitializing, clearPiadinha } = useCounter();
  const [currentRaffleName, setCurrentRaffleName] = useState("");
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
  const lastSocialAnnouncementRef = useRef<number | null>(null);
  const lastPiadinhaTimestampRef = useRef<number | null>(null);
  const challengeAudioRef = useRef<HTMLAudioElement | null>(null);
  const piadinhaAudioRef = useRef<HTMLAudioElement | null>(null);

  const raffleAnimationIndexRef = useRef(0);
  const isRafflingPersistedRef = useRef(false);

  const CustomIcon = ICON_MAP[data.brandIcon] || Beer;
  const brandImageUrl = data.brandImageUrl || "";

  const getParticipantAvatar = (p: Participant) => {
    if (p.imageUrl) return p.imageUrl;
    return `https://picsum.photos/seed/${p.id}/200/200`;
  };

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
        origin = origin.replace(/https?:\/\/\d+-/, (match) => match.replace(/\d+/, '9000'));
      } else if (origin.includes("localhost")) {
        origin = "http://localhost:9000";
      }
      setQrCorreioUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/correio')}`);
      setQrCadastroUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/cadastro')}`);
      setQrMusicaUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/musica')}`);
    }
  }, []);

  const approvedParticipants = useMemo(() => 
    (data.participants || []).filter(p => p.status === 'approved'), 
    [data.participants]
  );

  const sortedParticipants = useMemo(() => {
    return [...approvedParticipants].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const indexA = data.participants.findIndex(p => p.id === a.id);
      const indexB = data.participants.findIndex(p => p.id === b.id);
      return indexA - indexB;
    });
  }, [approvedParticipants, data.participants]);

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
  }, [approvedParticipants, overlay, sortedParticipants]);

  useEffect(() => {
    if (overlay && data.socialAnnouncement?.isActive && data.socialAnnouncement.timestamp !== lastSocialAnnouncementRef.current) {
      playSound('social');
      lastSocialAnnouncementRef.current = data.socialAnnouncement.timestamp;
    }
  }, [data.socialAnnouncement, overlay]);

  useEffect(() => {
    if (overlay && data.piadinha?.isActive && data.piadinha.timestamp !== lastPiadinhaTimestampRef.current && data.piadinha.audioUrl) {
      if (piadinhaAudioRef.current) {
        piadinhaAudioRef.current.pause();
      }
      const audio = new Audio(data.piadinha.audioUrl);
      piadinhaAudioRef.current = audio;
      audio.play().catch(() => {});
      lastPiadinhaTimestampRef.current = data.piadinha.timestamp;
      
      audio.onended = () => {
        clearPiadinha();
      };
    }
  }, [data.piadinha, overlay, clearPiadinha]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (data.raffle?.isRaffling) {
      if (!isRafflingPersistedRef.current) {
        isRafflingPersistedRef.current = true;
        raffleAnimationIndexRef.current = 0;
        if (data.raffle.type === 'challenge') {
          playSound('challenge');
        }
      }

      const candidates = data.raffle.candidates || [];
      if (candidates.length > 0) {
        interval = setInterval(() => {
          raffleAnimationIndexRef.current++;
          setCurrentRaffleName(candidates[raffleAnimationIndexRef.current % candidates.length]);
        }, 100);
      }
    } else {
      isRafflingPersistedRef.current = false;
      stopChallengeSound();
      const winner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);
      if (winner && !data.raffle?.isRaffling) {
        setCurrentRaffleName(winner.name);
      } else {
        setCurrentRaffleName("");
      }
    }

    return () => { 
      if (interval) clearInterval(interval); 
    };
  }, [data.raffle?.isRaffling, data.raffle?.candidates, approvedParticipants]);

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
  const top10 = sortedParticipants.slice(3, 10);
  const leader = sortedParticipants[0];
  
  const approvedMusic = (data.musicRequests || [])
    .filter(m => m.status === 'approved')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const raffleWinner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);

  return (
    <div className={cn("flex flex-col items-center w-full relative", overlay ? "bg-transparent min-h-screen p-8 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12")}>
      
      {overlay && brandImageUrl && (
        <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
          <img src={brandImageUrl} alt="Watermark" className="w-[80vw] h-[80vh] object-contain grayscale blur-[2px] scale-125 rotate-[-15deg]" />
        </div>
      )}

      {/* PIADINHA OVERLAY */}
      {overlay && data.piadinha?.isActive && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-10 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
           <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
              <div className="relative bg-white/10 p-4 rounded-full border-4 border-orange-500/50 shadow-[0_0_80px_rgba(249,115,22,0.6)] animate-bounce" style={{ animationDuration: '2s' }}>
                <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-orange-500 bg-black flex items-center justify-center scale-up-down">
                  {data.piadinha.imageUrl ? (
                    <img src={data.piadinha.imageUrl} className="w-full h-full object-cover" alt="Piadinha" />
                  ) : (
                    <Mic className="w-32 h-32 text-orange-500" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-2 rounded-full font-black uppercase italic shadow-lg animate-pulse">
                OUÇA A PIADINHA!
              </div>
           </div>
        </div>
      )}

      {/* QR CODES INFERIORES */}
      {overlay && (
        <>
          <div className="fixed right-8 bottom-32 z-[80] flex flex-col gap-4 animate-in slide-in-from-right-10 duration-700">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Cadastro</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-secondary/20">
                <img src={qrCadastroUrl} alt="QR" className="w-24 h-24" />
              </div>
            </div>
          </div>

          <div className="fixed left-8 bottom-32 z-[80] flex flex-col gap-4 animate-in slide-in-from-left-10 duration-700">
             <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Correio Elegante</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-primary/20">
                <img src={qrCorreioUrl} alt="QR" className="w-24 h-24" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Pedir Música</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-blue-500/20">
                <img src={qrMusicaUrl} alt="QR" className="w-24 h-24" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOP 4-10 PANEL - CANTO ESQUERDO SUPERIOR */}
      {overlay && top10.length > 0 && (
        <div className="fixed left-8 top-8 z-[70] w-72 space-y-2 animate-in slide-in-from-left-20 duration-1000">
          <h3 className="text-white/40 font-black italic uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2">
            <ListOrdered className="w-3 h-3" /> Classificação
          </h3>
          <div className="space-y-1">
            {top10.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-1 px-3 border-l-2 border-white/5 hover:border-primary transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-black text-white/20 w-4">{i + 4}º</span>
                  <Avatar className="w-6 h-6 border border-white/10">
                    <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                  </Avatar>
                  <span className="text-xs font-bold text-white/80 uppercase truncate">{p.name}</span>
                </div>
                <span className="text-xs font-black text-primary/60">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAYLIST PANEL - CANTO DIREITO SUPERIOR */}
      {overlay && approvedMusic.length > 0 && (
        <div className="fixed right-8 top-8 z-[70] w-72 space-y-2 animate-in slide-in-from-right-20 duration-1000 text-right">
          <h3 className="text-white/40 font-black italic uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2 justify-end">
             Playlist <Disc className="w-3 h-3 animate-spin" />
          </h3>
          <div className="space-y-3">
            {approvedMusic.map((m, i) => (
              <div key={m.id} className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-[9px] font-black uppercase text-blue-500/60 tracking-wider truncate">{m.artist}</p>
                <p className="text-xs font-bold text-white/80 uppercase italic truncate">{m.song}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICAÇÕES (LÍDER, PONTO, LANTERNA) */}
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

      {/* SORTEIO ATIVO */}
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
            <div className="bg-black/20 px-12 py-8 rounded-[3rem] w-full min-h-[200px] flex items-center justify-center border-4 border-white/10 overflow-hidden">
              <span className="text-8xl font-black italic uppercase tracking-tighter">
                {currentRaffleName || '...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ÚLTIMO GANHADOR */}
      {overlay && !data.raffle?.isRaffling && raffleWinner && (
        <div className="fixed top-24 left-[50%] -translate-x-1/2 z-[60] animate-in slide-in-from-top-10 duration-500">
          <div className={cn(
            "px-8 py-4 rounded-[2rem] border-4 shadow-2xl flex items-center gap-6 rotate-1",
            data.raffle?.type === 'challenge' 
              ? "bg-purple-600/95 border-purple-300 text-white shadow-purple-500/20" 
              : "bg-yellow-500/95 border-yellow-300 text-black shadow-yellow-500/20"
          )}>
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarImage src={getParticipantAvatar(raffleWinner)} className="object-cover" />
                <AvatarFallback className="bg-white/10 font-bold uppercase">{raffleWinner.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {data.raffle?.type === 'challenge' ? 'DESAFIO VENCIDO' : 'ÚLTIMO GANHADOR!'}
              </span>
              <span className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                {raffleWinner.name}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-4 mb-12">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className={cn("rounded-xl shadow-lg overflow-hidden flex items-center justify-center w-12 h-12", brandImageUrl ? "p-0" : "p-2 bg-primary/20")}>
            {brandImageUrl ? <img src={brandImageUrl} className="w-full h-full object-cover" alt="Logo" /> : <CustomIcon className="w-full h-full text-primary" />}
          </div>
          <span className="text-xl font-black italic uppercase text-white/40 tracking-widest">{data.brandName}</span>
        </div>
        <h1 className={cn("font-black italic text-white uppercase tracking-tighter drop-shadow-lg", overlay ? "text-6xl md:text-7xl" : "text-5xl md:text-6xl")}>{data.title}</h1>
      </div>

      {/* PÓDIO TOP 3 HORIZONTAL - COMEÇANDO DO TOPO */}
      <div className="flex flex-row justify-center items-end gap-12 w-full max-w-6xl mt-4">
        {[1, 0, 2].map((actualIndex) => {
          const p = top3[actualIndex];
          if (!p) return <div key={actualIndex} className="hidden md:block w-72" />;
          return (
            <div 
              key={p.id} 
              className={cn(
                "relative flex flex-col items-center p-8 transition-all duration-500 animate-in fade-in zoom-in",
                actualIndex === 0 ? "scale-125 z-20 order-2" : actualIndex === 1 ? "order-1 opacity-80" : "order-3 opacity-80"
              )}
            >
              <div className="relative mb-6">
                <div className={cn(
                  "absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse",
                  actualIndex === 0 ? "bg-yellow-400" : actualIndex === 1 ? "bg-zinc-400" : "bg-amber-800"
                )}></div>
                <Avatar className={cn(
                  "w-40 h-40 border-8 shadow-2xl",
                  actualIndex === 0 ? "border-yellow-400" : actualIndex === 1 ? "border-zinc-300" : "border-amber-700"
                )}>
                  <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                  <AvatarFallback className="bg-white/10 text-4xl font-black text-white/20">{p.name[0]}</AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full w-12 h-12 flex items-center justify-center font-black italic shadow-lg border-2 border-white/20",
                  actualIndex === 0 ? "bg-yellow-400 text-black" : actualIndex === 1 ? "bg-zinc-300 text-black" : "bg-amber-700 text-white"
                )}>
                  {actualIndex + 1}º
                </div>
              </div>
              
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-2">{p.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-6xl font-black text-primary drop-shadow-lg">{p.count}</span>
                <span className="text-white/20 font-bold uppercase text-[10px] tracking-widest leading-tight">{p.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TICKER INFERIOR */}
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

      <style jsx global>{`
        @keyframes scale-up-down {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .scale-up-down {
          animation: scale-up-down 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
