import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, GameState, Round } from '@/models/game';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

interface GameContextType {
  gameState: GameState;
  startNewGame: (name: string, players: string[], targetScore?: number) => Promise<void>;
  addRound: (scores: Record<string, number>) => Promise<void>;
  editRound: (roundId: string, scores: Record<string, number>) => Promise<void>;
  endGame: () => void;
  selectGame: (gameId: string) => void;
  deleteGame: (gameId: string) => Promise<void>;
  getPlayerTotals: (playerId: string) => number;
  refreshGames: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({ games: [], currentGame: null });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch games from backend on mount
  useEffect(() => {
    refreshGames();
  }, []);
  
  const refreshGames = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await frontendApiClient.get('/games');
      const games = response.data.games || [];
      setGameState(prev => ({
        ...prev,
        games
      }));
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to fetch games');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewGame = async (name: string, players: string[], targetScore = 500) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await frontendApiClient.post('/games', {
        name,
        players,
        targetScore
      });
      const newGame = response.data;
      
      setGameState(prev => ({
        ...prev,
        games: [newGame, ...prev.games],
        currentGame: newGame
      }));
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const addRound = async (scores: Record<string, number>) => {
    if (!gameState.currentGame) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await frontendApiClient.post(
        `/games/${gameState.currentGame.id}/rounds`,
        { scores }
      );
      const updatedGame = response.data;
      
      setGameState(prev => ({
        ...prev,
        games: prev.games.map(g => 
          g.id === updatedGame.id ? updatedGame : g
        ),
        currentGame: updatedGame
      }));
    } catch (err) {
      console.error('Error adding round:', err);
      setError('Failed to add round');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const editRound = async (roundId: string, scores: Record<string, number>) => {
    if (!gameState.currentGame) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await frontendApiClient.put(
        `/games/${gameState.currentGame.id}/rounds/${roundId}`,
        { scores }
      );
      const updatedGame = response.data;
      
      setGameState(prev => ({
        ...prev,
        games: prev.games.map(g => 
          g.id === updatedGame.id ? updatedGame : g
        ),
        currentGame: updatedGame
      }));
    } catch (err) {
      console.error('Error editing round:', err);
      setError('Failed to edit round');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const endGame = () => {
    if (!gameState.currentGame) return;
    
    setGameState(prev => ({
      ...prev,
      currentGame: null
    }));
  };
  
  const selectGame = (gameId: string) => {
    const selected = gameState.games.find(g => g.id === gameId) || null;
    setGameState(prev => ({
      ...prev,
      currentGame: selected
    }));
  };
  
  const deleteGame = async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await frontendApiClient.delete(`/games/${gameId}`);
      
      setGameState(prev => {
        const updatedGames = prev.games.filter(g => g.id !== gameId);
        const updatedCurrentGame = prev.currentGame?.id === gameId ? null : prev.currentGame;
        
        return {
          ...prev,
          games: updatedGames,
          currentGame: updatedCurrentGame
        };
      });
    } catch (err) {
      console.error('Error deleting game:', err);
      setError('Failed to delete game');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPlayerTotals = (playerId: string): number => {
    if (!gameState.currentGame) return 0;
    
    return gameState.currentGame.rounds.reduce((total, round) => {
      return total + (round.scores[playerId] || 0);
    }, 0);
  };
  
  return (
    <GameContext.Provider value={{
      gameState,
      startNewGame,
      addRound,
      editRound,
      endGame,
      selectGame,
      deleteGame,
      getPlayerTotals,
      refreshGames,
      isLoading,
      error
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

