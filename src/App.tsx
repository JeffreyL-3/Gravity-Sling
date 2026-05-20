/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
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
  
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('gravity-sling-completed');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  });

  const level = LEVELS[currentLevelIndex];

  const handleStateChange = useCallback((newState: GameState, msg?: string) => {
    setGameState(newState);
    if (msg) setMessage(msg);
    else setMessage('');
    
    if (newState === 'WON') {
      const levelId = LEVELS[currentLevelIndex].id;
      setCompletedLevels(prev => {
        if (!prev.includes(levelId)) {
          const updated = [...prev, levelId];
          localStorage.setItem('gravity-sling-completed', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [currentLevelIndex]);

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

  const renderAppContent = () => {
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
          completedLevels={completedLevels}
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
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-[#070b14] portrait:flex landscape:hidden hidden flex-col items-center justify-center text-white p-6 text-center">
        <RotateCcw size={48} className="mb-6 text-cyan-400 opacity-80" />
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">Rotate Device</h2>
        <p className="text-gray-400 font-mono text-sm sm:text-base max-w-xs mx-auto">This game requires landscape orientation for the best experience.</p>
      </div>
      <div className="portrait:hidden landscape:block w-full h-screen">
        {renderAppContent()}
      </div>
    </>
  );
}
