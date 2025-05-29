import { 
  ClockIcon, 
  DocumentIcon, 
  SparklesIcon, 
  RocketLaunchIcon,
  BeakerIcon,
  CloudArrowUpIcon,
  CodeBracketIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  DocumentMagnifyingGlassIcon,
  PaintBrushIcon,
  CommandLineIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import WaitlistForm from '@/components/waitlist/WaitlistForm';
import mongoose from 'mongoose';
import Wishlist from '@/lib/db/models/Wishlist';

async function getWaitlistCount() {
  try {
    // Connect to MongoDB directly since we're on the server
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // Get count directly from the database and add 1023
    const actualCount = await Wishlist.countDocuments({ status: 'pending' });
    const displayCount = actualCount + 1023; // Add 1023 to the actual count
    return displayCount;
  } catch (error) {
    console.error('Error fetching waitlist count:', error);
    return 1023; // Return 1023 even in case of error to maintain minimum display count
  }
}

export default async function ComingSoonPage() {
  const waitlistCount = await getWaitlistCount();

  const features = [
    {
      icon: <SparklesIcon className="h-10 w-10 text-blue-400" />,
      title: "AI-Powered Creation",
      description: "Generate professional documents with a simple prompt. Our AI understands context and maintains consistency."
    },
    {
      icon: <DocumentIcon className="h-10 w-10 text-purple-400" />,
      title: "Smart Templates",
      description: "Choose from hundreds of pre-designed templates or work with your existing ones. University formats? We got you covered."
    },
    {
      icon: <CodeBracketIcon className="h-10 w-10 text-indigo-400" />,
      title: "Built-in Version Control",
      description: "Full Git integration with branch management, history tracking, and collaborative features."
    }
  ];

  const advancedFeatures = [
    {
      icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" />,
      title: "Context-Aware AI",
      description: "Our AI reads and understands your data, reports, and images to create coherent documents."
    },
    {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "LaTeX Error Prevention",
      description: "Real-time error detection and automatic fixes for LaTeX syntax."
    },
    {
      icon: <PaintBrushIcon className="h-6 w-6" />,
      title: "Custom Styling",
      description: "Fully customizable templates and styling options to match your brand."
    },
    {
      icon: <CloudArrowUpIcon className="h-6 w-6" />,
      title: "Smart Import",
      description: "Automatically format and structure existing documents and presentations."
    },
    {
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
      title: "Beamer Support",
      description: "Create beautiful presentations with built-in Beamer support and themes."
    },
    {
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      title: "Pay-Per-Use",
      description: "Flexible credit-based pricing. Only pay for what you actually use."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href="/" 
                className="flex items-center space-x-2"
              >
                <RocketLaunchIcon className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  CAIHONG
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Hero */}
          <div className="text-center space-y-8">
            <div className="flex justify-center space-x-4">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                <ClockIcon className="h-5 w-5 text-blue-400 animate-pulse" />
                <span className="text-sm font-medium">Launching Soon</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                <UserGroupIcon className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">{waitlistCount.toLocaleString()} People Waiting</span>
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
              Create Beautiful{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Documents
              </span>
              <br />in Minutes
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-gray-300">
              Transform your ideas into professional documents and presentations with AI-powered assistance. 
              No more spending hours on formatting and design.
            </p>

            {/* Waitlist Form */}
            <div className="max-w-md mx-auto">
              <WaitlistForm />
            </div>
          </div>

          {/* Main Features */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-center">{feature.title}</h3>
                <p className="mt-2 text-gray-400 text-center">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* AI Context Section */}
          <div className="mt-32">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Contextual AI Understanding</h2>
              <p className="mt-4 text-xl text-gray-300">
                Our AI doesn't just process text - it understands your entire document ecosystem
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5">
                  <CommandLineIcon className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Smart Data Processing</h3>
                    <p className="mt-1 text-gray-400">Automatically extract and format data from PDFs, images, and spreadsheets</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5">
                  <DocumentChartBarIcon className="h-6 w-6 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Consistent Formatting</h3>
                    <p className="mt-1 text-gray-400">Maintain style consistency across all your documents</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5">
                  <CodeBracketIcon className="h-6 w-6 text-indigo-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Version History</h3>
                    <p className="mt-1 text-gray-400">Track changes and maintain different versions effortlessly</p>
                  </div>
                </div>
              </div>
              <div className="relative h-96 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg overflow-hidden backdrop-blur-sm border border-white/10">
                {/* Document Processing Animation */}
                <div className="absolute inset-0">
                  {/* Floating particles background */}
                  <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
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
                  
                  {/* Document Processing Visual */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 space-y-4">
                      {/* Input Document */}
                      <div className="h-20 bg-white/10 rounded-lg p-3 transform transition-transform animate-float-slow">
                        <div className="space-y-2">
                          <div className="h-2 w-3/4 bg-blue-400/30 rounded" />
                          <div className="h-2 w-1/2 bg-blue-400/30 rounded" />
                          <div className="h-2 w-2/3 bg-blue-400/30 rounded" />
                        </div>
                      </div>

                      {/* Processing Indicator */}
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-t-2 border-blue-400 rounded-full animate-spin" />
                      </div>

                      {/* Output Document */}
                      <div className="h-20 bg-white/10 rounded-lg p-3 transform transition-transform animate-float-slow-reverse">
                        <div className="space-y-2">
                          <div className="h-2 w-3/4 bg-purple-400/30 rounded animate-pulse" />
                          <div className="h-2 w-1/2 bg-purple-400/30 rounded animate-pulse delay-100" />
                          <div className="h-2 w-2/3 bg-purple-400/30 rounded animate-pulse delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Lines */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-scan" />
                    <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent animate-scan delay-1000" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features Grid */}
          <div className="mt-32">
            <h2 className="text-3xl font-bold text-center">Advanced Features</h2>
            <p className="mt-4 text-xl text-gray-300 text-center max-w-2xl mx-auto">
              Everything you need for professional document creation and management
            </p>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {advancedFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="mt-1 text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="mt-32 text-center">
            <h2 className="text-3xl font-bold">Simple, Usage-Based Pricing</h2>
            <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
              Only pay for what you use. Start free and scale as you grow.
            </p>
            
            <div className="mt-12 inline-flex items-center space-x-4 px-6 py-4 rounded-lg bg-white/5">
              <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
              <div className="text-left">
                <h3 className="font-medium">Credit-Based System</h3>
                <p className="text-sm text-gray-400">Purchase credits as needed. No monthly commitments.</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-32 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Product</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Templates</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Resources</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Tutorials</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Company</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a>
                  </li>
                  <li>
                    <a href="mailto:contact@assigneditor.site" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                      <span>Contact</span>
                      <span className="text-sm text-blue-400">contact@assigneditor.site</span>
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} CAIHONG. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 