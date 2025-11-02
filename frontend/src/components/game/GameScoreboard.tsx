import React, { useState } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import { Round, Game } from '@/models/game';
import ScoreInput from './ScoreInput';
import ScoreChart from './ScoreChart';
import EndGameModal from './EndGameModal';
import { usePlayerNames } from '@/hooks/usePlayerName';

const GameScoreboard: React.FC = () => {
  const { gameState, endGame, completeGame, refreshGames } = useGameContext();
  const { currentGame } = gameState;
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  
  if (!currentGame) {
    return null;
  }

  // Get dynamic player names (lookups for registered users, stored names for guests)
  const playerNames = usePlayerNames(currentGame.players);
  
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
  
  const playerTotals = getPlayerTotals(currentGame);
  
  // Sort players by score (highest first)
  const sortedPlayers = [...currentGame.players].sort((a, b) => 
    playerTotals[b.id] - playerTotals[a.id]
  );
  
  const handleEndGame = () => {
    setShowEndGameModal(true);
  };

  const handleCompleteGame = async () => {
    try {
      await completeGame();
      // Refresh games to ensure we have the latest state from database
      await refreshGames();
    } catch (err) {
      console.error('Error completing game:', err);
    }
  };

  const handleSaveForLater = () => {
    endGame();
  };

  const handleEditRound = (round: Round) => {
    setEditingRound(round);
    setShowScoreInput(true);
    // Scroll to the score input section
    setTimeout(() => {
      document.getElementById('score-input-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddRound = () => {
    setEditingRound(null);
    setShowScoreInput(true);
    // Scroll to the score input section
    setTimeout(() => {
      document.getElementById('score-input-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingRound(null);
    setShowScoreInput(false);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 1:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 2:
        return (
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getRankStyling = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };
  
  return (
    <>
      <div className="page-card-simple mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="page-subtitle">{currentGame.name}</h2>
            <p className="page-text-muted mt-1">Target: {currentGame.targetScore} points</p>
          </div>
          <button
            onClick={handleEndGame}
            className="page-btn-secondary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>End Game</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="page-section-title">Current Standings</h3>
          {!currentGame.isComplete && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              In Progress
            </span>
          )}
        </div>
        <div className="space-y-3 mb-8">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className={`p-4 rounded-lg border transition-colors ${getRankStyling(index)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index)}
                    <span className="text-lg font-semibold text-gray-700">#{index + 1}</span>
                  </div>
                  <span className="text-lg font-medium text-gray-800">
                    {playerNames.get(player.id) || player.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {playerTotals[player.id] || 0}
                  </div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-8 mb-4">
          <h3 className="page-section-title">Round History</h3>
          <button
            onClick={handleAddRound}
            className="page-btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Round</span>
          </button>
        </div>
        
        {currentGame.rounds.length === 0 ? (
          <div className="text-center py-12 page-text-muted bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="mb-4 opacity-50">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-lg font-medium page-text">No rounds played yet</p>
            <p className="text-sm">Click &quot;Add Round&quot; to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <th className="py-3 px-4 text-left text-sm font-semibold page-text-muted rounded-tl-lg">Round</th>
                  {currentGame.players.map(player => (
                    <th key={player.id} className="py-3 px-4 text-right text-sm font-semibold page-text-muted">
                      {playerNames.get(player.id) || player.name}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right text-sm font-semibold page-text-muted rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentGame.rounds.map((round, roundIndex) => (
                  <tr key={round.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-2 md:px-4 page-text font-medium text-sm">{roundIndex + 1}</td>
                    {currentGame.players.map(player => {
                      const scoreEntry = round.scores.find(s => s.playerId === player.id);
                      return (
                        <td key={player.id} className="py-3 px-2 md:px-4 text-right page-text font-medium text-sm">
                          {scoreEntry?.score || 0}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 md:px-4 text-right">
                      <button
                        onClick={() => handleEditRound(round)}
                        className="bg-primary/10 dark:bg-primary/20 text-primary px-2 py-1 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors inline-flex items-center text-xs"
                        title="Edit round"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Score Progression Chart */}
      {currentGame.rounds.length > 0 && (
        <div className="mb-6">
          <ScoreChart game={currentGame} playerNames={playerNames} />
        </div>
      )}
      
      {/* Score Input - Only show when editing or adding */}
      {showScoreInput && (
        <div id="score-input-section">
          <ScoreInput 
            editingRound={editingRound} 
            onCancelEdit={handleCancelEdit} 
          />
        </div>
      )}

      {/* Floating Action Button for Adding Rounds (when there are existing rounds and form is not open) */}
      {!showScoreInput && currentGame.rounds.length > 0 && (
        <button
          onClick={handleAddRound}
          className="fixed bottom-8 right-8 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 z-50"
          title="Add Round"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* End Game Modal */}
      <EndGameModal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        onComplete={handleCompleteGame}
        onSaveForLater={handleSaveForLater}
        gameName={currentGame.name}
      />
    </>
  );
};

export default GameScoreboard;

