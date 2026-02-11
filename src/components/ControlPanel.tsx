
"use client";

import { useState, useEffect, useRef } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { 
  Plus, RotateCcw, UserPlus, Trash2, Edit3, Monitor, 
  Beer, Sparkles, Loader2, Wine, CupSoda, GlassWater, 
  Trophy, Star, Flame, Music, Pizza, Settings2, X, Upload, Image as ImageIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    addParticipant, incrementCount, resetCounts, 
    removeParticipant, triggerRaffle 
  } = useCounter();

  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Cerveja");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.title && !editingTitle) setTempTitle(data.title);
  }, [data.title, editingTitle]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma imagem de até 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBrandImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBrandImage = () => {
    updateBrandImage("");
  };

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
      {/* Configurações de Aparência */}
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
                    <label className="text-[10px] font-bold uppercase text-white/40">Logo Personalizada (Upload)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-10"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </Button>
                      {data.brandImageUrl && (
                        <div className="relative group">
                          <img src={data.brandImageUrl} className="w-10 h-10 rounded-lg object-cover border border-white/20" alt="Brand Logo" />
                          <button 
                            onClick={removeBrandImage}
                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!data.brandImageUrl && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">Ou escolha um Ícone Padrão</label>
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
                    <Input 
                      placeholder="Nova frase para o letreiro..." 
                      value={newPhrase}
                      onChange={(e) => setNewPhrase(e.target.value)}
                      className="bg-black/20 border-white/10"
                    />
                    <Button onClick={handleAddPhrase} className="bg-secondary text-secondary-foreground"><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    {data.customPhrases.map((phrase, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white/80">
                        {phrase}
                        <button onClick={() => handleRemovePhrase(i)} className="text-white/20 hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <Button 
        onClick={triggerRaffle} 
        disabled={data.participants.length < 2 || data.raffle?.isRaffling || loading}
        className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:to-red-600 h-16 rounded-2xl text-xl font-black uppercase italic tracking-tighter shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse disabled:opacity-50 disabled:animate-none"
      >
        {data.raffle?.isRaffling ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
        {data.raffle?.isRaffling ? "Sorteio em Andamento..." : "Sorteio entre o Top 6!"}
      </Button>

      {/* Título do Evento */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Evento Atual</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setEditingTitle(!editingTitle)}>
            <Edit3 className="w-4 h-4 text-primary" />
          </Button>
        </CardHeader>
        <CardContent>
          {editingTitle ? (
            <div className="flex space-x-2">
              <Input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="bg-black/40" autoFocus />
              <Button onClick={() => { updateTitle(tempTitle); setEditingTitle(false); }} className="bg-primary">OK</Button>
            </div>
          ) : (
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]">{data.title}</h2>
          )}
        </CardContent>
      </Card>

      {/* Adicionar Participante */}
      <Card className="bg-card/50 border-secondary/20">
        <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary"><UserPlus className="w-5 h-5" /> Adicionar Lenda</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAddParticipant} className="flex gap-3">
            <Input 
              placeholder="Nome" value={newParticipantName} 
              onChange={(e) => setNewParticipantName(e.target.value)} 
              className="flex-1 bg-black/40 border-secondary/20"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32 bg-black/40 border-secondary/20"><SelectValue /></SelectTrigger>
              <SelectContent>{data.categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="submit" disabled={!newParticipantName.trim()} className="bg-secondary text-secondary-foreground"><Plus /></Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Participantes */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Participantes</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetCounts} className="text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent">
              <RotateCcw className="w-4 h-4 mr-1" /> Zerar Tudo
            </Button>
            <Button variant="outline" size="sm" asChild className="border-primary/20 bg-transparent">
              <Link href="/overlay" target="_blank"><Monitor className="w-4 h-4 mr-1 text-primary" /> Overlay</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...data.participants].sort((a,b) => b.count - a.count).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
              <div>
                <span className="font-black text-xl text-white italic uppercase">{p.name}</span>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="border-secondary/30 text-secondary text-[10px] uppercase font-bold">{p.category}</Badge>
                  <span className="text-sm font-bold text-primary">{p.count} pontos</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button size="lg" onClick={() => incrementCount(p.id)} className="bg-primary hover:bg-primary/90 w-16 h-14 text-2xl font-black rounded-2xl"><Plus className="w-8 h-8" /></Button>
                <Button variant="ghost" size="icon" onClick={() => removeParticipant(p.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
