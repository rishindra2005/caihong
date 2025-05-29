'use client';

import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Glitch effect for 404 */}
        <div className="relative">
          <h1 className="text-[12rem] font-bold leading-none tracking-tighter">
            <span className="relative inline-block animate-float-slow">
              <span className="absolute -inset-2 bg-blue-500/20 blur-xl rounded-full"></span>
              404
            </span>
          </h1>
          
          {/* Error lines animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent w-full"
                style={{
                  top: `${20 + i * 20}%`,
                  animation: `scan 3s ${i * 0.5}s linear infinite`,
                  opacity: 0.5
                }}
              ></div>
            ))}
          </div>
        </div>

        <h2 className="mt-8 text-3xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Page Not Found
        </h2>
        
        <p className="mt-4 text-xl text-gray-300 max-w-md mx-auto">
          Looks like you've ventured into uncharted territory. Let's get you back on track.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group"
          >
            <HomeIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
            <span>Return Home</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Go Back</span>
          </button>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random() * 4}s linear ${Math.random() * 2}s infinite`
            }}
          />
        ))}
      </div>
    </div>
  );
} 