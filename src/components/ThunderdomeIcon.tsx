
"use client";

import React from 'react';

/**
 * Ícone personalizado baseado no símbolo da Cúpula do Trovão (Thunderdome).
 * Representa um volante com chamas e uma caveira central.
 */
export function ThunderdomeIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor"
    >
      {/* Chamas no topo */}
      <path 
        d="M20,45 C20,15 35,25 40,10 C45,25 55,25 60,10 C65,25 80,15 80,45" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Aro do Volante */}
      <circle cx="50" cy="60" r="32" strokeWidth="6" />
      {/* Barra Horizontal */}
      <line x1="18" y1="60" x2="82" y2="60" strokeWidth="6" strokeLinecap="round" />
      {/* Caveira Central */}
      <path 
        d="M40,55 C40,42 60,42 60,55 L60,68 C60,75 50,78 50,78 C50,78 40,75 40,68 Z" 
        fill="currentColor" 
        stroke="none"
      />
      {/* Olhos da Caveira */}
      <circle cx="45" cy="55" r="3" fill="black" stroke="none" />
      <circle cx="55" cy="55" r="3" fill="black" stroke="none" />
      {/* Dentes/Mandíbula */}
      <line x1="46" y1="70" x2="46" y2="74" stroke="black" strokeWidth="2" />
      <line x1="50" y1="70" x2="50" y2="74" stroke="black" strokeWidth="2" />
      <line x1="54" y1="70" x2="54" y2="74" stroke="black" strokeWidth="2" />
    </svg>
  );
}
