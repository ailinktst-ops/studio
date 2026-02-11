
"use client";

import React from 'react';

/**
 * Ícone simplificado e estilizado da Cúpula do Trovão (Thunderdome).
 * Foca na definição do centro: Volante, Caveira e Chamas superiores.
 */
export function ThunderdomeIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Chamas Superiores - Estilizadas e Definidas */}
      <path 
        d="M25 40C25 10 38 25 42 5C46 25 54 25 58 5C62 25 75 10 75 40" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Aro do Volante - Grosso para melhor definição */}
      <circle cx="50" cy="62" r="30" stroke="currentColor" strokeWidth="7" />
      
      {/* Barra Horizontal do Volante */}
      <path d="M20 62H80" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      
      {/* Caveira Central - Silhueta Marcante */}
      <path 
        d="M42 52C42 46 58 46 58 52V68C58 74 50 76 50 76C50 76 42 74 42 68V52Z" 
        fill="currentColor" 
      />
      
      {/* Detalhes da Caveira (Olhos) em negativo */}
      <circle cx="46" cy="56" r="2.5" fill="black" />
      <circle cx="54" cy="56" r="2.5" fill="black" />
      
      {/* Detalhes da Mandíbula */}
      <line x1="47" y1="70" x2="47" y2="74" stroke="black" strokeWidth="1.5" />
      <line x1="50" y1="70" x2="50" y2="74" stroke="black" strokeWidth="1.5" />
      <line x1="53" y1="70" x2="53" y2="74" stroke="black" strokeWidth="1.5" />
    </svg>
  );
}
