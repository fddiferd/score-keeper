/**
 * @fileoverview UnauthenticatedView Landing Page
 * 
 * This component serves as the main landing page for unauthenticated users,
 * showcasing the platform's key features with scroll-triggered animations.
 * 
 * COMPONENT ARCHITECTURE:
 * ======================
 * 
 * The page is structured into 4 main sections that appear sequentially as the user scrolls:
 * 
 * 1. TRANSFORM DATA (Hero Section)
 *    - Main value proposition and call-to-action
 *    - Gradient text effects and animated badge
 *    - Background blob animations
 * 
 * 2. FEATURES
 *    - Three core platform capabilities
 *    - Icon-based feature cards with hover effects
 *    - Staggered animation delays for visual appeal
 * 
 * 3. SUPPORTED SEMANTIC LAYERS
 *    - Integration showcase (currently DBT)
 *    - Extensible for future integrations
 * 
 * 4. AUTHENTICATION & SECURITY
 *    - Enterprise-grade security features
 *    - Wristband platform integration details
 *    - Security protocol highlights
 * 
 * ANIMATION SYSTEM:
 * =================
 * 
 * - Uses custom `useIntersectionObserver` hook for scroll detection
 * - `AnimatedSection` wrapper component handles fade-in/slide-up animations
 * - Configurable animation delays for staggered effects
 * - One-time animations (don't re-trigger on scroll up)
 * 
 * MAINTENANCE NOTES:
 * ==================
 * 
 * 1. Adding New Sections:
 *    - Wrap content in `<AnimatedSection delay={ms}>` 
 *    - Use semantic HTML5 section tags
 *    - Follow existing spacing patterns (py-20 for sections)
 * 
 * 2. Modifying Animations:
 *    - Adjust `threshold` and `rootMargin` in `useIntersectionObserver`
 *    - Animation styles are in Tailwind classes: `opacity-0 translate-y-8` → `opacity-100 translate-y-0`
 *    - Duration controlled by `duration-1000 ease-out`
 * 
 * 3. Responsive Design:
 *    - Mobile-first approach with responsive grid layouts
 *    - Mobile menu state managed locally
 *    - Breakpoints: xs (480px), md (768px), lg (1024px)
 * 
 * 4. Accessibility:
 *    - ARIA labels on interactive elements
 *    - Focus management for mobile menu
 *    - Semantic HTML structure
 *    - Alt text for images
 * 
 * 5. Environment Variables:
 *    - NEXT_PUBLIC_BACKEND_URL: Backend API URL
 *    - NEXT_PUBLIC_APPLICATION_SIGNUP_URL: Signup redirect URL
 * 
 * 6. Dependencies:
 *    - @wristband/react-client-auth: Authentication integration
 *    - @heroicons/react: Icon library
 *    - Tailwind CSS: Styling framework
 * 
 * PERFORMANCE CONSIDERATIONS:
 * ===========================
 * 
 * - Intersection Observer automatically disconnects after first trigger
 * - CSS transitions use GPU-accelerated properties (opacity, transform)
 * - Images should be optimized and use appropriate formats
 * - Background animations use `will-change: transform` for performance
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-09-17
 */

import React, { useEffect, useRef, useState } from 'react';
import { redirectToLogin } from "@wristband/react-client-auth";
import { ChevronRightIcon, ChartBarIcon, CpuChipIcon, CubeIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Custom hook for intersection observer to trigger animations on scroll
 * @param threshold - Intersection threshold (0-1)
 * @param rootMargin - Root margin for intersection observer
 * @returns [ref, isVisible] - Reference to attach to element and visibility state
 */
function useIntersectionObserver(
  threshold: number = 0.1,
  rootMargin: string = '0px 0px -100px 0px'
): [React.RefObject<HTMLDivElement>, boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Once visible, disconnect observer to prevent re-triggering
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, isVisible]);

  return [ref, isVisible];
}

/**
 * Animation wrapper component for scroll-triggered animations
 * @param children - Child components to animate
 * @param delay - Animation delay in milliseconds
 * @param className - Additional CSS classes
 */
interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

function AnimatedSection({ children, delay = 0, className = '' }: AnimatedSectionProps) {
  const [ref, isVisible] = useIntersectionObserver();

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : '0ms'
      }}
    >
      {children}
    </div>
  );
}

/**
 * UnauthenticatedView Component
 * 
 * Landing page for unauthenticated users showcasing the platform's key features:
 * 1. Transform Data (Hero Section) - Main value proposition and CTA
 * 2. Features - Core platform capabilities with icons and descriptions
 * 3. Supported Semantic Layers - Integration capabilities
 * 4. Authentication & Security - Enterprise-grade security features
 * 
 * Features:
 * - Responsive design with mobile menu
 * - Scroll-triggered animations for better UX
 * - Dark mode support
 * - Accessibility considerations (ARIA labels, focus management)
 * 
 * Maintenance Notes:
 * - Sections are wrapped in AnimatedSection for consistent scroll animations
 * - Mobile menu state is managed locally
 * - Environment variables used for backend URLs
 * - Wristband authentication integration for login/signup
 */
export default function UnauthenticatedView() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Handles user login by redirecting to Wristband auth
   */
  const handleLogin = () => {
    redirectToLogin(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:6001'}/api/auth/login`);
  };

  /**
   * Handles user signup by redirecting to configured signup URL
   */
  const handleSignUp = () => {
    window.location.href = process.env.NEXT_PUBLIC_APPLICATION_SIGNUP_URL || '';
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 p-4 md:p-6 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img
            src="/logo_light.svg"
            alt="Wristband Logo"
            width={160}
            height={32}
            className="block dark:hidden"
          />
          <img
            src="/logo_dark.svg"
            alt="Wristband Logo"
            width={160}
            height={32}
            className="hidden dark:block"
          />
          
          <div className="hidden xs:flex items-center gap-4">
            <button
              onClick={handleLogin}
              className="group px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:-translate-y-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Log In
            </button>
            <button
              onClick={handleSignUp}
              className="group px-4 py-2 btn-primary rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 transform"
            >
              Sign Up
            </button>
          </div>

          <div className="xs:hidden">
            <button
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-menu" className="xs:hidden absolute left-0 right-0 top-full z-20">
            <div className="max-w-7xl mx-auto px-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ring-1 ring-black/5 p-3 flex flex-col gap-2">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleLogin(); }}
                  className="group w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-center font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  Log In
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleSignUp(); }}
                  className="group w-full px-4 py-2 btn-primary rounded-md font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:scale-105 transform"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* SECTION 1: Transform Data (Hero Section) */}
      <section className="relative min-h-screen flex items-center pt-20 md:pt-0">
        <div className="max-w-7xl mx-auto px-6 py-12 w-full">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="group inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light px-4 py-2 rounded-full text-sm font-medium mb-8 hover:bg-primary/20 dark:hover:bg-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <CpuChipIcon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Semantic Layer + AI Insights
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Know Your Data{' '}
              <div className="h-6"></div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                AI for BI
              </span>
            </h1>
            {/* Spacer for visual separation */}
            <div className="h-6"></div>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              Unlock the single <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">source of truth</span> via powerful <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">analytics</span>, automated <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">reporting</span>, 
              and <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">AI</span>-driven insights that help you make data-driven decisions <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">faster</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignUp}
                className="group px-8 py-4 btn-primary rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-105 text-lg font-medium flex items-center justify-center gap-2 transform"
              >
                Try It Out
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </AnimatedSection>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/60 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/60 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/60 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* SECTION 2: Features */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection delay={200}>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Features
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary-dark mx-auto mb-6 rounded-full"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                What we can help you with
              </p>
            </div>
          </AnimatedSection>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <AnimatedSection delay={300}>
              <div className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden">
                {/* Gradient background accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ChartBarIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Intelligent Reporting
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Easy to use data exploration into any graph, report, dashboard, or extract
                  </p>
                </div>
                
                {/* Subtle background pattern */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-full -mr-16 -mb-16 opacity-50"></div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden">
                {/* Gradient background accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-indigo-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <CpuChipIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Smart Trends
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Tell us what matters to your business and we will make sure you are up to date with the latest trends & insights
                  </p>
                </div>
                
                {/* Subtle background pattern */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mb-16 opacity-50"></div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={500}>
              <div className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden">
                {/* Gradient background accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-dark"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <CubeIcon className="w-8 h-8 text-primary dark:text-primary-light" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Semantic Layer Integration
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Connect seamlessly with your existing data infrastructure
                  </p>
                </div>
                
                {/* Subtle background pattern */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full -mr-16 -mb-16 opacity-50"></div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* SECTION 3: Supported Semantic Layers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Supported Semantic Layers
              </h2>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <div className="flex justify-center">
              <div className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                <img
                  src="/dbt-logo.svg"
                  alt="DBT (Data Build Tool) Logo - Supported semantic layer integration"
                  className="h-16 w-auto mx-auto group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
            
      {/* SECTION 4: Authentication & Security */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Enterprise-Grade Authentication & Security
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Built on proven security standards trusted by enterprise customers
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left side - Wristband info */}
                <div className="flex-1 text-center lg:text-left">
                  <img
                    src="/wristband-logo-dark.svg"
                    alt="Wristband Authentication Platform Logo"
                    className="h-12 w-auto mx-auto lg:mx-0 mb-6"
                  />
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 max-w-md mx-auto lg:mx-0">
                    Built on Wristband's proven multi-tenant authentication platform, trusted by B2B SaaS companies worldwide for secure, scalable user management.
                  </p>
                  <a
                    href="https://www.wristband.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-105 text-sm font-medium transform"
                    aria-label="Learn more about Wristband authentication platform (opens in new tab)"
                  >
                    Learn More About Wristband
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                
                {/* Right side - Security features */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">OAuth2 & OIDC</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Industry-standard protocols</p>
                    </div>
                    
                    <div className="group flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Multi-Tenant</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Strict tenant isolation</p>
                    </div>
                    
                    <div className="group flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">RBAC</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Role-based access control</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}