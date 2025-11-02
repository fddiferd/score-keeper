import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Game } from '@/models/game';

interface ScoreChartProps {
  game: Game;
  playerNames?: Map<string, string>;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ game, playerNames }) => {
  const getPlayerDisplayName = (playerId: string) => {
    if (playerNames && playerNames.has(playerId)) {
      return playerNames.get(playerId)!;
    }
    return game.players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  // Generate chart data from rounds
  const chartData = React.useMemo(() => {
    const data: any[] = [];
    const runningTotals: Record<string, number> = {};
    
    // Initialize running totals
    game.players.forEach(player => {
      runningTotals[player.id] = 0;
    });
    
    // Add initial point at round 0
    const startPoint: any = { round: 0 };
    game.players.forEach(player => {
      startPoint[player.id] = 0;
      startPoint[`${player.id}_name`] = getPlayerDisplayName(player.id);
    });
    data.push(startPoint);
    
    // Calculate running totals for each round
    game.rounds.forEach((round, index) => {
      const roundData: any = { round: index + 1 };
      
      game.players.forEach(player => {
        const scoreEntry = round.scores.find(s => s.playerId === player.id);
        runningTotals[player.id] += scoreEntry?.score || 0;
        roundData[player.id] = runningTotals[player.id];
        roundData[`${player.id}_name`] = getPlayerDisplayName(player.id);
      });
      
      data.push(roundData);
    });
    
    return data;
  }, [game, playerNames]);

  // Color palette - vibrant and visually appealing colors
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
          <p className="font-bold text-gray-900 dark:text-white mb-2">
            Round {label}
          </p>
          <div className="space-y-1">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {entry.name}:
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {entry.value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (game.rounds.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Score Progression</span>
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {game.rounds.length} {game.rounds.length === 1 ? 'Round' : 'Rounds'}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            {game.players.map((player, index) => (
              <linearGradient
                key={player.id}
                id={`gradient-${player.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          
          <XAxis
            dataKey="round"
            label={{ value: 'Round', position: 'insideBottom', offset: -10 }}
            stroke="#6b7280"
            style={{ fontSize: '14px', fontWeight: 500 }}
          />
          
          <YAxis
            label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
            style={{ fontSize: '14px', fontWeight: 500 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
              fontWeight: 500,
            }}
            iconType="circle"
          />
          
          {game.players.map((player, index) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              name={getPlayerDisplayName(player.id)}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              dot={{
                r: 5,
                strokeWidth: 2,
                fill: '#fff',
              }}
              activeDot={{
                r: 7,
                strokeWidth: 3,
              }}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Target Score Line Indicator */}
      {game.targetScore && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span>Target Score: <strong>{game.targetScore}</strong> points</span>
        </div>
      )}
    </div>
  );
};

export default ScoreChart;

