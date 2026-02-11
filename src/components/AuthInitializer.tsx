
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

/**
 * Componente invisível que garante que o usuário esteja autenticado anonimamente.
 * Necessário para que as regras de segurança do Firestore permitam a gravação de dados.
 */
export function AuthInitializer() {
  const auth = useAuth();

  useEffect(() => {
    if (auth) {
      signInAnonymously(auth).catch((error) => {
        console.error("Erro ao realizar login anônimo:", error);
      });
    }
  }, [auth]);

  return null;
}
