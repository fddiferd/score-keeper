import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Page Style Guide Component
 * 
 * This component demonstrates the consistent styling patterns used across all pages
 * that depend on ThemeContext. Use these patterns for new pages and components.
 */

export default function PageStyleGuide() {
  const { effectiveTheme } = useTheme();

  return (
    <div className="page-container">
      <div className="mb-10">
        <h1 className="page-title mb-4">
          Page Style Guide
        </h1>
        <p className="page-description">
          Consistent styling patterns for pages using ThemeContext
        </p>
      </div>

      <div className="space-y-8">
        {/* Typography Section */}
        <section className="page-card">
          <div className="page-card-header">
            <h2 className="page-card-title">Typography</h2>
          </div>
          <div className="page-card-content space-y-6">
            <div>
              <h3 className="page-section-title">Page Titles</h3>
              <div className="space-y-4">
                <div>
                  <h1 className="page-title">Main Page Title</h1>
                  <p className="text-sm page-text-muted mt-1">Using: page-title (4xl/5xl, bold, tight tracking)</p>
                </div>
                <div>
                  <h2 className="page-subtitle">Page Subtitle</h2>
                  <p className="text-sm page-text-muted mt-1">Using: page-subtitle (2xl/3xl, semibold)</p>
                </div>
                <div>
                  <h3 className="page-section-title">Section Title</h3>
                  <p className="text-sm page-text-muted mt-1">Using: page-section-title (xl, semibold)</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="page-section-title">Body Text</h3>
              <div className="space-y-4">
                <div>
                  <p className="page-description">
                    Page description text - larger, lighter font for introductory content
                  </p>
                  <p className="text-sm page-text-muted mt-1">Using: page-description (xl, light weight)</p>
                </div>
                <div>
                  <p className="page-text">
                    Regular body text for general content
                  </p>
                  <p className="text-sm page-text-muted mt-1">Using: page-text</p>
                </div>
                <div>
                  <p className="page-text-muted">
                    Muted text for secondary information
                  </p>
                  <p className="text-sm page-text-muted mt-1">Using: page-text-muted</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card Layouts Section */}
        <section className="page-card">
          <div className="page-card-header">
            <h2 className="page-card-title">Card Layouts</h2>
          </div>
          <div className="page-card-content space-y-6">
            <div>
              <h3 className="page-section-title">Standard Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="page-card">
                  <div className="page-card-header">
                    <h4 className="page-card-title">Card with Header</h4>
                  </div>
                  <div className="page-card-content">
                    <p className="page-text">Card content goes here</p>
                  </div>
                </div>

                <div className="page-card-simple">
                  <h4 className="page-card-title mb-3">Simple Card</h4>
                  <p className="page-text">Simple card without header section</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="page-section-title">Feature Cards</h3>
              <div className="page-card-feature">
                <div className="page-card-feature-header">
                  <div className="page-card-feature-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="page-card-title">Feature Card</h4>
                </div>
                <div className="page-card-content">
                  <p className="page-text">Feature card with icon and accent styling</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Forms Section */}
        <section className="page-card">
          <div className="page-card-header">
            <h2 className="page-card-title">Form Elements</h2>
          </div>
          <div className="page-card-content space-y-6">
            <div>
              <h3 className="page-section-title">Input Fields</h3>
              <div className="space-y-4">
                <div>
                  <label className="page-form-label">
                    Standard Input
                  </label>
                  <input
                    type="text"
                    className="page-form-input"
                    placeholder="Enter text..."
                  />
                </div>

                <div>
                  <label className="page-form-label">
                    Search Input
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="page-form-input pl-10"
                      placeholder="Search..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="page-section-title">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <button className="page-btn-primary">Primary Button</button>
                <button className="page-btn-secondary">Secondary Button</button>
                <button className="page-btn-outline">Outline Button</button>
                <button className="page-btn-ghost">Ghost Button</button>
              </div>
            </div>
          </div>
        </section>

        {/* Status and Feedback Section */}
        <section className="page-card">
          <div className="page-card-header">
            <h2 className="page-card-title">Status & Feedback</h2>
          </div>
          <div className="page-card-content space-y-6">
            <div>
              <h3 className="page-section-title">Alert Messages</h3>
              <div className="space-y-4">
                <div className="page-alert-success">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Success message</p>
                </div>

                <div className="page-alert-error">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Error message</p>
                </div>

                <div className="page-alert-warning">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p>Warning message</p>
                </div>

                <div className="page-alert-info">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Info message</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples Section */}
        <section className="page-card">
          <div className="page-card-header">
            <h2 className="page-card-title">Usage Examples</h2>
          </div>
          <div className="page-card-content">
            <div className="page-code-block">
              <pre><code>{`// Basic page structure
<div className="max-w-7xl mx-auto px-6 py-8">
  <div className="mb-8">
    <h1 className="page-title">Page Title</h1>
    <p className="page-description">Page description</p>
  </div>

  <div className="space-y-6">
    <div className="page-card">
      <div className="page-card-header">
        <h2 className="page-card-title">Section Title</h2>
      </div>
      <div className="page-card-content">
        <!-- Content -->
      </div>
    </div>
  </div>
</div>`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * CSS Classes Reference
 * 
 * Add these classes to your globals.css for consistent styling:
 */

/* 
@layer components {
  // Page Layout
  .page-container {
    @apply max-w-7xl mx-auto px-6 py-8;
  }

  // Typography
  .page-title {
    @apply text-3xl font-bold text-gray-900 dark:text-white;
  }

  .page-subtitle {
    @apply text-2xl font-semibold text-gray-900 dark:text-white;
  }

  .page-section-title {
    @apply text-lg font-semibold text-gray-900 dark:text-white;
  }

  .page-description {
    @apply text-gray-700 dark:text-gray-300 text-lg leading-relaxed;
  }

  .page-text {
    @apply text-gray-700 dark:text-gray-300;
  }

  .page-text-muted {
    @apply text-gray-500 dark:text-gray-400;
  }

  // Cards
  .page-card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden;
  }

  .page-card-simple {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
  }

  .page-card-header {
    @apply bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700;
  }

  .page-card-content {
    @apply p-6;
  }

  .page-card-title {
    @apply text-lg font-semibold text-gray-900 dark:text-white;
  }

  .page-card-feature {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden;
  }

  .page-card-feature-header {
    @apply bg-primary/5 dark:bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center gap-3;
  }

  .page-card-feature-icon {
    @apply w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary;
  }

  // Forms
  .page-form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
  }

  .page-form-input {
    @apply w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500;
  }

  // Buttons
  .page-btn-primary {
    @apply px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary;
  }

  .page-btn-secondary {
    @apply px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
  }

  .page-btn-outline {
    @apply px-6 py-3 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
  }

  .page-btn-ghost {
    @apply px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
  }

  // Alerts
  .page-alert-success {
    @apply p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start space-x-3 text-green-800 dark:text-green-200;
  }

  .page-alert-error {
    @apply p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3 text-red-800 dark:text-red-200;
  }

  .page-alert-warning {
    @apply p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start space-x-3 text-yellow-800 dark:text-yellow-200;
  }

  .page-alert-info {
    @apply p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start space-x-3 text-blue-800 dark:text-blue-200;
  }

  // Code blocks
  .page-code-block {
    @apply bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto;
  }

  .page-code-block pre {
    @apply text-sm text-gray-800 dark:text-gray-200 font-mono;
  }
}
*/

