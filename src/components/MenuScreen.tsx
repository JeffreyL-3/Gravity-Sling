import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LEVELS } from '../game/levels';
import { X, Check } from 'lucide-react';

interface MenuScreenProps {
  onPlay: () => void;
  onSelectLevel: (index: number) => void;
  onCreator: () => void;
  currentLevelIndex: number;
  completedLevels: number[];
}

export default function MenuScreen({ onPlay, onSelectLevel, onCreator, currentLevelIndex, completedLevels }: MenuScreenProps) {
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);

  return (
    <div className="w-full h-screen bg-[#070b14] overflow-hidden relative flex flex-col items-center justify-center font-sans">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s'}} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center gap-12"
      >
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 tracking-tighter shadow-sm text-center">
            GRAVITY SLING
          </h1>
          <p className="text-blue-200/60 font-mono text-lg md:text-xl tracking-widest uppercase">
            Orbital Mechanics Puzzle
          </p>
          <p className="text-blue-200/80 font-mono text-xl md:text-2xl font-bold tracking-widest mt-2">
            Created by Jeffrey Liu
          </p>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-sm">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlay}
            className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xl tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all border border-white/10"
          >
            PLAY
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsLevelSelectorOpen(true)}
            className="w-full py-4 px-8 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-200 font-bold text-xl tracking-wide transition-all border border-white/10 backdrop-blur-sm"
          >
            MISSIONS
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreator}
            className="w-full py-4 px-8 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 font-bold text-xl tracking-wide transition-all border border-white/10 backdrop-blur-sm"
          >
            LEVEL EDITOR
          </motion.button>
        </div>
      </motion.div>

      {/* Level Selector Modal */}
      <AnimatePresence>
        {isLevelSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-800">
                 <h3 className="text-2xl font-black uppercase tracking-widest text-gray-200">Select Mission</h3>
                 <button 
                    onClick={() => setIsLevelSelectorOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
                 >
                   <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {LEVELS.map((l, index) => (
                    <button
                      key={l.id}
                      onClick={() => onSelectLevel(index)}
                      className={`
                        flex flex-col text-left p-4 rounded-xl border transition-all duration-200
                        ${currentLevelIndex === index
                            ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                            : completedLevels.includes(l.id)
                                ? 'bg-green-900/20 border-green-700/50 hover:bg-green-900/40 hover:border-green-500'
                                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-500'}
                      `}
                    >
                       <div className="flex justify-between items-center w-full mb-1">
                          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             Level {l.id}
                             {completedLevels.includes(l.id) && (
                                <span className="flex items-center justify-center w-4 h-4 bg-green-500/20 rounded-full">
                                   <Check size={12} className="text-green-400" />
                                </span>
                             )}
                          </span>
                          {currentLevelIndex === index && <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-sm uppercase">Current</span>}
                       </div>
                       <div className="flex justify-between items-center w-full">
                           <span className="text-lg font-bold text-gray-100">{l.name}</span>
                           {l.difficulty !== undefined && (
                              <span className="text-xs font-mono bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded ml-2">
                                 {l.difficulty.toFixed(1)}
                              </span>
                           )}
                       </div>
                    </button>
                 ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
