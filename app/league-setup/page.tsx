'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  sport: string;
  teams: number;
  draftType: string;
  status: 'upcoming' | 'active' | 'completed';
  platform?: 'espn' | 'yahoo' | 'manual';
  draftDate?: string;
}

export default function LeagueSetupPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  // Mock leagues data
  const [leagues, setLeagues] = useState<League[]>([
    {
      id: '1',
      name: 'Office Fantasy Football',
      sport: 'NFL',
      teams: 12,
      draftType: 'Snake',
      status: 'upcoming',
      platform: 'espn',
      draftDate: '2024-08-15'
    },
    {
      id: '2',
      name: 'Friends Basketball League',
      sport: 'NBA',
      teams: 10,
      draftType: 'Auction',
      status: 'active',
      platform: 'yahoo'
    },
    {
      id: '3',
      name: 'Summer Baseball',
      sport: 'MLB',
      teams: 14,
      draftType: 'Snake',
      status: 'completed',
      platform: 'manual'
    }
  ]);

  // Check authentication
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'espn': return '🏈';
      case 'yahoo': return '🟣';
      case 'manual': return '⚙️';
      default: return '⚙️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">League Management</h1>
              <p className="text-zinc-600 mt-1">Manage your fantasy leagues and draft settings</p>
            </div>
            <Link href="/draft-setup">
              <Button className="btn-firecrawl-orange">
                <Plus className="w-4 h-4 mr-2" />
                New League
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="leagues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="leagues">My Leagues</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* My Leagues Tab */}
          <TabsContent value="leagues" className="space-y-6">
            {leagues.length > 0 ? (
              <div className="grid gap-6">
                {leagues.map((league) => (
                  <Card key={league.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">{getPlatformIcon(league.platform)}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-zinc-900">{league.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-sm text-zinc-600">{league.sport}</span>
                            <span className="text-sm text-zinc-600">•</span>
                            <span className="text-sm text-zinc-600">{league.teams} Teams</span>
                            <span className="text-sm text-zinc-600">•</span>
                            <span className="text-sm text-zinc-600">{league.draftType} Draft</span>
                            {league.platform && (
                              <>
                                <span className="text-sm text-zinc-600">•</span>
                                <span className="text-sm text-zinc-600 capitalize">{league.platform}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(league.status)}>
                          {league.status}
                        </Badge>
                        
                        {league.status === 'upcoming' && (
                          <Link href="/draft-room">
                            <Button size="sm" className="btn-firecrawl-orange">
                              Start Draft
                            </Button>
                          </Link>
                        )}
                        
                        {league.status === 'active' && (
                          <Link href="/draft-room">
                            <Button size="sm" variant="outline">
                              View Draft
                            </Button>
                          </Link>
                        )}
                        
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {league.draftDate && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          📅 Draft scheduled for {new Date(league.draftDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-zinc-400 mb-4">
                  <Settings className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">No leagues yet</h3>
                <p className="text-zinc-600 mb-6">Create your first fantasy league to get started with AI-powered draft assistance</p>
                <Link href="/draft-setup">
                  <Button className="btn-firecrawl-orange">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First League
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* ESPN Integration */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏈</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">ESPN Fantasy</h3>
                    <p className="text-sm text-zinc-600">Connect your ESPN leagues</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Office Fantasy Football</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect More ESPN Leagues
                  </Button>
                </div>
              </Card>

              {/* Yahoo Integration */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🟣</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Yahoo Fantasy</h3>
                    <p className="text-sm text-zinc-600">Connect your Yahoo leagues</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Friends Basketball League</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect More Yahoo Leagues
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Why Connect Your Leagues?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Automatic league settings import</li>
                <li>• Real-time draft pick tracking</li>
                <li>• Seamless roster management</li>
                <li>• AI recommendations based on actual league state</li>
              </ul>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-6">
              
              {/* Draft Preferences */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Draft Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Preferred Draft Strategy
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>Balanced (recommended)</option>
                      <option>RB Heavy</option>
                      <option>Zero RB Strategy</option>
                      <option>QB Early</option>
                      <option>QB Late</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Risk Tolerance
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>Conservative</option>
                      <option>Moderate</option>
                      <option>Aggressive</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Notification Preferences */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" defaultChecked />
                    <span className="ml-2 text-sm text-zinc-700">Draft reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" defaultChecked />
                    <span className="ml-2 text-sm text-zinc-700">Player news alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                    <span className="ml-2 text-sm text-zinc-700">Weekly reports</span>
                  </label>
                </div>
              </Card>

              <Button className="btn-firecrawl-orange">
                Save Preferences
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}