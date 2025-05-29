import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/config/auth';
import Link from 'next/link';
import {
  BeakerIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  const isStarted = process.env.START === 'true';

  const features = [
    {
      icon: <SparklesIcon className="w-8 h-8" />,
      title: "AI-Powered LaTeX Assistance",
      description: "Smart autocomplete, syntax fixes, and AI-driven formula generation"
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Real-Time Collaboration",
      description: "Work together with your team in real-time on LaTeX documents"
    },
    {
      icon: <CloudArrowUpIcon className="w-8 h-8" />,
      title: "Cloud Storage & Sync",
      description: "Access your work anywhere with secure cloud storage"
    },
    {
      icon: <DocumentTextIcon className="w-8 h-8" />,
      title: "Integrated PDF Preview",
      description: "See changes instantly with real-time PDF rendering"
    },
    {
      icon: <BeakerIcon className="w-8 h-8" />,
      title: "Template Library",
      description: "Start quickly with pre-made academic and professional templates"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                <span>CAI_HONG</span>
              </Link>
              
              <div className="hidden md:block ml-10">
                <div className="flex items-center space-x-4">
                  {['Features', 'Pricing', 'Documentation', 'Contact'].map((item) => (
                    <Link
                      key={item}
                      href={`/${item.toLowerCase()}`}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              {isStarted ? (
                session ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Sign In
                  </Link>
                )
              ) : (
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-not-allowed opacity-75"
                  disabled
                >
                  Coming Soon
                  <ClockIcon className="ml-2 -mr-1 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {!isStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10 rounded-lg">
              <div className="text-center p-8 bg-white/10 rounded-xl backdrop-blur-md">
                <ClockIcon className="w-16 h-16 mx-auto text-blue-400 animate-pulse" />
                <h2 className="mt-4 text-3xl font-bold text-white">Coming Soon!</h2>
                <p className="mt-2 text-lg text-blue-200">We're working hard to bring you something amazing.</p>
                <p className="mt-4 text-sm text-blue-300">Join our waitlist to be notified when we launch!</p>
                <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Join Waitlist
                </button>
              </div>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Next-Gen LaTeX Collaboration with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Assistance
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            CAI_HONG enhances your LaTeX experience with AI-driven suggestions, real-time collaboration, and cloud-based document management.
          </p>
          <div className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12">
            {isStarted ? (
              session ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all transform hover:scale-105"
                >
                  Start Working
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all transform hover:scale-105"
                >
                  Get Started Free
                </Link>
              )
            ) : (
              <button
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all cursor-not-allowed opacity-75"
                disabled
              >
                Coming Soon
                <ClockIcon className="ml-2 h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to write LaTeX
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Powerful features to make LaTeX writing easier and more collaborative
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative group bg-white dark:bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div>
                  <span className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg">
                    {feature.icon}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              {isStarted ? "Start writing smarter today" : "Coming Soon - Get Ready!"}
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              {isStarted 
                ? "Join thousands of researchers and professionals using CAI_HONG"
                : "Be among the first to experience the future of LaTeX writing"}
            </p>
            <div className="mt-8">
              {isStarted ? (
                session ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-all"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-all"
                  >
                    Sign in to Get Started
                  </Link>
                )
              ) : (
                <button
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-all cursor-not-allowed opacity-75"
                  disabled
                >
                  Join Waitlist
                  <ClockIcon className="ml-2 h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-4">
              <div className="flex items-center justify-center space-x-6">
                {['Privacy Policy', 'Terms of Service', 'Help Center'].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} CAI_HONG. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}