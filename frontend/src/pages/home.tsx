import React from 'react';
import { useGameContext } from '@/contexts/GameContext';
import Header from '@/components/game/Header';
import NewGameForm from '@/components/game/NewGameForm';
import GameScoreboard from '@/components/game/GameScoreboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { gameState, isInitialLoading } = useGameContext();
  const { currentGame } = gameState;
  
  return (
    <div className="page-container">
      <Header />
      
      <div className="space-y-8">
        {isInitialLoading ? (
          <LoadingSpinner message="Loading your games..." />
        ) : currentGame ? (
          <div className="animate-fade-in">
            <GameScoreboard />
          </div>
        ) : (
          <div className="animate-fade-in">
            <NewGameForm />
          </div>
        )}
      </div>
    </div>
  );
}
