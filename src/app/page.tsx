
"use client";

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ControlPanel } from "@/components/ControlPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useCounter } from "@/hooks/useCounter";
import { 
  LayoutDashboard, Settings2, Beer, Wine, CupSoda, GlassWater, 
  Trophy, Star, Flame, Music, Pizza, Lock, LogIn, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ICON_MAP: Record<string, any> = {
  Beer, Wine, CupSoda, GlassWater, Trophy, Star, Flame, Music, Pizza
};

export default function Home() {
  const { data } = useCounter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Link" && password === "123412") {
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };
  
  const brandName = data?.brandName || "RankUp Counter";
  const brandIcon = data?.brandIcon || "Beer";
  const brandImageUrl = data?.brandImageUrl || "";
  const customPhrases = data?.customPhrases || [];
  
  const BrandIcon = ICON_MAP[brandIcon] || Beer;
  const nameParts = brandName.split(' ');
  const firstName = nameParts[0];
  const restOfName = nameParts.slice(1).join(' ');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="bg-primary/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] rotate-3">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Acesso <span className="text-secondary">Restrito</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
              Área Administrativa do {brandName}
            </p>
          </div>

          <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
            <CardContent className="pt-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Usuário:</label>
                  <Input 
                    placeholder="Seu usuário" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 font-bold focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Senha:</label>
                  <Input 
                    type="password"
                    placeholder="Sua senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 font-bold focus:ring-primary"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-[10px] font-bold uppercase">{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black italic uppercase tracking-tighter rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <LogIn className="w-5 h-5 mr-2" /> Acessar Painel
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <p className="text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            Apenas pessoal autorizado
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <header className="py-10 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "bg-primary rounded-xl text-primary-foreground shadow-[0_0_20px_rgba(168,85,247,0.3)] rotate-3 overflow-hidden flex items-center justify-center transition-all",
              brandImageUrl ? "w-12 h-12 p-0" : "w-14 h-14 p-3"
            )}>
              {brandImageUrl ? (
                <img src={brandImageUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <BrandIcon className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                {firstName} <span className="text-secondary drop-shadow-[0_0_8px_rgba(0,128,128,0.5)]">{restOfName}</span>
              </h1>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                {customPhrases[0] || "A Elite da Resenha em Tempo Real"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setIsAuthorized(false)}
            className="text-white/40 hover:text-white font-bold uppercase text-[10px] tracking-widest"
          >
            Sair do Painel
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-4 px-4 pb-20">
        <Tabs defaultValue="control" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-16 w-full max-w-md backdrop-blur-md">
              <TabsTrigger value="control" className="flex-1 flex items-center gap-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-white/60 font-black italic uppercase transition-all">
                <LayoutDashboard className="w-5 h-5" />
                Painel
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 flex items-center gap-3 rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-white/60 font-black italic uppercase transition-all">
                <Settings2 className="w-5 h-5" />
                Personalizar
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="control" className="mt-0 focus-visible:outline-none">
            <ControlPanel />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="py-12 text-center text-white/20 text-xs font-bold uppercase tracking-[0.3em]">
        &copy; {new Date().getFullYear()} {brandName} • Desenvolvido para Momentos Épicos
      </footer>
    </main>
  );
}
