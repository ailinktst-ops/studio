"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Heart, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CorreioPage() {
  const { data, sendElegantMessage, isInitializing } = useCounter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from.trim() && to.trim() && content.trim()) {
      sendElegantMessage(from, to, content);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setFrom("");
        setTo("");
        setContent("");
      }, 3000);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-correio/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-correio/20">
            <Heart className="w-10 h-10 text-correio animate-pulse" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Correio <span className="text-correio">Elegante</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            {data.brandName} • Mande seu recado!
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8">
            {sent ? (
              <div className="py-10 text-center animate-in zoom-in duration-300">
                <Heart className="w-20 h-20 text-correio mx-auto mb-6" />
                <h3 className="text-2xl font-black italic uppercase text-white">Enviado com Sucesso!</h3>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2">
                  Aguarde a aprovação para aparecer no telão
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">De:</label>
                  <Input 
                    placeholder="Seu nome ou apelido" 
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Para:</label>
                  <Input 
                    placeholder="Quem vai receber?" 
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Recado:</label>
                  <Textarea 
                    placeholder="Sua mensagem aqui..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-black/40 border-white/10 min-h-[120px] font-bold"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!from || !to || !content}
                  className="w-full h-14 bg-correio hover:bg-correio/90 text-white text-lg font-black italic uppercase tracking-tighter rounded-xl"
                >
                  <Send className="w-5 h-5 mr-2" /> Enviar para o Telão
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <footer className="text-center">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} {data.brandName}
          </p>
        </footer>
      </div>
    </div>
  );
}
