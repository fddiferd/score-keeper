import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, GameState, Round, Score } from '@/models/game';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

interface PlayerInput {
  userId?: string;
  customName?: string;
}

interface GameContextType {
  gameState: GameState;
  startNewGame: (name: string, players: PlayerInput[], targetScore?: number) => Promise<void>;
  addRound: (scores: Score[]) => Promise<void>;
  editRound: (roundId: string, scores: Score[]) => Promise<void>;
  endGame: () => void;
  completeGame: () => Promise<void>;
  selectGame: (gameId: string) => void;
  deleteGame: (gameId: string) => Promise<void>;
  getPlayerTotals: (playerId: string) => number;
  refreshGames: (tenantWide?: boolean, userId?: string) => Promise<void>;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({ games: [], currentGame: null });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch games from backend on mount and auto-load most recent in-progress game
  useEffect(() => {
    const initializeGames = async () => {
      setIsInitialLoading(true);
      try {
        // Fetch user's active games
        const activeGamesResponse = await frontendApiClient.get('/games/my-active-games');
        const activeGames = activeGamesResponse.data.games || [];
        
        // Also fetch all games for the user
        await refreshGames();
        
        // Auto-select most recent active game if exists and no game is currently selected
        if (activeGames.length > 0 && !gameState.currentGame) {
          const mostRecentGame = activeGames[0]; // Already sorted by updated_at DESC
          setGameState(prev => ({
            ...prev,
            currentGame: mostRecentGame
          }));
        }
      } catch (err) {
        console.error('Error initializing games:', err);
        // Fall back to regular refresh
        await refreshGames();
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    initializeGames();
  }, []);
  
  const refreshGames = async (tenantWide: boolean = false, userId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tenantWide) {
        params.append('tenant_wide', 'true');
      }
      if (userId) {
        params.append('user_id', userId);
      }
      
      const response = await frontendApiClient.get(`/games?${params.toString()}`);
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
  
  const startNewGame = async (name: string, players: PlayerInput[], targetScore = 500) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await frontendApiClient.post('/games', {
        name,
        players,
        targetScore
      });
      const newGame = response.data;
      
      console.log('Game created successfully:', newGame);
      
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
  
  const addRound = async (scores: Score[]) => {
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
  
  const editRound = async (roundId: string, scores: Score[]) => {
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

  const completeGame = async () => {
    if (!gameState.currentGame) return;
    
    const gameId = gameState.currentGame.id;
    const gameName = gameState.currentGame.name;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Completing game: ${gameId} (${gameName})`);
      const response = await frontendApiClient.put(
        `/games/${gameId}/complete`
      );
      const completedGame = response.data;
      
      console.log(`Game completed successfully. isComplete: ${completedGame.isComplete}`, completedGame);
      
      setGameState(prev => ({
        ...prev,
        games: prev.games.map(g => 
          g.id === completedGame.id ? completedGame : g
        ),
        currentGame: null
      }));
    } catch (err) {
      console.error('Error completing game:', err);
      setError('Failed to complete game');
      throw err;
    } finally {
      setIsLoading(false);
    }
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
      const scoreEntry = round.scores.find(s => s.playerId === playerId);
      return total + (scoreEntry?.score || 0);
    }, 0);
  };
  
  return (
    <GameContext.Provider value={{
      gameState,
      startNewGame,
      addRound,
      editRound,
      endGame,
      completeGame,
      selectGame,
      deleteGame,
      getPlayerTotals,
      refreshGames,
      isLoading,
      isInitialLoading,
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

