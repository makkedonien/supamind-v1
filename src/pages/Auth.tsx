import React from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Mic, FolderOpen, ChevronDown, Radio } from 'lucide-react';

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">


      {/* Above the fold - Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              🧠 Supamind
            </h1>
            <p className="text-lg text-gray-600 max-w-[500px] mx-auto">
              Stop drowning in content - Supamind is your AI-powered assistant that turns any web article, YouTube video, PDF, or podcast into digestible and actionable summaries.
            </p>
          </div>
          
          {/* Auth Form */}
          <div className="max-w-md mx-auto">
            <AuthForm />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center pb-8">
        <div className="flex flex-col items-center text-gray-400">
          <span className="text-sm mb-2">Learn more</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>

      {/* Below the fold - Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to store and summarize valuable content you discover
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Supamind helps you capture, consume, and transform your content into actionable insights with the power of AI.
            </p>
          </div>

          {/* Content Feed Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Content Feed</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Never lose track of valuable content you come across again. Save articles, PDFs, YouTube videos, and podcast transcripts in one central place. Supamind's AI automatically generates intelligent summaries and deep-dive insights, extracting key takeaways so you can absorb the most important ideas in minutes, not hours.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 border max-h-96 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="text-xs text-gray-500 ml-auto">Content Feed</div>
              </div>
              <div className="space-y-3">
                {/* Feed Card 1 - Article */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">The Future of AI in Education</h4>
                      <p className="text-xs text-gray-600 mt-1">How artificial intelligence is transforming learning...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Article</Badge>
                        <span className="text-xs text-gray-400">5 min read</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed Card 2 - Video */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎥</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">Machine Learning Explained</h4>
                      <p className="text-xs text-gray-600 mt-1">A comprehensive guide to understanding ML concepts...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Video</Badge>
                        <span className="text-xs text-gray-400">12:30</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed Card 3 - PDF */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📋</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">Research Paper: AI Ethics</h4>
                      <p className="text-xs text-gray-600 mt-1">Exploring ethical considerations in AI development...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">PDF</Badge>
                        <span className="text-xs text-gray-400">24 pages</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed Card 4 - Podcast */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">Tech Talk: Future of Work</h4>
                      <p className="text-xs text-gray-600 mt-1">Discussion on how technology is reshaping careers...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Podcast</Badge>
                        <span className="text-xs text-gray-400">45:20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Podcast Feed Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-white rounded-lg shadow-lg p-4 border max-h-96 overflow-hidden order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="text-xs text-gray-500 ml-auto">Podcast Feed</div>
              </div>
              <div className="space-y-3">
                {/* Podcast Episode 1 */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">The Future of AI in Healthcare</h4>
                      <p className="text-xs text-gray-600 mt-1">Exploring how artificial intelligence is revolutionizing...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Podcast</Badge>
                        <span className="text-xs text-gray-400">42:15</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Podcast Episode 2 */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">Startup Funding Strategies</h4>
                      <p className="text-xs text-gray-600 mt-1">Expert insights on raising capital in 2024...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Podcast</Badge>
                        <span className="text-xs text-gray-400">38:42</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Podcast Episode 3 */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">Climate Tech Innovations</h4>
                      <p className="text-xs text-gray-600 mt-1">Breakthrough technologies fighting climate change...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Podcast</Badge>
                        <span className="text-xs text-gray-400">51:28</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Podcast Episode 4 */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">Remote Work Revolution</h4>
                      <p className="text-xs text-gray-600 mt-1">How distributed teams are reshaping business...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Podcast</Badge>
                        <span className="text-xs text-gray-400">29:14</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <Radio className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Podcast Feed</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Stay updated with your favorite podcasts automatically. Subscribe to podcast feeds and let Supamind automatically process new episodes as they're released. Get intelligent summaries, key insights, and searchable transcripts for every episode - never miss important content from your trusted sources.
              </p>
            </div>
          </div>

          {/* Microcasts Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Mic className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Microcasts</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Transform your saved content into personalized audio experiences. Select content pieces and let Supamind create a crisp, engaging podcast recap of your content. Perfect for commutes, workouts, or whenever you prefer listening over reading.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="text-xs text-gray-500 ml-auto">Microcast Player</div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">AI & Machine Learning Weekly</h4>
                  <p className="text-sm text-gray-600">Generated from 3 articles • 8 min listen</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mx-auto mb-4">
                    <span className="text-white text-2xl">▶️</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 mb-4">
                    <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>2:41</span>
                    <span>8:12</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">📄 AI Ethics Paper</Badge>
                  <Badge variant="secondary" className="text-xs">🎥 ML Tutorial</Badge>
                  <Badge variant="secondary" className="text-xs">📄 Tech Trends</Badge>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>


    </div>
  );
};

export default Auth;