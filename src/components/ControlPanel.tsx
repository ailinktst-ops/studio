
"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Plus, RotateCcw, UserPlus, Trash2, Edit3, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function ControlPanel() {
  const { data, updateTitle, addParticipant, incrementCount, resetCounts, removeParticipant } = useCounter();
  const [newParticipantName, setNewParticipantName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(data.title);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      addParticipant(newParticipantName.trim());
      setNewParticipantName("");
    }
  };

  const handleUpdateTitle = () => {
    updateTitle(tempTitle);
    setEditingTitle(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      {/* Title Editor */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Título do Ranking
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingTitle(!editingTitle);
            setTempTitle(data.title);
          }}>
            <Edit3 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {editingTitle ? (
            <div className="flex space-x-2">
              <Input 
                value={tempTitle} 
                onChange={(e) => setTempTitle(e.target.value)}
                className="font-headline font-bold text-lg"
              />
              <Button onClick={handleUpdateTitle} variant="secondary">Salvar</Button>
            </div>
          ) : (
            <h2 className="text-2xl font-bold font-headline text-primary">{data.title}</h2>
          )}
        </CardContent>
      </Card>

      {/* Add Participant */}
      <Card className="shadow-sm border-secondary/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-secondary" />
            Adicionar Participante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddParticipant} className="flex space-x-2">
            <Input 
              placeholder="Nome da pessoa" 
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
            />
            <Button type="submit" className="bg-secondary hover:bg-secondary/90">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Participantes</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetCounts} className="text-destructive border-destructive/20 hover:bg-destructive/10">
              <RotateCcw className="w-4 h-4 mr-1" />
              Zerar Tudo
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/overlay" target="_blank">
                <Monitor className="w-4 h-4 mr-1" />
                Ver Overlay
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.participants.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 italic">Nenhum participante adicionado ainda.</p>
            ) : (
              data.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted group transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{p.name}</span>
                    <Badge variant="secondary" className="w-fit">
                      {p.count} consumidos
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="lg" 
                      onClick={() => incrementCount(p.id)}
                      className="bg-primary hover:bg-primary/90 w-16 h-12 text-xl font-bold rounded-full shadow-lg"
                    >
                      <Plus className="w-6 h-6" />
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
