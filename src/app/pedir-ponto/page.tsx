"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Plus, Check, Loader2, Beer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

export default function PedirPontoPage() {
  const { data, sendPointRequest, isInitializing } = useCounter();
  const [requestedId, setRequestedId] = useState<string | null>(null);

  const approvedParticipants = data.participants.filter(p => p.status === 'approved');

  const handleRequest = (participantId: string, participantName: string) => {
    sendPointRequest(participantId, participantName);
    setRequestedId(participantId);
    
    toast({
      title: "Pedido de Bebida Enviado!",
      description: `Sua bebida já foi solicitada, ${participantName}.`,
    });

    setTimeout(() => setRequestedId(null), 3000);
  };

  const getParticipantAvatar = (p: any) => {
    if (p.imageUrl) return p.imageUrl;
    return `https://picsum.photos/seed/${p.id}-character-human-face/200/200`;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-secondary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary/20">
            <Beer className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
            Pedir <span className="text-secondary">Bebida</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2">
            {data.brandName} • O que vai ser?
          </p>
        </div>

        <div className="space-y-3">
          {approvedParticipants.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-10 text-center">
              <p className="text-white/20 font-bold uppercase italic tracking-widest text-sm">
                Nenhum participante no ranking ainda.
              </p>
            </Card>
          ) : (
            approvedParticipants.map((p) => (
              <Card key={p.id} className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-white/10 shadow-lg">
                      <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                      <AvatarFallback className="bg-white/5 font-black uppercase text-xl">
                        {p.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-white font-black italic uppercase text-lg truncate leading-none mb-1">
                        {p.name}
                      </p>
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest">
                        {p.count} {p.category.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleRequest(p.id, p.name)}
                    disabled={requestedId === p.id}
                    className={`w-14 h-14 rounded-2xl shadow-lg transition-all active:scale-95 ${requestedId === p.id ? 'bg-green-600' : 'bg-secondary hover:bg-secondary/90'}`}
                  >
                    {requestedId === p.id ? (
                      <Check className="w-8 h-8 text-white" />
                    ) : (
                      <Plus className="w-8 h-8 text-white" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <footer className="text-center pt-8">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} {data.brandName}
          </p>
        </footer>
      </div>
    </div>
  );
}
