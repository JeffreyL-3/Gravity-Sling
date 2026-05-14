import React, { useState } from 'react';
import { Play, RotateCcw, AlertCircle, ChevronRight, Pause, List, Settings, X, Check, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Level, LEVELS } from '../game/levels';

type GameState = 'SETUP' | 'PLAYING' | 'WON' | 'LOST';

interface HUDProps {
  level: Level;
  gameState: GameState;
  message: string;
  onPlay: () => void;
  onReset: () => void;
  onNext: () => void;
  totalLevels: number;
  showTrajectory: boolean;
  setShowTrajectory: (show: boolean) => void;
  trajectoryLength: number;
  setTrajectoryLength: (len: number) => void;
  onMenu: () => void;
}

export default function HUD({ level, gameState, message, onPlay, onReset, onNext, totalLevels, showTrajectory, setShowTrajectory, trajectoryLength, setTrajectoryLength, onMenu }: HUDProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 md:p-8 flex flex-col justify-between text-white font-sans">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="text-shadow pointer-events-auto flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-md">
              Gravity Sling
            </h1>
            <h2 className="text-base sm:text-lg text-gray-300 flex items-center gap-2 uppercase tracking-widest mt-1">
              Level {level.id} <span className="opacity-50">/ {totalLevels}</span>
              <span className="hidden sm:inline">: {level.name}</span>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="hover:text-white transition-colors bg-white/10 p-1.5 rounded-md hover:bg-white/20 ml-2"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={onMenu}
                className="hover:text-white transition-colors bg-white/10 p-1.5 rounded-md hover:bg-white/20 ml-2"
                title="Menu"
              >
                <Home size={16} />
              </button>
            </h2>
            {level.difficulty !== undefined && (
              <div className="mt-1 text-sm font-mono text-cyan-400 uppercase tracking-wider bg-black/50 inline-block px-2 py-0.5 rounded">
                 Difficulty: <span className="text-white">{level.difficulty.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2 sm:gap-4 pointer-events-auto">
           {gameState === 'SETUP' && (
              <button 
                  onClick={onPlay}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
              >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" /> Play
              </button>
           )}
           {gameState === 'PLAYING' && (
              <button 
                  onClick={onReset}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
              >
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" /> Stop
              </button>
           )}
        </div>
      </div>

      {/* Middle Alerts */}
      <div className="flex-1 flex items-center justify-center pointer-events-none z-10">
        <AnimatePresence>
          {message && gameState !== 'PLAYING' && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.8, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: -20 }}
               transition={{ type: "spring", delay: 0.4, duration: 0.8 }}
               className={`
                 px-10 py-8 rounded-3xl backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]
                 flex flex-col items-center gap-4
                 ${gameState === 'WON' ? 'bg-emerald-950/70 text-emerald-100' : 'bg-red-950/70 text-red-100'}
              `}>
                  {gameState === 'WON' ? (
                       <h2 className="text-5xl font-black uppercase tracking-widest text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">Success!</h2>
                  ) : gameState === 'LOST' ? (
                       <h2 className="text-5xl font-black uppercase tracking-widest text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">Mission Failed</h2>
                  ) : null}
                  <p className="text-2xl font-medium flex items-center gap-2">
                     {gameState === 'LOST' && <AlertCircle className="text-red-400" />} {message}
                  </p>
                  
                  <div className="flex gap-4 mt-6 pointer-events-auto">
                    <button 
                        onClick={onReset}
                        className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 text-white px-6 py-3 rounded-full text-lg font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 border border-white/20"
                    >
                        <RotateCcw className="w-5 h-5" /> Retry
                    </button>
                    {gameState === 'WON' && level.id < totalLevels && (
                      <button 
                          onClick={onNext}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-3 rounded-full text-lg font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      >
                          Next Mission <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom instructions */}
      <div className="flex justify-center text-gray-400 uppercase tracking-widest text-sm text-shadow text-center">
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
               <h3 className="text-2xl font-black uppercase tracking-widest text-gray-200">Settings</h3>
               <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
               >
                 <X size={24} />
               </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
               <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                 <div className="flex flex-col">
                   <span className="text-lg font-bold text-gray-100 uppercase tracking-wider">Trajectory Line</span>
                   <span className="text-sm text-gray-400">Show aim prediction guide</span>
                 </div>
                 <button
                   onClick={() => setShowTrajectory(!showTrajectory)}
                   className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out flex ${showTrajectory ? 'bg-emerald-500 justify-end' : 'bg-gray-600 justify-start'}`}
                 >
                   <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                     {showTrajectory && <Check size={14} className="text-emerald-500" />}
                   </div>
                 </button>
               </div>
               
               {showTrajectory && (
                 <div className="flex flex-col p-4 bg-gray-800/50 border border-gray-700 rounded-xl gap-3 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                     <span className="text-lg font-bold text-gray-100 uppercase tracking-wider">Line Length</span>
                     <span className="text-sm font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                       {(trajectoryLength / 150 * 100).toFixed(0)}%
                     </span>
                   </div>
                   <input
                     type="range"
                     min="10"
                     max="300"
                     value={trajectoryLength}
                     onChange={(e) => setTrajectoryLength(Number(e.target.value))}
                     className="w-full accent-emerald-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                   />
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
