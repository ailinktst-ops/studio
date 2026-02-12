"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { ShieldCheck, Lock, UserPlus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

export default function AdminSignupPage() {
  const { data, addAdmin, isInitializing } = useCounter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (username.toLowerCase() === "link") {
      setStatus('error');
      setErrorMessage("O nome de usuário 'Link' é reservado para o Master.");
      return;
    }

    const success = addAdmin({
      username: username.trim(),
      password: password.trim()
    });
    
    if (success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage("Este nome de usuário já está em uso.");
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
          <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Novo <span className="text-primary">Administrador</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            {data.brandName} • Cadastro de Gestor
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8">
            {status === 'success' ? (
              <div className="py-10 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white">Acesso Criado!</h3>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2 mb-8">
                  Você já pode acessar o painel administrativo com suas credenciais.
                </p>
                <Link href="/">
                  <Button className="w-full h-14 bg-primary text-white font-black uppercase italic">
                    Ir para Login <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Nome de Usuário:</label>
                  <div className="relative">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      placeholder="Ex: admin_joao" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={20}
                      className="bg-black/40 border-white/10 h-14 pl-12 text-lg font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Senha de Acesso:</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      type="password"
                      placeholder="Crie uma senha forte" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/40 border-white/10 h-14 pl-12 text-lg font-bold"
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={!username.trim() || !password.trim()}
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-black italic uppercase tracking-tighter rounded-xl shadow-lg"
                >
                  Criar Perfil Admin
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
