
"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Plus, RotateCcw, UserPlus, Trash2, Edit3, Monitor, Beer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function ControlPanel() {
  const { data, updateTitle, addParticipant, incrementCount, resetCounts, removeParticipant } = useCounter();
  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Cerveja");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(data.title);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      addParticipant(newParticipantName.trim(), selectedCategory);
      setNewParticipantName("");
    }
  };

  const handleUpdateTitle = () => {
    updateTitle(tempTitle);
    setEditingTitle(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Title Editor */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Título do Evento
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingTitle(!editingTitle);
            setTempTitle(data.title);
          }}>
            <Edit3 className="w-4 h-4 text-primary" />
          </Button>
        </CardHeader>
        <CardContent>
          {editingTitle ? (
            <div className="flex space-x-2">
              <Input 
                value={tempTitle} 
                onChange={(e) => setTempTitle(e.target.value)}
                className="bg-background/50"
              />
              <Button onClick={handleUpdateTitle} variant="default" className="bg-primary hover:bg-primary/80">Salvar</Button>
            </div>
          ) : (
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]">
              {data.title}
            </h2>
          )}
        </CardContent>
      </Card>

      {/* Add Participant */}
      <Card className="bg-card/50 backdrop-blur-sm border-secondary/20 shadow-xl shadow-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary">
            <UserPlus className="w-5 h-5" />
            Adicionar Participante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddParticipant} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <Input 
                placeholder="Nome da lenda" 
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                className="bg-background/50 border-secondary/20"
              />
            </div>
            <div className="sm:col-span-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background/50 border-secondary/20">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="sm:col-span-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold">
              +
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card className="bg-card/50 backdrop-blur-md border-white/5 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-white">Ranking em Tempo Real</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetCounts} className="text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent">
              <RotateCcw className="w-4 h-4 mr-1" />
              Zerar
            </Button>
            <Button variant="outline" size="sm" asChild className="border-primary/20 bg-transparent">
              <Link href="/overlay" target="_blank">
                <Monitor className="w-4 h-4 mr-1 text-primary" />
                Overlay
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.participants.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-xl">
                <Beer className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground italic">Ninguém bebendo? Adicione alguém!</p>
              </div>
            ) : (
              [...data.participants].sort((a,b) => b.count - a.count).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all duration-300">
                  <div className="flex flex-col">
                    <span className="font-black text-xl text-white tracking-tight uppercase italic">{p.name}</span>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="border-secondary/30 text-secondary text-[10px] uppercase font-bold px-2 py-0">
                        {p.category}
                      </Badge>
                      <span className="text-sm font-bold text-primary">
                        {p.count} consumidos
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      size="lg" 
                      onClick={() => incrementCount(p.id)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 w-16 h-14 text-2xl font-black rounded-2xl shadow-lg shadow-primary/20 transition-transform active:scale-90"
                    >
                      <Plus className="w-8 h-8" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeParticipant(p.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
