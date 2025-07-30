'use client';

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24">
        
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 animate-fade-in-up">
              <span className="block text-zinc-900">FantasyBlock</span>
              <span className="block bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
                AI-Powered Draft Assistant
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-zinc-600 max-w-3xl mx-auto mb-6 animate-fade-in-up animation-delay-200">
              Get personalized, real-time draft recommendations that give you the competitive edge
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link
                href="/draft-room"
                className="btn-firecrawl-orange inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
              >
                Start Draft Setup
              </Link>
              <Link
                href="/plans"
                className="btn-firecrawl-default inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-6 text-sm text-zinc-500 animate-fade-in-up animation-delay-600">
              NFL • NBA • MLB • Real-time Recommendations • League Integration • Draft Analytics
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 bg-zinc-900 rounded-[20px] p-12 animate-fade-in-scale animation-delay-800">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center animate-fade-in-up animation-delay-1000">
                <div className="text-4xl font-bold text-white">3 Sports</div>
                <div className="text-sm text-zinc-400 mt-1">NFL, NBA & MLB</div>
              </div>
              <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1100ms'}}>
                <div className="text-4xl font-bold text-white">Real-time</div>
                <div className="text-sm text-zinc-400 mt-1">Draft Recommendations</div>
              </div>
              <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1200ms'}}>
                <div className="text-4xl font-bold text-white">League</div>
                <div className="text-sm text-zinc-400 mt-1">Integration</div>
              </div>
              <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1300ms'}}>
                <div className="text-4xl font-bold text-white">Smart</div>
                <div className="text-sm text-zinc-400 mt-1">Player Analysis</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sport Selection Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4 animate-fade-in-up">
              Choose Your Sport
            </h2>
            <p className="text-xl text-zinc-600 animate-fade-in-up animation-delay-200">
              Get AI-powered draft assistance for your favorite fantasy league
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* NFL */}
            <div className="bg-white p-8 rounded-[20px] border border-zinc-200 animate-fade-in-up animation-delay-400 hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">🏈</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">NFL Football</h3>
                <p className="text-zinc-600 mb-4">America's most popular fantasy sport</p>
                <div className="text-sm text-zinc-500">
                  16-game season • Weekly lineups • Most active community
                </div>
              </div>
            </div>

            {/* NBA */}
            <div className="bg-white p-8 rounded-[20px] border border-zinc-200 animate-fade-in-up animation-delay-600 hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">🏀</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">NBA Basketball</h3>
                <p className="text-zinc-600 mb-4">Fast-paced action and daily lineup changes</p>
                <div className="text-sm text-zinc-500">
                  82-game season • Daily fantasy options • High scoring
                </div>
              </div>
            </div>

            {/* MLB */}
            <div className="bg-white p-8 rounded-[20px] border border-zinc-200 animate-fade-in-up animation-delay-800 hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">⚾</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">MLB Baseball</h3>
                <p className="text-zinc-600 mb-4">Strategic depth with detailed statistics</p>
                <div className="text-sm text-zinc-500">
                  162-game season • Complex categories • Deep strategy
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/draft-room" className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8">
              Get Started with Your Sport
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-[30px] p-16">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-zinc-900 mb-4">
                Dominate Your Fantasy Draft
              </h2>
              <p className="text-xl text-zinc-600">
                Choose the plan that fits your fantasy needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white p-8 rounded-[20px] border border-zinc-200 animate-fade-in-up animation-delay-400 hover:scale-105 transition-all duration-200">
              <h3 className="text-2xl font-bold mb-2">Rookie</h3>
              <p className="text-zinc-600 mb-6">Perfect for casual fantasy players</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  3 drafts per season
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic AI recommendations
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Draft summaries
                </li>
              </ul>
              <Link
                href="/register"
                className="btn-firecrawl-outline w-full inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 h-10 px-4"
              >
                Start free
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="bg-white p-8 rounded-[20px] border-2 border-orange-500 relative animate-fade-in-up animation-delay-600 hover:scale-105 transition-all duration-200">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-zinc-600 mb-6">For serious fantasy managers</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited drafts
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced AI analysis
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ESPN/Yahoo integration
                </li>
              </ul>
              <Link
                href="/register"
                className="btn-firecrawl-orange w-full inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 h-10 px-4"
              >
                Start free trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-[20px] border border-zinc-200 animate-fade-in-up animation-delay-800 hover:scale-105 transition-all duration-200">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-zinc-600 mb-6">For commissioners & leagues</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Multiple teams
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API access
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  League management
                </li>
              </ul>
              <Link
                href="/contact"
                className="btn-firecrawl-outline w-full inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 h-10 px-4"
              >
                Contact sales
              </Link>
            </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/plans" className="text-orange-600 hover:text-orange-700 font-medium">
                View detailed pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section 1 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[30px] p-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Get AI-Powered Draft Recommendations
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Make smarter picks with real-time analysis across NFL, NBA, and MLB
            </p>
            <Link
              href="/draft-room"
              className="btn-firecrawl-default inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
            >
              Start Your Draft
            </Link>
          </div>
        </div>
      </section>


      {/* FAQs */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4 animate-fade-in-up">
              Frequently asked questions
            </h2>
            <p className="text-xl text-zinc-600 animate-fade-in-up animation-delay-200">
              Everything you need to know about FantasyBlock
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-gray-50 rounded-[15px] overflow-hidden animate-fade-in-up animation-delay-400">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  How does FantasyBlock work?
                </h3>
                <svg
                  className={`w-5 h-5 text-zinc-500 transition-transform ${openFaq === 0 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 0 && (
                <div className="px-6 py-6">
                  <p className="text-zinc-600 leading-relaxed">
                    FantasyBlock provides AI-powered draft recommendations based on your league settings, personal preferences, and real-time draft state. Simply set up your league parameters, tell us your strategy preferences, and our AI will suggest optimal picks throughout your draft, explaining why each player is recommended.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-gray-50 rounded-[15px] overflow-hidden animate-fade-in-up animation-delay-400" style={{animationDelay: '500ms'}}>
              <button
                onClick={() => toggleFaq(1)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  Which sports and leagues does FantasyBlock support?
                </h3>
                <svg
                  className={`w-5 h-5 text-zinc-500 transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 1 && (
                <div className="px-6 py-6">
                  <p className="text-zinc-600 leading-relaxed">
                    FantasyBlock currently supports NFL Football, NBA Basketball, and MLB Baseball. We integrate with ESPN and Yahoo Fantasy Sports APIs for seamless league setup and real-time draft tracking. Support for additional sports and platforms is continuously being added.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-gray-50 rounded-[15px] overflow-hidden animate-fade-in-up animation-delay-600">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  How does the AI make recommendations?
                </h3>
                <svg
                  className={`w-5 h-5 text-zinc-500 transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 2 && (
                <div className="px-6 py-6">
                  <p className="text-zinc-600 leading-relaxed">
                    Our AI analyzes multiple factors including player rankings, injury reports, matchup data, positional scarcity, your roster needs, and your stated preferences. It processes real-time draft state and provides explanations for each recommendation, helping you understand the strategic reasoning behind every suggestion.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-gray-50 rounded-[15px] overflow-hidden animate-fade-in-up animation-delay-400" style={{animationDelay: '700ms'}}>
              <button
                onClick={() => toggleFaq(3)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  What features are included?
                </h3>
                <svg
                  className={`w-5 h-5 text-zinc-500 transition-transform ${openFaq === 3 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 3 && (
                <div className="px-6 py-6">
                  <p className="text-zinc-600 leading-relaxed">
                    FantasyBlock includes real-time player recommendations, draft board tracking, ESPN/Yahoo integration, custom league settings, positional analysis, player projections, draft strategy explanations, and post-draft team analysis. Pro plans add unlimited drafts and advanced AI features.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="bg-gray-50 rounded-[15px] overflow-hidden animate-fade-in-up animation-delay-800">
              <button
                onClick={() => toggleFaq(4)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  Can I try FantasyBlock for free?
                </h3>
                <svg
                  className={`w-5 h-5 text-zinc-500 transition-transform ${openFaq === 4 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 4 && (
                <div className="px-6 py-6">
                  <p className="text-zinc-600 leading-relaxed">
                    Yes! The Rookie plan is completely free and includes 3 drafts per season with basic AI recommendations and draft summaries. This gives you a chance to experience how FantasyBlock can improve your draft strategy before upgrading to unlimited features.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-zinc-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Dominate Your Fantasy Draft Today
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Join thousands of fantasy managers who trust AI-powered recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/draft-room"
              className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
            >
              Start Draft Setup
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8 bg-zinc-800 text-white hover:bg-zinc-700"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}