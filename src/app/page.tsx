
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ControlPanel } from "@/components/ControlPanel";
import { RankingBoard } from "@/components/RankingBoard";
import { LayoutDashboard, Trophy, Beer } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      <header className="py-10 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-primary-foreground shadow-[0_0_20px_rgba(168,85,247,0.5)] rotate-3">
              <Beer className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                RankUp <span className="text-secondary drop-shadow-[0_0_8px_rgba(0,128,128,0.5)]">Counter</span>
              </h1>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                A Elite da Resenha em Tempo Real
              </p>
            </div>
          </div>
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
              <TabsTrigger value="view" className="flex-1 flex items-center gap-3 rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-white/60 font-black italic uppercase transition-all">
                <Trophy className="w-5 h-5" />
                Ranking
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="control" className="mt-0 focus-visible:outline-none">
            <ControlPanel />
          </TabsContent>
          
          <TabsContent value="view" className="mt-0 focus-visible:outline-none">
            <div className="bg-black/20 rounded-[2rem] border border-white/5 backdrop-blur-sm">
              <RankingBoard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="py-12 text-center text-white/20 text-xs font-bold uppercase tracking-[0.3em]">
        &copy; {new Date().getFullYear()} RankUp • Desenvolvido para Momentos Épicos
      </footer>
    </main>
  );
}
