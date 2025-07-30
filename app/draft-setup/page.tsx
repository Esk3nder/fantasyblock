'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function DraftSetupPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedDraftType, setSelectedDraftType] = useState<string>('');
  const [leagueSettings, setLeagueSettings] = useState({
    name: '',
    teams: 12,
    draftPosition: 1,
    scoringType: 'standard'
  });

  // Redirect to login if not authenticated
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const sports = [
    {
      id: 'nfl',
      name: 'NFL Football',
      icon: '🏈',
      description: 'America\'s most popular fantasy sport',
      details: '16-game season • Weekly lineups • Most active community'
    },
    {
      id: 'nba',
      name: 'NBA Basketball', 
      icon: '🏀',
      description: 'Fast-paced action and daily lineup changes',
      details: '82-game season • Daily fantasy options • High scoring'
    },
    {
      id: 'mlb',
      name: 'MLB Baseball',
      icon: '⚾',
      description: 'Strategic depth with detailed statistics',
      details: '162-game season • Complex categories • Deep strategy'
    }
  ];

  const draftTypes = [
    {
      id: 'snake',
      name: 'Snake Draft',
      description: 'Draft order reverses each round',
      icon: '🐍',
      popular: true
    },
    {
      id: 'auction',
      name: 'Auction Draft',
      description: 'Bid on players with a budget',
      icon: '💰',
      popular: false
    },
    {
      id: 'linear',
      name: 'Linear Draft',
      description: 'Same order every round',
      icon: '📏',
      popular: false
    }
  ];

  const handleContinue = () => {
    if (!selectedSport || !selectedDraftType) {
      alert('Please select both sport and draft type');
      return;
    }
    
    // TODO: Save draft settings and navigate to draft room
    router.push('/draft-room');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Set Up Your Fantasy Draft
          </h1>
          <p className="text-xl text-zinc-600">
            Configure your league settings to get personalized AI recommendations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-orange-600">Sport & Draft Type</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">League Settings</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Draft Room</span>
            </div>
          </div>
        </div>

        {/* Sport Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Choose Your Sport</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sports.map((sport) => (
              <Card
                key={sport.id}
                className={`p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedSport === sport.id
                    ? 'ring-2 ring-orange-500 bg-orange-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedSport(sport.id)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{sport.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{sport.name}</h3>
                  <p className="text-zinc-600 mb-3">{sport.description}</p>
                  <div className="text-sm text-zinc-500">{sport.details}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Draft Type Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Select Draft Type</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {draftTypes.map((draftType) => (
              <Card
                key={draftType.id}
                className={`p-6 cursor-pointer transition-all duration-200 hover:scale-105 relative ${
                  selectedDraftType === draftType.id
                    ? 'ring-2 ring-orange-500 bg-orange-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedDraftType(draftType.id)}
              >
                {draftType.popular && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{draftType.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{draftType.name}</h3>
                  <p className="text-zinc-600">{draftType.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick League Settings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Basic League Settings</h2>
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  League Name
                </label>
                <Input
                  type="text"
                  placeholder="My Awesome League"
                  value={leagueSettings.name}
                  onChange={(e) => setLeagueSettings({...leagueSettings, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Number of Teams
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={leagueSettings.teams}
                  onChange={(e) => setLeagueSettings({...leagueSettings, teams: parseInt(e.target.value)})}
                >
                  {[8, 10, 12, 14, 16].map(num => (
                    <option key={num} value={num}>{num} Teams</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Your Draft Position
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={leagueSettings.draftPosition}
                  onChange={(e) => setLeagueSettings({...leagueSettings, draftPosition: parseInt(e.target.value)})}
                >
                  {Array.from({length: leagueSettings.teams}, (_, i) => i + 1).map(pos => (
                    <option key={pos} value={pos}>Position {pos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Scoring Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={leagueSettings.scoringType}
                  onChange={(e) => setLeagueSettings({...leagueSettings, scoringType: e.target.value})}
                >
                  <option value="standard">Standard</option>
                  <option value="ppr">PPR (Point Per Reception)</option>
                  <option value="half-ppr">Half PPR</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Import Options */}
        <div className="mb-12">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Have an existing league?
              </h3>
              <p className="text-blue-700 mb-4">
                Import your league settings directly from ESPN or Yahoo
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Import from ESPN
                </Button>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Import from Yahoo
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" className="px-8">
              Back to Home
            </Button>
          </Link>
          <Button 
            onClick={handleContinue}
            className="btn-firecrawl-orange px-8"
            disabled={!selectedSport || !selectedDraftType}
          >
            Continue to Draft Room
          </Button>
        </div>
      </div>
    </div>
  );
}