import React, { useState, useEffect } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import { Round, Score } from '@/models/game';
import { usePlayerNames } from '@/hooks/usePlayerName';

interface ScoreInputProps {
  editingRound?: Round | null;
  onCancelEdit?: () => void;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ editingRound = null, onCancelEdit }) => {
  const { gameState, addRound, editRound } = useGameContext();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<Record<string, boolean>>({});
  const [tempInputValues, setTempInputValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common score values for quick selection
  const quickScores = [-50, -25, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 125, 150];

  // Get dynamic player names
  const playerNames = usePlayerNames(gameState.currentGame?.players || []);

  useEffect(() => {
    // If we're editing a round, populate the form with the round's scores
    if (editingRound) {
      // Convert Score[] to Record<string, number> for internal use
      const scoresRecord: Record<string, number> = {};
      editingRound.scores.forEach(scoreEntry => {
        scoresRecord[scoreEntry.playerId] = scoreEntry.score;
      });
      setScores(scoresRecord);
    } else {
      // Initialize all players with 0 scores
      const initialScores: Record<string, number> = {};
      gameState.currentGame?.players.forEach(player => {
        initialScores[player.id] = 0;
      });
      setScores(initialScores);
    }
  }, [editingRound, gameState.currentGame]);

  if (!gameState.currentGame) {
    return null;
  }

  const adjustScore = (playerId: string, delta: number) => {
    setScores(prev => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + delta
    }));
  };

  const setQuickScore = (playerId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [playerId]: score
    }));
  };

  const resetPlayerScore = (playerId: string) => {
    setScores(prev => ({
      ...prev,
      [playerId]: 0
    }));
    setInputMode(prev => ({ ...prev, [playerId]: false }));
    setTempInputValues(prev => ({ ...prev, [playerId]: '' }));
  };

  const toggleInputMode = (playerId: string) => {
    setInputMode(prev => {
      const newMode = !prev[playerId];
      if (newMode) {
        // Switching to input mode - populate with current score
        setTempInputValues(prevTemp => ({
          ...prevTemp,
          [playerId]: String(scores[playerId] || 0)
        }));
      } else {
        // Switching back to button mode - apply the input value
        const inputValue = tempInputValues[playerId];
        if (inputValue !== undefined && inputValue !== '') {
          const numValue = parseInt(inputValue) || 0;
          setScores(prevScores => ({
            ...prevScores,
            [playerId]: numValue
          }));
        }
      }
      return { ...prev, [playerId]: newMode };
    });
  };

  const handleDirectInput = (playerId: string, value: string) => {
    // Allow numbers and minus sign
    const numericValue = value.replace(/[^0-9-]/g, '');
    // Ensure minus sign only appears at the start
    const sanitizedValue = numericValue.startsWith('-') 
      ? '-' + numericValue.slice(1).replace(/-/g, '')
      : numericValue.replace(/-/g, '');
    setTempInputValues(prev => ({
      ...prev,
      [playerId]: sanitizedValue
    }));
  };

  const applyDirectInput = (playerId: string) => {
    const inputValue = tempInputValues[playerId];
    if (inputValue !== undefined && inputValue !== '') {
      const numValue = parseInt(inputValue) || 0;
      setScores(prev => ({
        ...prev,
        [playerId]: numValue
      }));
    }
    setInputMode(prev => ({ ...prev, [playerId]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all players have scores
    const allPlayersHaveScores = gameState.currentGame!.players.every(
      player => scores[player.id] !== undefined
    );
    
    if (!allPlayersHaveScores) {
      setError('Please enter scores for all players');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Convert Record<string, number> to Score[]
      const scoresArray: Score[] = gameState.currentGame!.players.map(player => ({
        playerId: player.id,
        score: scores[player.id] || 0
      }));

      if (editingRound) {
        await editRound(editingRound.id, scoresArray);
        if (onCancelEdit) onCancelEdit();
      } else {
        // Check if any player will reach the target score with this round
        const currentTotals: Record<string, number> = {};
        gameState.currentGame!.players.forEach(player => {
          const currentTotal = gameState.currentGame!.rounds.reduce((total, round) => {
            const scoreEntry = round.scores.find(s => s.playerId === player.id);
            return total + (scoreEntry?.score || 0);
          }, 0);
          currentTotals[player.id] = currentTotal + (scores[player.id] || 0);
        });
        
        const playerReachedTarget = gameState.currentGame!.players.find(player => 
          currentTotals[player.id] >= gameState.currentGame!.targetScore
        );
        
        if (playerReachedTarget && !window.confirm(
          `${playerReachedTarget.name} has reached the target score of ${gameState.currentGame!.targetScore}! Do you want to end the game?`
        )) {
          setIsSubmitting(false);
          return;
        }
        
        await addRound(scoresArray);
        
        // Reset to all zeros for next round
        const resetScores: Record<string, number> = {};
        if (gameState.currentGame) {
          gameState.currentGame.players.forEach(player => {
            resetScores[player.id] = 0;
          });
        }
        setScores(resetScores);
        if (onCancelEdit) onCancelEdit();
      }
    } catch (err) {
      setError('Failed to save round. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
    // Reset to all zeros
    const resetScores: Record<string, number> = {};
    if (gameState.currentGame) {
      gameState.currentGame.players.forEach(player => {
        resetScores[player.id] = 0;
      });
    }
    setScores(resetScores);
    setError('');
  };

  return (
    <div className="page-card-simple mb-6">
      <h3 className="page-section-title mb-6">
        {editingRound ? 'Edit Round Scores' : 'Add Round Scores'}
      </h3>
      
      {error && (
        <div className="page-alert-error mb-6">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mb-8">
          {gameState.currentGame.players.map(player => (
            <div key={player.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold page-text">
                  {playerNames.get(player.id) || player.name}
                </h4>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => resetPlayerScore(player.id)}
                    disabled={isSubmitting}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Reset to 0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleInputMode(player.id)}
                    disabled={isSubmitting}
                    className={`p-2 rounded-lg transition-colors ${
                      inputMode[player.id]
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                    title="Type score directly"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {inputMode[player.id] ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempInputValues[player.id] || ''}
                        onChange={(e) => handleDirectInput(player.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyDirectInput(player.id);
                          } else if (e.key === 'Escape') {
                            setInputMode(prev => ({ ...prev, [player.id]: false }));
                          }
                        }}
                        className="w-20 px-3 py-2 text-center text-xl font-bold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => applyDirectInput(player.id)}
                        className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                        title="Apply"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode(prev => ({ ...prev, [player.id]: false }))}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800 min-w-[60px] text-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                      {scores[player.id] || 0}
                    </div>
                  )}
                </div>
              </div>
              
              {/* +/- Controls */}
              <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-4 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => adjustScore(player.id, -10)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors text-sm"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => adjustScore(player.id, -5)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors text-sm"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => adjustScore(player.id, -1)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors text-sm"
                >
                  -1
                </button>
                
                <button
                  type="button"
                  onClick={() => adjustScore(player.id, 1)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors text-sm"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => adjustScore(player.id, 5)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors text-sm"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => adjustScore(player.id, 10)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors text-sm"
                >
                  +10
                </button>
              </div>
              
              {/* Quick Score Selection */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickScores.map(score => {
                    const isSelected = scores[player.id] === score;
                    const isClose = Math.abs((scores[player.id] || 0) - score) <= 2 && score !== 0;
                    const isNegative = score < 0;
                    
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setQuickScore(player.id, score)}
                        disabled={isSubmitting}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          isSelected
                            ? isNegative
                              ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300'
                              : 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                            : isClose
                            ? isNegative
                              ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                            : isNegative
                            ? 'bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200'
                            : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-300'
                        }`}
                      >
                        {score}
                        {isSelected && (
                          <span className="ml-1 text-xs">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 page-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (editingRound ? 'Save Changes' : 'Add Round')}
          </button>
          
          {editingRound && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 page-btn-secondary py-3"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ScoreInput;

