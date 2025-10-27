import React, { useState } from 'react';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { Game } from '@/models/game';

function HistoryContent() {
  const { gameState, selectGame, deleteGame } = useGameContext();
  const { games } = gameState;
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'inProgress'>('all');
  
  const getPlayerTotals = (game: Game) => {
    const totals: Record<string, number> = {};
    
    game.players.forEach(player => {
      totals[player.id] = 0;
    });
    
    game.rounds.forEach(round => {
      Object.entries(round.scores).forEach(([playerId, score]) => {
        totals[playerId] = (totals[playerId] || 0) + score;
      });
    });
    
    return totals;
  };

  // Filter games based on status
  const filteredGames = games.filter(game => {
    if (filterStatus === 'complete') return game.isComplete;
    if (filterStatus === 'inProgress') return !game.isComplete;
    return true;
  });

  // Sort games by date (newest first)
  const sortedGames = [...filteredGames].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDeleteGame = async (e: React.MouseEvent, gameId: string, gameName: string) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
      try {
        await deleteGame(gameId);
      } catch (err) {
        console.error('Failed to delete game:', err);
      }
    }
  };

  const handleViewGame = (gameId: string) => {
    selectGame(gameId);
    window.location.href = '/home';
  };

  return (
    <div className="page-container">
      <div className="mb-10">
        <h1 className="page-title mb-4">
          Game History
        </h1>
        <p className="page-description">
          View and manage all your games
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'page-btn-secondary'
          }`}
        >
          All Games ({games.length})
        </button>
        <button
          onClick={() => setFilterStatus('inProgress')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'inProgress'
              ? 'bg-primary text-white'
              : 'page-btn-secondary'
          }`}
        >
          In Progress ({games.filter(g => !g.isComplete).length})
        </button>
        <button
          onClick={() => setFilterStatus('complete')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'complete'
              ? 'bg-primary text-white'
              : 'page-btn-secondary'
          }`}
        >
          Completed ({games.filter(g => g.isComplete).length})
        </button>
      </div>

      {/* Games List */}
      {sortedGames.length === 0 ? (
        <div className="page-card-simple text-center py-12">
          <div className="page-text-muted mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="page-section-title mb-2">No games found</h3>
          <p className="page-text-muted mb-4">
            {filterStatus === 'all' 
              ? "You haven't created any games yet."
              : filterStatus === 'inProgress'
              ? "You don't have any games in progress."
              : "You haven't completed any games yet."}
          </p>
          <a href="/home" className="page-btn-primary inline-flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Your First Game</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGames.map(game => {
            const playerTotals = getPlayerTotals(game);
            
            // Find winner (player with highest score)
            let winnerId = game.players[0]?.id;
            game.players.forEach(player => {
              if (playerTotals[player.id] > playerTotals[winnerId]) {
                winnerId = player.id;
              }
            });
            
            const winner = game.players.find(p => p.id === winnerId);
            const dateFormatted = new Date(game.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return (
              <div 
                key={game.id} 
                className="page-card group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                onClick={() => handleViewGame(game.id)}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteGame(e, game.id, game.name)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg z-10"
                  title={`Delete ${game.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="page-card-header">
                  <h3 className="page-card-title group-hover:text-primary transition-colors line-clamp-1">
                    {game.name}
                  </h3>
                  <p className="page-text-muted text-xs mt-1 flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{dateFormatted}</span>
                  </p>
                </div>

                <div className="page-card-content space-y-4">
                  {/* Status */}
                  {game.isComplete ? (
                    <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <div className="text-sm min-w-0">
                        <div className="font-semibold text-yellow-800 dark:text-yellow-300 truncate">
                          Winner: {winner?.name}
                        </div>
                        <div className="text-yellow-600 dark:text-yellow-400">
                          {playerTotals[winnerId]} points
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        Game in progress
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2 text-xs page-text-muted">
                    <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-medium">{game.players.length} {game.players.length === 1 ? 'player' : 'players'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">{game.rounds.length} {game.rounds.length === 1 ? 'round' : 'rounds'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="font-medium">Target: {game.targetScore}</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button className="w-full page-btn-primary py-2 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function History() {
  return (
    <GameProvider>
      <HistoryContent />
    </GameProvider>
  );
}

