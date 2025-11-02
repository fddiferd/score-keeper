import React from 'react';
import { useGameContext } from '@/contexts/GameContext';
import { Game } from '@/models/game';

const GameList: React.FC = () => {
  const { gameState, selectGame, deleteGame } = useGameContext();
  const { games } = gameState;
  
  const getPlayerTotals = (game: Game) => {
    const totals: Record<string, number> = {};
    
    game.players.forEach(player => {
      totals[player.id] = 0;
    });
    
    game.rounds.forEach(round => {
      round.scores.forEach(scoreEntry => {
        totals[scoreEntry.playerId] = (totals[scoreEntry.playerId] || 0) + scoreEntry.score;
      });
    });
    
    return totals;
  };
  
  if (games.length === 0) {
    return (
      <div className="page-card-simple text-center lg:sticky lg:top-6">
        <div className="page-text-muted mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="page-section-title mb-2">No games yet</h3>
        <p className="page-text-muted">Start your first game to begin tracking scores!</p>
      </div>
    );
  }
  
  // Sort games by date (newest first)
  const sortedGames = [...games].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDeleteGame = async (e: React.MouseEvent, gameId: string, gameName: string) => {
    e.stopPropagation(); // Prevent triggering selectGame
    
    if (window.confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
      try {
        await deleteGame(gameId);
      } catch (err) {
        console.error('Failed to delete game:', err);
      }
    }
  };
  
  return (
    <div className="page-card lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
      <div className="page-card-header">
        <h2 className="page-card-title flex items-center space-x-3">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span>Game History</span>
        </h2>
      </div>
      
      <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 space-y-4">
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
            year: 'numeric'
          });
          
          return (
            <div 
              key={game.id} 
              className="relative page-card p-4 md:p-5 hover:shadow-lg cursor-pointer transition-all duration-300 group"
              onClick={() => selectGame(game.id)}
            >
              {/* Delete button - appears on hover */}
              <button
                onClick={(e) => handleDeleteGame(e, game.id, game.name)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-lg z-10"
                title={`Delete ${game.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0 mb-4">
                <h3 className="font-bold text-base md:text-lg page-text group-hover:text-primary transition-colors line-clamp-2">
                  {game.name}
                </h3>
                <div className="text-xs page-text-muted bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full flex items-center space-x-1 whitespace-nowrap self-start sm:ml-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{dateFormatted}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {game.isComplete ? (
                  <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <div className="text-sm">
                      <div className="font-semibold text-yellow-800">Winner: {winner?.name}</div>
                      <div className="text-yellow-600">{playerTotals[winnerId]} points</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm font-semibold text-blue-800">Game in progress</div>
                  </div>
                )}
                
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameList;

