"use client";

import { useState, useEffect, useRef } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { 
  Plus, RotateCcw, UserPlus, Trash2, Edit3, Monitor, 
  Beer, Sparkles, Loader2, Wine, CupSoda, GlassWater, 
  Trophy, Star, Flame, Music, Pizza, Settings2, X, Upload, Zap, EyeOff, Megaphone,
  Heart, Check, Ban, ImageIcon, History, ExternalLink, HeartOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

const ICON_OPTIONS = [
  { id: 'Beer', icon: Beer },
  { id: 'Wine', icon: Wine },
  { id: 'CupSoda', icon: CupSoda },
  { id: 'GlassWater', icon: GlassWater },
  { id: 'Trophy', icon: Trophy },
  { id: 'Star', icon: Star },
  { id: 'Flame', icon: Flame },
  { id: 'Music', icon: Music },
  { id: 'Pizza', icon: Pizza },
];

export function ControlPanel() {
  const { 
    data, loading, isInitializing, 
    updateTitle, updateBrand, updatePhrases, updateBrandImage,
    addParticipant, updateParticipantImage, incrementCount, resetAll, resetOnlyPoints,
    removeParticipant, triggerRaffle, triggerSurpriseChallenge, clearChallenge,
    triggerAnnouncement, moderateMessage, clearElegantMessages
  } = useCounter();

  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Cerveja");
  const [newPhrase, setNewPhrase] = useState("");
  const [customAnnouncement, setCustomAnnouncement] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const participantFilesRef = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      addParticipant(newParticipantName.trim(), selectedCategory);
      setNewParticipantName("");
    }
  };

  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      updatePhrases([...data.customPhrases, newPhrase.trim()]);
      setNewPhrase("");
    }
  };

  const handleRemovePhrase = (index: number) => {
    const updated = data.customPhrases.filter((_, i) => i !== index);
    updatePhrases(updated);
  };

  const handleSendAnnouncement = () => {
    if (customAnnouncement.trim()) {
      triggerAnnouncement(customAnnouncement);
      setCustomAnnouncement("");
    }
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

  const handleBrandImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma imagem de até 2MB.");
        return;
      }
      handleImageCompression(file, (url) => updateBrandImage(url), 800);
    }
  };

  const handleParticipantImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCompression(file, (url) => updateParticipantImage(id, url), 400);
    }
  };

  const hasPersistentChallenge = data.raffle?.winnerId && data.raffle?.type === 'challenge' && !data.raffle?.isRaffling;
  const pendingMessages = data.messages.filter(m => m.status === 'pending');
  const hasActiveMessage = data.messages.some(m => m.status === 'approved');

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 h-12 w-full">
          <TabsTrigger value="main" className="flex-1 font-bold uppercase text-[10px] tracking-widest">Painel Principal</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1 font-bold uppercase text-[10px] tracking-widest relative">
            Correio Elegante
            {pendingMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                {pendingMessages.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <Accordion type="single" collapsible>
              <AccordionItem value="settings" className="border-none">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-widest text-xs">
                    <Settings2 className="w-4 h-4" />
                    Personalizar Identidade e Overlay
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-white/40">Título do Ranking</label>
                      <Input 
                        placeholder="Ex: Resenha Épica" 
                        value={data.title} 
                        onChange={(e) => updateTitle(e.target.value)}
                        className="bg-black/20 border-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-white/40">Nome da Marca</label>
                        <Input 
                          value={data.brandName} 
                          onChange={(e) => updateBrand(e.target.value, data.brandIcon)}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-white/40">Logo Personalizada (Máx. 2MB)</label>
                        <div className="flex items-center gap-3">
                          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleBrandImageUpload} />
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-10">
                            <Upload className="w-4 h-4 mr-2" /> Upload
                          </Button>
                          {data.brandImageUrl && (
                            <div className="relative group">
                              <img src={data.brandImageUrl} className="w-10 h-10 rounded-lg object-cover border border-white/20" alt="Brand Logo" />
                              <button onClick={() => updateBrandImage("")} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!data.brandImageUrl && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-white/40">Ou ícone padrão</label>
                        <div className="flex flex-wrap gap-2">
                          {ICON_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => updateBrand(data.brandName, opt.id)}
                              className={`p-2 rounded-lg border transition-all ${data.brandIcon === opt.id ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-black/20 border-white/10 text-white/40 hover:border-white/20'}`}
                            >
                              <opt.icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-white/40">Frases do Overlay</label>
                      <div className="flex gap-2 mb-3">
                        <Input placeholder="Nova frase..." value={newPhrase} onChange={(e) => setNewPhrase(e.target.value)} className="bg-black/20 border-white/10" />
                        <Button onClick={handleAddPhrase} className="bg-secondary text-secondary-foreground"><Plus className="w-4 h-4" /></Button>
                      </div>
                      <div className="space-y-2">
                        {data.customPhrases.map((phrase, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white/80">
                            {phrase}
                            <button onClick={() => handleRemovePhrase(i)} className="text-white/20 hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-bold uppercase text-white/40">Aviso Urgente (Buzina)</label>
                      <div className="flex gap-2">
                        <Input placeholder="Digite o aviso..." value={customAnnouncement} onChange={(e) => setCustomAnnouncement(e.target.value)} className="bg-black/20 border-white/10" />
                        <Button onClick={handleSendAnnouncement} disabled={!customAnnouncement.trim()} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                          <Megaphone className="w-4 h-4 mr-2" /> ENVIAR
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={triggerRaffle} disabled={data.participants.length < 2 || data.raffle?.isRaffling || loading} className="bg-gradient-to-r from-yellow-500 to-red-500 h-16 rounded-2xl text-lg font-black uppercase italic shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse disabled:opacity-50 disabled:animate-none">
              {data.raffle?.isRaffling ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
              Sorteio Top 6
            </Button>
            <Button onClick={triggerSurpriseChallenge} disabled={data.participants.length < 1 || data.raffle?.isRaffling || loading} className="bg-gradient-to-r from-purple-500 to-blue-500 h-16 rounded-2xl text-lg font-black uppercase italic shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse disabled:opacity-50 disabled:animate-none">
              {data.raffle?.isRaffling ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Zap className="mr-2 h-6 w-6" />}
              Desafio Surpresa
            </Button>
          </div>

          <div className="space-y-4">
            {hasPersistentChallenge && (
              <Button onClick={clearChallenge} variant="outline" className="w-full h-12 rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <EyeOff className="w-4 h-4" /> Remover Aviso de Desafio
              </Button>
            )}

            {hasActiveMessage && (
              <Button onClick={clearElegantMessages} variant="outline" className="w-full h-12 rounded-xl border-pink-500/30 text-pink-400 hover:bg-pink-500/10 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <HeartOff className="w-4 h-4" /> Remover Mensagem do Telão
              </Button>
            )}
          </div>

          <Card className="bg-card/50 border-secondary/20">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary"><UserPlus className="w-5 h-5" /> Adicionar Participante</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddParticipant} className="flex gap-3">
                <Input placeholder="Nome" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} className="flex-1 bg-black/40 border-secondary/20" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 bg-black/40 border-secondary/20"><SelectValue /></SelectTrigger>
                  <SelectContent>{data.categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="submit" disabled={!newParticipantName.trim()} className="bg-secondary text-secondary-foreground"><Plus /></Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Participantes</CardTitle>
              <div className="flex items-center gap-2">
                <Link href="/overlay" target="_blank">
                  <Button variant="outline" size="sm" className="text-secondary border-secondary/20 hover:bg-secondary/10 bg-transparent">
                    <Monitor className="w-4 h-4 mr-1" /> Abrir Overlay
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={resetOnlyPoints} className="text-primary border-primary/20 hover:bg-primary/10 bg-transparent">
                  <History className="w-4 h-4 mr-1" /> Zerar Pontos
                </Button>
                <Button variant="outline" size="sm" onClick={resetAll} className="text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-1" /> Zerar Tudo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...data.participants].sort((a,b) => b.count - a.count).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                  <div className="flex items-center gap-4">
                    <div className="relative group/img">
                      <Avatar className="w-12 h-12 border-2 border-white/10">
                        {p.imageUrl ? <AvatarImage src={p.imageUrl} className="object-cover" /> : null}
                        <AvatarFallback className="bg-white/5"><ImageIcon className="w-4 h-4 text-white/20" /></AvatarFallback>
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
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="border-secondary/30 text-secondary text-[10px] uppercase">{p.category}</Badge>
                        <span className="text-sm font-bold text-primary">{p.count} pontos</span>
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

        <TabsContent value="messages">
          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <Heart className="w-5 h-5" /> Moderação: Correio Elegante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMessages.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="w-12 h-12 text-white/5 mx-auto mb-4" />
                  <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Nenhuma mensagem pendente</p>
                </div>
              ) : (
                pendingMessages.map(msg => (
                  <div key={msg.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-none font-bold italic uppercase text-[10px]">De: {msg.from}</Badge>
                        <span className="text-white/20 text-xs">➔</span>
                        <Badge className="bg-secondary/20 text-secondary border-none font-bold italic uppercase text-[10px]">Para: {msg.to}</Badge>
                      </div>
                      <span className="text-white/20 text-[10px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
