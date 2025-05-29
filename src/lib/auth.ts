import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { Adapter } from 'next-auth/adapters';
import clientPromise from './mongodb';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          credits: typeof user.credits === 'number' ? user.credits : 0,
          role: user.role || 'user'
        }
      };
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
    signOut: '/'
  }
}; 