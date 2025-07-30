'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Target, Lightbulb, Search } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  rank: number;
  projected: number;
  drafted: boolean;
}

interface DraftPick {
  round: number;
  pick: number;
  teamIndex: number;
  player?: Player;
}

export default function DraftRoomPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  // Draft state
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds per pick
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  
  // Mock data - in real app this would come from API/database
  const numTeams = 12;
  const numRounds = 16;
  const userTeamIndex = 5; // User is team 6 (0-indexed)
  
  // Mock players data
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1, projected: 285, drafted: false },
    { id: '2', name: 'Austin Ekeler', position: 'RB', team: 'LAC', rank: 2, projected: 265, drafted: false },
    { id: '3', name: 'Josh Allen', position: 'QB', team: 'BUF', rank: 3, projected: 315, drafted: false },
    { id: '4', name: 'Cooper Kupp', position: 'WR', team: 'LAR', rank: 4, projected: 245, drafted: false },
    { id: '5', name: 'Derrick Henry', position: 'RB', team: 'TEN', rank: 5, projected: 255, drafted: false },
    { id: '6', name: 'Stefon Diggs', position: 'WR', team: 'BUF', rank: 6, projected: 235, drafted: false },
    { id: '7', name: 'Davante Adams', position: 'WR', team: 'LV', rank: 7, projected: 230, drafted: false },
    { id: '8', name: 'Travis Kelce', position: 'TE', team: 'KC', rank: 8, projected: 195, drafted: false },
    { id: '9', name: 'Nick Chubb', position: 'RB', team: 'CLE', rank: 9, projected: 225, drafted: false },
    { id: '10', name: 'Alvin Kamara', position: 'RB', team: 'NO', rank: 10, projected: 220, drafted: false },
  ]);

  const [draftBoard, setDraftBoard] = useState<DraftPick[]>([]);
  const [userRoster, setUserRoster] = useState<Player[]>([]);

  // Initialize draft board
  useEffect(() => {
    const board: DraftPick[] = [];
    for (let round = 1; round <= numRounds; round++) {
      for (let pick = 1; pick <= numTeams; pick++) {
        const teamIndex = round % 2 === 1 ? pick - 1 : numTeams - pick; // Snake draft logic
        board.push({
          round,
          pick: (round - 1) * numTeams + pick,
          teamIndex
        });
      }
    }
    setDraftBoard(board);
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 90);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentPick]);

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

  const isUserTurn = draftBoard.find(pick => pick.pick === currentPick)?.teamIndex === userTeamIndex;
  
  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === 'ALL' || player.position === selectedPosition;
    return !player.drafted && matchesSearch && matchesPosition;
  });

  const aiRecommendations = filteredPlayers.slice(0, 3); // Top 3 available players as AI suggestions

  const handleDraftPlayer = (player: Player) => {
    if (!isUserTurn) return;
    
    // Update player as drafted
    setPlayers(prev => prev.map(p => 
      p.id === player.id ? { ...p, drafted: true } : p
    ));
    
    // Add to user roster
    setUserRoster(prev => [...prev, player]);
    
    // Move to next pick
    setCurrentPick(prev => prev + 1);
    setTimeRemaining(90);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Draft Room</h1>
              <p className="text-sm text-zinc-600">Round {currentRound} • Pick {currentPick}</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className={`text-lg font-mono ${timeRemaining < 30 ? 'text-red-500' : 'text-zinc-900'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-zinc-500" />
                <span className="text-sm text-zinc-600">{numTeams} Teams</span>
              </div>
              
              {isUserTurn && (
                <Badge className="bg-orange-500 text-white">
                  Your Turn!
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - AI Recommendations & Available Players */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Recommendations */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold">AI Recommendations</h2>
                {isUserTurn && <Badge variant="outline">Your Turn</Badge>}
              </div>
              
              {isUserTurn ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiRecommendations.map((player, index) => (
                    <div
                      key={player.id}
                      className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleDraftPlayer(player)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-orange-400' : 'bg-orange-300'} text-white`}>
                          #{index + 1} Pick
                        </Badge>
                        <span className="text-xs text-zinc-500">#{player.rank}</span>
                      </div>
                      <h3 className="font-semibold text-zinc-900">{player.name}</h3>
                      <p className="text-sm text-zinc-600">{player.position} • {player.team}</p>
                      <p className="text-xs text-orange-600 mt-1">Proj: {player.projected} pts</p>
                      {index === 0 && (
                        <p className="text-xs text-orange-700 mt-2 font-medium">
                          🎯 Best value at this pick position
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <p>Waiting for Team {(draftBoard.find(pick => pick.pick === currentPick)?.teamIndex || 0) + 1} to pick...</p>
                  <p className="text-sm mt-2">AI recommendations will appear when it's your turn</p>
                </div>
              )}
            </Card>

            {/* Available Players */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Available Players</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Position Filter */}
              <div className="flex space-x-2 mb-4">
                {positions.map(pos => (
                  <Button
                    key={pos}
                    variant={selectedPosition === pos ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPosition(pos)}
                    className={selectedPosition === pos ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    {pos}
                  </Button>
                ))}
              </div>

              {/* Players List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPlayers.slice(0, 20).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                      isUserTurn ? 'cursor-pointer hover:border-orange-300' : ''
                    }`}
                    onClick={() => isUserTurn && handleDraftPlayer(player)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-zinc-500 w-8">#{player.rank}</span>
                      <div>
                        <p className="font-medium text-zinc-900">{player.name}</p>
                        <p className="text-sm text-zinc-600">{player.position} • {player.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-900">{player.projected} pts</p>
                      {isUserTurn && index < 3 && (
                        <Badge variant="outline" className="text-xs mt-1">
                          AI Suggested
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Draft Board & User Roster */}
          <div className="space-y-6">
            
            {/* User Roster */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Your Team</h2>
              </div>
              
              {userRoster.length > 0 ? (
                <div className="space-y-2">
                  {userRoster.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-zinc-900">{player.name}</p>
                        <p className="text-sm text-zinc-600">{player.position} • {player.team}</p>
                      </div>
                      <Badge className="bg-orange-500 text-white">
                        Round {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500">
                  <p>No players drafted yet</p>
                  <p className="text-sm mt-1">Your picks will appear here</p>
                </div>
              )}
            </Card>

            {/* Mini Draft Board */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Picks</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {draftBoard.slice(0, currentPick - 1).reverse().slice(0, 10).map((pick, index) => (
                  <div key={`${pick.round}-${pick.pick}`} className="flex items-center justify-between p-2 text-sm">
                    <span className="text-zinc-600">
                      {pick.round}.{pick.pick} Team {pick.teamIndex + 1}
                    </span>
                    {pick.player ? (
                      <span className="font-medium">{pick.player.name}</span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}