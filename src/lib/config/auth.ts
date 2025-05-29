// NextAuth configuration with:
// - Google OAuth
// - MongoDB adapter
// - Session handling

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { Adapter } from 'next-auth/adapters';
import clientPromise from '../db/mongodb';
import { compare, hash } from 'bcryptjs';
import mongoose from 'mongoose';

// Build providers array based on environment
const providers: NextAuthOptions['providers'] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: "select_account"
      }
    }
  })
];

// Add Credentials provider in development mode only
if (process.env.NODE_ENV === 'development') {
  providers.push(
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "hello@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          await mongoose.connect(process.env.MONGODB_URI!);
          const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
          
          const user = await User.findOne({ email: credentials.email.toLowerCase() });
          
          // User doesn't exist
          if (!user) {
            // Create new user with hashed password in development mode
            const hashedPassword = await hash(credentials.password, 12);
            const newUser = await User.create({
              email: credentials.email.toLowerCase(),
              password: hashedPassword,
              name: credentials.email.split('@')[0],
              credits: 100, // Default credits
              role: 'user'
            });
            
            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              credits: newUser.credits,
              role: newUser.role
            };
          }
          
          // User exists, check if password is set
          if (!user.password) {
            // First time login with email, set password
            user.password = await hash(credentials.password, 12);
            await user.save();
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              credits: user.credits,
              role: user.role || 'user'
            };
          }
          
          // Verify password
          const isPasswordValid = await compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            credits: user.credits,
            role: user.role || 'user'
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  providers,
  callbacks: {
    async session({ session, user, token }) {
      // When using JWT (with credentials provider), user data comes from the token
      if (token && !user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub,
            credits: token.credits as number || 0,
            role: token.role as string || 'user'
          }
        };
      }
      
      // When using database sessions (with OAuth providers)
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          credits: typeof user.credits === 'number' ? user.credits : 0,
          role: user.role || 'user'
        }
      };
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.credits = user.credits;
        token.role = user.role || 'user';
      }
      return token;
    }
  },
  // Use JWT for credentials provider in development, otherwise use database sessions
  session: {
    strategy: process.env.NODE_ENV === 'development' ? 'jwt' : 'database'
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
    signOut: '/'
  }
};

