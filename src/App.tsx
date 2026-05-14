/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import LevelCreator from './components/LevelCreator';
import MenuScreen from './components/MenuScreen';
import { LEVELS } from './game/levels';

type GameState = 'SETUP' | 'PLAYING' | 'WON' | 'LOST';

export default function App() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [message, setMessage] = useState('');
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [trajectoryLength, setTrajectoryLength] = useState(150);
  const [appMode, setAppMode] = useState<'MENU' | 'GAME' | 'CREATOR'>('MENU');

  const level = LEVELS[currentLevelIndex];

  const handleStateChange = useCallback((newState: GameState, msg?: string) => {
    setGameState(newState);
    if (msg) setMessage(msg);
    else setMessage('');
  }, []);

  const handlePlay = () => {
    setGameState('PLAYING');
    setMessage('');
  };

  const handleReset = () => {
    setGameState('SETUP');
    setMessage('');
  };

  const handleNext = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setGameState('SETUP');
      setMessage('');
    }
  };

  const handleSelectLevel = (index: number) => {
    setCurrentLevelIndex(index);
    setGameState('SETUP');
    setMessage('');
  };

  if (appMode === 'MENU') {
    return (
      <MenuScreen 
        onPlay={() => setAppMode('GAME')} 
        onSelectLevel={(i) => {
          handleSelectLevel(i);
          setAppMode('GAME');
        }}
        onCreator={() => setAppMode('CREATOR')} 
        currentLevelIndex={currentLevelIndex}
      />
    );
  }

  if (appMode === 'CREATOR') {
    return <LevelCreator onClose={() => setAppMode('MENU')} />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <GameCanvas 
        level={level} 
        gameState={gameState} 
        setGameState={setGameState}
        onStateChange={handleStateChange}
        showTrajectory={showTrajectory}
        trajectoryLength={trajectoryLength}
      />
      <HUD 
        level={level}
        gameState={gameState}
        message={message}
        onPlay={handlePlay}
        onReset={handleReset}
        onNext={handleNext}
        totalLevels={LEVELS.length}
        showTrajectory={showTrajectory}
        setShowTrajectory={setShowTrajectory}
        trajectoryLength={trajectoryLength}
        setTrajectoryLength={setTrajectoryLength}
        onMenu={() => setAppMode('MENU')}
      />
    </div>
  );
}
