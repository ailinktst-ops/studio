
"use client";

import { useState, useRef, useEffect } from 'react';
import { useCounter, Participant } from '@/hooks/useCounter';
import { 
  Plus, RotateCcw, UserPlus, Trash2, 
  Sparkles, Loader2, Zap,
  Heart, Check, Ban, ImageIcon, History, Upload, UserCheck,
  Music, X, Trophy, Mic, Image as ImageIconLucide,
  Play, Volume2, Copy, Smartphone, ExternalLink, Settings, Eraser
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function ControlPanel() {
  const { 
    data, loading, isInitializing, 
    addParticipant, updateParticipantImage, incrementCount, resetAll, resetOnlyPoints,
    removeParticipant, triggerRaffle, triggerSurpriseChallenge, clearRaffle, clearChallenge, 
    resetRaffleHistory, resetChallengeHistory, clearActiveMessage,
    moderateMessage, clearElegantMessages, moderateParticipant, updateParticipantCategory,
    updateAllParticipantsCategory, moderateMusic, removeMusicRequest,
    submitJoke, updateJokeImage, removeJoke, triggerPiadinha, clearPiadinha
  } = useCounter();

  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Gole");
  const [bulkCategory, setBulkCategory] = useState("Gole");
  const [bulkResetPoints, setBulkResetPoints] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);
  const [moderationCategories, setModerationCategories] = useState<Record<string, string>>({});
  
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  
  const participantFilesRef = useRef<Record<string, HTMLInputElement | null>>({});
  const jokeFilesRef = useRef<Record<string, HTMLInputElement | null>>({});
  const adminAudioRef = useRef<HTMLAudioElement | null>(null);

  const getParticipantAvatar = (p: Participant) => {
    if (p.imageUrl) return p.imageUrl;
    return `https://picsum.photos/seed/${p.id}-character/200/200`;
  };

  const formatUrlWithCorrectPort = (path: string) => {
    if (typeof window === 'undefined') return path;
    let origin = window.location.origin;
    if (origin.includes("cloudworkstations.dev")) {
      origin = origin.replace(/https?:\/\/\d+-/, (match) => match.replace(/\d+/, '9000'));
    } else if (origin.includes("localhost")) {
      origin = "http://localhost:9000";
    }
    return `${origin}${path}`;
  };

  useEffect(() => {
    const generateQr = (path: string) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formatUrlWithCorrectPort(path))}`;
    setQrUrls({
      cadastro: generateQr('/cadastro'),
      correio: generateQr('/correio'),
      musica: generateQr('/musica'),
      piadinha: generateQr('/piadinha')
    });
  }, []);

  const copyToClipboard = (path: string, label: string) => {
    const url = formatUrlWithCorrectPort(path);
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link Copiado!",
        description: `O link para ${label} foi copiado.`,
      });
    });
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      const success = addParticipant(newParticipantName.trim(), selectedCategory, "", true);
      if (success) {
        setNewParticipantName("");
      } else {
        toast({
          variant: "destructive",
          title: "Nome duplicado",
          description: "Já existe um participante com este nome.",
        });
      }
    }
  };

  const handleBulkUpdate = () => {
    updateAllParticipantsCategory(bulkCategory, bulkResetPoints);
    setIsConfirmBulkOpen(false);
    setIsBulkDialogOpen(false);
    toast({
      title: "Ranking Atualizado!",
      description: `Todos os participantes agora são da categoria ${bulkCategory}.`,
    });
  };

  const handleImageCompression = (file: File, callback: (dataUrl: string) => void, maxSize = 600) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(optimizedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleParticipantImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCompression(file, (url) => updateParticipantImage(id, url), 400);
    }
  };

  const handleJokeImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCompression(file, (url) => updateJokeImage(id, url), 800);
    }
  };

  const playAdminAudio = (audioUrl: string) => {
    if (adminAudioRef.current) {
      adminAudioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    adminAudioRef.current = audio;
    audio.play().catch(e => console.error("Erro ao tocar áudio no painel:", e));
  };

  const ShareButton = ({ path, label, icon: Icon, colorClass, qrKey }: { path: string, label: string, icon: any, colorClass: string, qrKey: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all", colorClass)}>
          <Icon className="w-4 h-4 mr-2" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card/95 border-white/10 backdrop-blur-2xl max-w-[320px] rounded-[2rem] p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center font-black italic uppercase text-white tracking-tighter text-2xl">QR CODE {label}</DialogTitle>
          <DialogDescription className="text-center text-[10px] font-bold uppercase text-white/40 tracking-widest">Aponte a câmera para acessar</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-8">
          <div className="p-4 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <img src={qrUrls[qrKey]} alt={`QR ${label}`} className="w-48 h-48" />
          </div>
          <div className="flex w-full gap-2">
            <Button 
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black uppercase italic text-xs h-12 rounded-xl"
              onClick={() => copyToClipboard(path, label)}
            >
              <Copy className="w-4 h-4 mr-2" /> Copiar Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const pendingMessages = data.messages.filter(m => m.status === 'pending');
  const pendingParticipants = data.participants.filter(p => p.status === 'pending');
  const pendingMusic = (data.musicRequests || []).filter(m => m.status === 'pending');
  const approvedMusic = (data.musicRequests || []).filter(m => m.status === 'approved').sort((a,b) => b.timestamp - a.timestamp);
  const approvedParticipants = data.participants.filter(p => p.status === 'approved');
  
  const raffleWinnersHistoryIds = data.raffle?.winnersHistory || [];
  const raffleWinnersHistory = raffleWinnersHistoryIds.map(id => approvedParticipants.find(p => p.id === id)).filter(Boolean);

  const challengeWinnersHistoryIds = data.challenge?.winnersHistory || [];
  const challengeWinnersHistory = challengeWinnersHistoryIds.map(id => approvedParticipants.find(p => p.id === id)).filter(Boolean);

  const totalPending = pendingMessages.length + pendingParticipants.length + pendingMusic.length;

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
        <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
            <Smartphone className="w-3 h-3" /> QR Codes & Compartilhamento
          </span>
        </div>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <ShareButton path="/cadastro" label="Cadastro" icon={UserPlus} colorClass="hover:bg-secondary hover:text-white" qrKey="cadastro" />
          <ShareButton path="/correio" label="Correio" icon={Heart} colorClass="hover:bg-primary hover:text-white" qrKey="correio" />
          <ShareButton path="/musica" label="Música" icon={Music} colorClass="hover:bg-blue-600 hover:text-white" qrKey="musica" />
          <ShareButton path="/piadinha" label="Memes" icon={Mic} colorClass="hover:bg-orange-500 hover:text-white" qrKey="piadinha" />
          <Link href="/overlay" target="_blank" className="w-full">
            <Button variant="outline" size="sm" className="h-12 w-full bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all">
              <ExternalLink className="w-4 h-4 mr-2" /> Telão
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-orange-500/10 border-orange-500/20 backdrop-blur-md col-span-1 sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase italic text-orange-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" /> Memes Ao Vivo! ({data.jokes?.length || 0})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {(!data.jokes || data.jokes.length === 0) ? (
              <p className="text-[10px] font-bold uppercase text-white/20 text-center py-10 italic">Nenhum meme recebido ainda.</p>
            ) : (
              <div className="grid gap-3">
                {data.jokes.map((joke) => (
                  <div key={joke.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="relative group/img">
                        <Avatar className="w-14 h-14 border-2 border-orange-500/30">
                          {joke.imageUrl ? <AvatarImage src={joke.imageUrl} className="object-cover" /> : null}
                          <AvatarFallback className="bg-white/5"><ImageIconLucide className="w-6 h-6 text-orange-500/40" /></AvatarFallback>
                        </Avatar>
                        <button 
                          onClick={() => jokeFilesRef.current[joke.id]?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-full transition-opacity"
                        >
                          <Upload className="w-4 h-4 text-white" />
                        </button>
                        <input 
                          type="file" accept="image/*" className="hidden" 
                          ref={el => jokeFilesRef.current[joke.id] = el}
                          onChange={(e) => handleJokeImageUpload(joke.id, e)} 
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-white/40 block">Meme de:</span>
                        <span className="text-xs font-bold text-white/80">{new Date(joke.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => playAdminAudio(joke.audioUrl)} className="text-orange-500 hover:bg-orange-500/20"><Volume2 className="w-4 h-4" /></Button>
                      <Button 
                        onClick={() => triggerPiadinha(joke)} 
                        disabled={data.piadinha?.isActive}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase italic text-[10px] h-10 px-4"
                      >
                        {data.piadinha?.isActive ? <Loader2 className="animate-spin w-4 h-4" /> : "Lançar!"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeJoke(joke.id)} className="text-red-500 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.piadinha?.isActive && (
              <Button variant="ghost" size="sm" onClick={clearPiadinha} className="w-full text-orange-500 text-[10px] font-bold uppercase hover:bg-orange-500/10 h-8">
                Parar Exibição Atual
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sorteio Geral */}
        <Card className="bg-yellow-500/10 border-yellow-500/20 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase italic text-yellow-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Sorteio Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3">
             <Button onClick={triggerRaffle} disabled={approvedParticipants.length < 2 || data.raffle?.isRaffling || loading} className="w-full bg-yellow-500 hover:bg-yellow-600 h-12 rounded-xl text-md font-black uppercase italic shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                {data.raffle?.isRaffling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Sorteio Geral
              </Button>
              {data.raffle?.winnerId && !data.raffle?.isRaffling && (
                <Button onClick={clearRaffle} variant="outline" className="text-yellow-500 border-yellow-500/20 text-[10px] font-bold uppercase h-10">
                  <Eraser className="w-4 h-4 mr-2" /> Limpar do Overlay
                </Button>
              )}
          </CardContent>
        </Card>

        {/* Desafio Rápido */}
        <Card className="bg-purple-500/10 border-purple-500/20 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase italic text-purple-500 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Desafio Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3">
             <Button onClick={triggerSurpriseChallenge} disabled={approvedParticipants.length < 1 || data.challenge?.isRaffling || loading} className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl text-md font-black uppercase italic shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {data.challenge?.isRaffling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                Novo Desafio
              </Button>
              {data.challenge?.winnerId && !data.challenge?.isRaffling && (
                <Button onClick={clearChallenge} variant="outline" className="text-purple-500 border-purple-500/20 text-[10px] font-bold uppercase h-10">
                  <Eraser className="w-4 h-4 mr-2" /> Limpar do Overlay
                </Button>
              )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 h-12 w-full">
          <TabsTrigger value="main" className="flex-1 font-bold uppercase text-[10px] tracking-widest">Painel Principal</TabsTrigger>
          <TabsTrigger value="moderation" className="flex-1 font-bold uppercase text-[10px] tracking-widest relative">
            Moderação
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                {totalPending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          <Card className="bg-card/30 border-white/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center gap-2">
                <Heart className="w-4 h-4" /> Correio Ativo
              </CardTitle>
              {data.activeMessageId && (
                <Button onClick={clearActiveMessage} variant="ghost" size="sm" className="text-destructive text-[10px] font-bold uppercase">
                  Limpar do Telão
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.activeMessageId ? (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                   <p className="text-white font-bold italic">
                     &ldquo;{data.messages.find(m => m.id === data.activeMessageId)?.content}&rdquo;
                   </p>
                </div>
              ) : (
                <p className="text-[10px] font-bold uppercase text-white/20 text-center italic py-4">Nenhuma mensagem no telão agora.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-secondary/20">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary"><UserPlus className="w-5 h-5" /> Adicionar Participante</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddParticipant} className="flex gap-3">
                <Input placeholder="Nome" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} className="flex-1 bg-black/40 border-secondary/20" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 bg-black/40 border-secondary/20"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {data.categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={!newParticipantName.trim()} className="bg-secondary text-secondary-foreground"><Plus /></Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5">
            <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg font-bold">Ranking Geral</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                  <Button variant="outline" size="sm" onClick={() => setIsBulkDialogOpen(true)} className="text-secondary border-secondary/20 hover:bg-secondary/10 bg-transparent text-[10px] font-bold uppercase">
                    <Settings className="w-4 h-4 mr-1" /> Alterar Todos
                  </Button>
                  <DialogContent className="bg-card border-white/10 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="text-white uppercase font-black italic">Alterar Todos os Usuários</DialogTitle>
                      <DialogDescription className="text-white/60 font-bold">
                        Defina uma nova categoria para todos os participantes aprovados de uma vez.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nova Categoria:</Label>
                        <Select value={bulkCategory} onValueChange={setBulkCategory}>
                          <SelectTrigger className="bg-black/40 border-white/10 h-12"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            {data.categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="space-y-0.5">
                          <Label className="text-white font-bold uppercase text-xs">Zerar pontos de todos?</Label>
                          <p className="text-[10px] text-white/40 font-bold uppercase">Todos voltarão para 0</p>
                        </div>
                        <Switch checked={bulkResetPoints} onCheckedChange={setBulkResetPoints} />
                      </div>
                    </div>
                    <DialogFooter>
                      <AlertDialog open={isConfirmBulkOpen} onOpenChange={setIsConfirmBulkOpen}>
                        <Button onClick={() => setIsConfirmBulkOpen(true)} className="w-full bg-secondary text-secondary-foreground font-black uppercase italic h-12">
                          Aplicar Mudanças
                        </Button>
                        <AlertDialogContent className="bg-card border-white/10 backdrop-blur-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white uppercase font-black italic">Tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60 font-bold">
                              Esta ação alterará a categoria de TODOS os participantes {bulkResetPoints ? "e ZERARÁ todos os pontos!" : "mantendo as pontuações atuais."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsConfirmBulkOpen(false)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkUpdate} className="bg-secondary text-secondary-foreground font-black uppercase italic">Sim, Confirmar!</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={resetOnlyPoints} className="text-primary border-primary/20 hover:bg-primary/10 bg-transparent text-[10px] font-bold uppercase">
                  <History className="w-4 h-4 mr-1" /> Zerar Pontos
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent text-[10px] font-bold uppercase">
                      <RotateCcw className="w-4 h-4 mr-1" /> Zerar Tudo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-white/10 backdrop-blur-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white uppercase font-black italic">Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60 font-bold">
                        Tem certeza que deseja resetar todo o rank? Todos os participantes serão retirados!
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold uppercase">Não</AlertDialogCancel>
                      <AlertDialogAction onClick={resetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase italic">Sim, Zerar Tudo!</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...approvedParticipants].sort((a,b) => {
                if (b.count !== a.count) return b.count - a.count;
                const idxA = data.participants.findIndex(p => p.id === a.id);
                const idxB = data.participants.findIndex(p => p.id === b.id);
                return idxA - idxB;
              }).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                  <div className="flex items-center gap-4">
                    <div className="relative group/img">
                      <Avatar className="w-12 h-12 border-2 border-white/10">
                        <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                        <AvatarFallback className="bg-white/5 font-bold uppercase">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={() => participantFilesRef.current[p.id]?.click()}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-full transition-opacity"
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </button>
                      <input 
                        type="file" accept="image/*" className="hidden" 
                        ref={el => participantFilesRef.current[p.id] = el}
                        onChange={(e) => handleParticipantImageUpload(p.id, e)} 
                      />
                    </div>
                    <div>
                      <span className="font-black text-xl text-white italic uppercase">{p.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Select value={p.category} onValueChange={(val) => updateParticipantCategory(p.id, val)}>
                          <SelectTrigger className="h-6 bg-black/40 border-secondary/20 text-[10px] font-bold uppercase px-2 w-auto min-w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            {data.categories.map(cat => (
                              <SelectItem key={cat} value={cat} className="text-[10px] font-bold uppercase">{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm font-bold text-primary">{p.count} {p.category.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="lg" onClick={() => incrementCount(p.id)} className="bg-primary hover:bg-primary/90 w-16 h-14 text-2xl font-black rounded-2xl"><Plus className="w-8 h-8" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeParticipant(p.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-yellow-500">
                <Trophy className="w-5 h-5" /> Já Sorteados ({raffleWinnersHistory.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetRaffleHistory}
                disabled={raffleWinnersHistory.length === 0}
                className="text-[10px] font-bold uppercase border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10"
              >
                Resetar Sorteios
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {raffleWinnersHistory.length === 0 ? (
                  <p className="text-[10px] font-bold uppercase text-white/20 italic">Ninguém sorteado ainda.</p>
                ) : (
                  raffleWinnersHistory.map((p: any) => (
                    <Badge key={p?.id} className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 font-black uppercase italic py-1">
                      {p?.name}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-500">
                <Zap className="w-5 h-5" /> Já Desafiados ({challengeWinnersHistory.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetChallengeHistory}
                disabled={challengeWinnersHistory.length === 0}
                className="text-[10px] font-bold uppercase border-purple-500/20 text-purple-500 hover:bg-purple-500/10"
              >
                Resetar Desafios
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {challengeWinnersHistory.length === 0 ? (
                  <p className="text-[10px] font-bold uppercase text-white/20 italic">Ninguém desafiado ainda.</p>
                ) : (
                  challengeWinnersHistory.map((p: any) => (
                    <Badge key={p?.id} className="bg-purple-500/20 text-purple-500 border-purple-500/30 font-black uppercase italic py-1">
                      {p?.name}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary">
                <UserCheck className="w-5 h-5" /> Perfis Pendentes ({pendingParticipants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingParticipants.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-white/10">
                      <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                      <AvatarFallback className="bg-white/5 font-bold uppercase">{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-white uppercase italic">{p.name}</span>
                      <div className="mt-1">
                        <Select 
                          value={moderationCategories[p.id] || p.category} 
                          onValueChange={(val) => setModerationCategories(prev => ({ ...prev, [p.id]: val }))}
                        >
                          <SelectTrigger className="h-7 bg-black/40 border-secondary/20 text-[10px] font-bold uppercase px-2 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            {data.categories.map(cat => (
                              <SelectItem key={cat} value={cat} className="text-[10px] font-bold uppercase">{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => moderateParticipant(p.id, 'approved', moderationCategories[p.id])} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-[10px]">
                      <Check className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                    <Button onClick={() => moderateParticipant(p.id, 'rejected')} size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px]">
                      <Ban className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <Heart className="w-5 h-5" /> Correio Elegante ({pendingMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMessages.map(msg => (
                <div key={msg.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary border-none font-bold italic uppercase text-[10px]">De: {msg.from}</Badge>
                      <span className="text-white/20 text-xs">➔</span>
                      <Badge className="bg-secondary/20 text-secondary border-none font-bold italic uppercase text-[10px]">Para: {msg.to}</Badge>
                    </div>
                    <span className="text-white/20 text-xs">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white font-medium italic text-lg leading-tight">&ldquo;{msg.content}&rdquo;</p>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => moderateMessage(msg.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-[10px] tracking-widest">
                      <Check className="w-4 h-4 mr-2" /> Aprovar
                    </Button>
                    <Button onClick={() => moderateMessage(msg.id, 'rejected')} variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest">
                      <Ban className="w-4 h-4 mr-2" /> Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-500">
                <Music className="w-5 h-5" /> Pedidos de Música ({pendingMusic.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMusic.map(m => (
                <div key={m.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-500/20 text-blue-500 border-none font-bold italic uppercase text-[10px]">Pedido Pendente</Badge>
                    <span className="text-white/20 text-[10px]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Banda:</p>
                    <p className="text-white font-black italic text-xl uppercase">{m.artist}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Música:</p>
                    <p className="text-white font-black italic text-xl uppercase">{m.song}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => moderateMusic(m.id, 'approved')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest">
                      <Check className="w-4 h-4 mr-2" /> Aprovar
                    </Button>
                    <Button onClick={() => removeMusicRequest(m.id)} variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest">
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </Button>
                  </div>
                </div>
              ))}

              {approvedMusic.length > 0 && (
                <div className="mt-6 space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Playlist Ativa ({approvedMusic.length})</Label>
                  {approvedMusic.map(m => (
                    <div key={m.id} className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-xl flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Playlist</span>
                        <span className="text-sm font-black italic text-white uppercase">{m.artist} - {m.song}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeMusicRequest(m.id)} className="text-white/20 hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
