'use client';

import { SessionProvider } from 'next-auth/react';
import { AIProvider } from '@/components/ai/AIProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AIProvider>
          {children}
        </AIProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 