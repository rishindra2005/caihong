// NextAuth configuration with:
// - Google OAuth
// - MongoDB adapter
// - Session handling

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { Adapter } from 'next-auth/adapters';
import clientPromise from '../db/mongodb';
import { DefaultSession } from 'next-auth';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/config/auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      credits: number;
      role?: string;
    } & DefaultSession['user']
  }
  
  interface User {
    credits: number;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    credits?: number;
    role?: string;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };