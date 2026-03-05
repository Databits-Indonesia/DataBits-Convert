'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolsGrid from '@/components/ToolsGrid';
import FeatureCard from '@/components/FeatureCard';
import { POPULAR_TOOLS } from '../config/constants';

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleToolSelect = (id: string) => {
    router.push(`/tools/${id}`);
  };

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-700 dark:text-gray-300 antialiased">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            Online Converter for your documents
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            More faster as you can see
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => scrollToElement('tools-section')}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary dark:hover:text-primary transition-colors"
            >
              <span className="icon mr-2">explore</span>
              Choose a tool
            </button>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16 max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Why choose DataBits?
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Private, fast, and built for heavy PDF workflows.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="lock"
              title="On-device privacy"
              description="Files stay in your browser. No server uploads required."
            />
            <FeatureCard
              icon="bolt"
              title="Fast workflows"
              description="Optimized tools for large files and batch operations."
            />
            <FeatureCard
              icon="verified"
              title="Trusted conversions"
              description="Consistent outputs with full control over pages."
            />
            <FeatureCard
              icon="widgets"
              title="All-in-one toolkit"
              description="Merge, split, compress, sign, organize, and more."
            />
          </div>
        </section>

        {/* Tools Grid Section */}
        <div id="tools-section" className="mt-16">
          <ToolsGrid tools={POPULAR_TOOLS} onSelect={handleToolSelect} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function Page() {
  return <LandingPage />;
}
