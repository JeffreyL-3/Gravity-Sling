import React, { useState, useRef, useEffect } from 'react';
import { Level, Body, Vector2, Target, LEVELS } from '../game/levels';
import { Vec2 } from '../game/math';
import GameCanvas from './GameCanvas';
import { Plus, Move, Play, Download, X, MousePointer2, Settings2, Eye } from 'lucide-react';
import { checkLevelPossible, simulatePhysics } from '../game/solver';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#8b5cf6', // purple
  '#eab308', // yellow
  '#f97316', // orange
  '#1f2937', // dark
];

interface LevelCreatorProps {
  onClose: () => void;
}

type Tool = 'SELECT' | 'PLACE_BODY' | 'PLACE_START' | 'PLACE_TARGET';

export default function LevelCreator({ onClose }: LevelCreatorProps) {
  const [level, setLevel] = useState<Level>({
    id: 999,
    name: 'Custom Level',
    bounds: { w: 1920, h: 1080 },
    startPosition: { x: 300, y: 540 },
    target: { position: { x: 1600, y: 540 }, radius: 60, noStartRadius: 300 },
    bodies: []
  });

  const [tool, setTool] = useState<Tool>('SELECT');
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'WON' | 'LOST'>('SETUP');
  const [testSessionId, setTestSessionId] = useState(0);

  const [isCheckingPossible, setIsCheckingPossible] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [testResult, setTestResult] = useState<'NONE' | 'POSSIBLE' | 'IMPOSSIBLE'>('NONE');
  const [solutionVelocity, setSolutionVelocity] = useState<Vector2 | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [difficulty, setDifficulty] = useState<number | null>(null);

  const [playTargetVelocity, setPlayTargetVelocity] = useState<Vector2 | null>(null);

  const handleTestLevel = () => {
     setPlayTargetVelocity(null);
     if (!isPlaying) {
         setGameState('SETUP');
         setTestSessionId(prev => prev + 1);
     }
     setIsPlaying(!isPlaying);
  };

  const handlePlaySolution = () => {
     if (solutionVelocity) {
         setPlayTargetVelocity(solutionVelocity);
         setGameState('PLAYING');
         setTestSessionId(prev => prev + 1);
         setIsPlaying(true);
     }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const dragTarget = useRef<'BODY' | 'START' | 'TARGET' | null>(null);

  // For dragging
  const getMouseCoord = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement): Vector2 => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = level.bounds.w / rect.width;
    const scaleY = level.bounds.h / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  useEffect(() => {
    if (isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getMouseCoord(e, canvas);

      if (tool === 'PLACE_BODY') {
        const newBody: Body = {
          id: Date.now(),
          position: pos,
          mass: 5000,
          radius: 80,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        setLevel(prev => ({ ...prev, bodies: [...prev.bodies, newBody] }));
        setSelectedBodyId(newBody.id);
        setTool('SELECT');
        return;
      }

      if (tool === 'PLACE_START') {
        setLevel(prev => ({ ...prev, startPosition: pos }));
        setTool('SELECT');
        return;
      }

      if (tool === 'PLACE_TARGET') {
        setLevel(prev => ({ ...prev, target: { ...prev.target, position: pos } }));
        setTool('SELECT');
        return;
      }

      // SELECT tool logic (Dragging)
      if (tool === 'SELECT') {
        // Check start pos
        if (Math.hypot(pos.x - level.startPosition.x, pos.y - level.startPosition.y) < 30) {
          isDragging.current = true;
          dragTarget.current = 'START';
          return;
        }
        // Check target
        if (Math.hypot(pos.x - level.target.position.x, pos.y - level.target.position.y) < level.target.radius) {
          isDragging.current = true;
          dragTarget.current = 'TARGET';
          return;
        }
        // Check bodies
        for (const body of level.bodies) {
          if (Math.hypot(pos.x - body.position.x, pos.y - body.position.y) < body.radius) {
            isDragging.current = true;
            dragTarget.current = 'BODY';
            setSelectedBodyId(body.id);
            return;
          }
        }
        setSelectedBodyId(null);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDragging.current) return;
      
      const pos = getMouseCoord(e, canvas);
      
      if (dragTarget.current === 'START') {
        setLevel(prev => ({ ...prev, startPosition: pos }));
      } else if (dragTarget.current === 'TARGET') {
        setLevel(prev => ({ ...prev, target: { ...prev.target, position: pos } }));
      } else if (dragTarget.current === 'BODY' && selectedBodyId) {
        setLevel(prev => ({
          ...prev,
          bodies: prev.bodies.map(b => b.id === selectedBodyId ? { ...b, position: pos } : b)
        }));
      }
    };

    const handleUp = () => {
      isDragging.current = false;
      dragTarget.current = null;
    };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleUp);
    
    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleUp);
    canvas.addEventListener('touchcancel', handleUp);

    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('mouseleave', handleUp);
      
      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleUp);
      canvas.removeEventListener('touchcancel', handleUp);
    };
  }, [tool, level, selectedBodyId, isPlaying]);

  // Render loop for creator canvas
  useEffect(() => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, level.bounds.w, level.bounds.h);
      
      // BG
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, level.bounds.w, level.bounds.h);

      // Bodies
      for (const body of level.bodies) {
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
        ctx.closePath();

        if (body.id === selectedBodyId) {
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, body.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Target
      ctx.beginPath();
      ctx.arc(level.target.position.x, level.target.position.y, level.target.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();

      // Start pos
      ctx.beginPath();
      ctx.arc(level.startPosition.x, level.startPosition.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      // Show solution 
      if (showSolution && solutionVelocity) {
         let pos = level.startPosition;
         let vel = solutionVelocity;
         const DT = 1/60;
         ctx.beginPath();
         ctx.moveTo(pos.x, pos.y);
         ctx.strokeStyle = '#a855f7'; // Purple trajectory
         ctx.lineWidth = 2;
         ctx.setLineDash([10, 10]);
         
         const path = [pos];
         for(let i=0; i<60*15; i++) {
             const { newPos, newVel } = simulatePhysics(DT, pos, vel, level.bodies);
             pos = newPos;
             vel = newVel;
             if (i%5 === 0) path.push(pos);
             
             if (level.bodies.some(b => Vec2.dist(pos, b.position) < b.radius + 12)) break;
             if (Vec2.dist(pos, level.target.position) < level.target.radius + 12) break;
             if (pos.x < 0 || pos.x > level.bounds.w || pos.y < 0 || pos.y > level.bounds.h) break;
         }
         
         path.forEach(p => ctx.lineTo(p.x, p.y));
         ctx.stroke();
         ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, [level, selectedBodyId, isPlaying, showSolution, solutionVelocity]);

  const handleExport = () => {
    const json = JSON.stringify(level, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${Date.now()}.json`;
    a.click();
  };

  const handleRunSolver = async () => {
    setIsCheckingPossible(true);
    setCheckProgress(0);
    setTestResult('NONE');
    
    // Slight timeout to let UI update before blocking
    setTimeout(async () => {
       const res = await checkLevelPossible(level, (prog) => {
          setCheckProgress(prog);
       });
       if (res.isPossible) {
           setTestResult('POSSIBLE');
           setSolutionVelocity(res.solution || null);
           setDifficulty(res.difficulty ?? null);
       } else {
           setTestResult('IMPOSSIBLE');
           setSolutionVelocity(null);
           setDifficulty(null);
       }
       setIsCheckingPossible(false);
    }, 100);
  };

  const handleEstimateDifficulty = async () => {
    setIsCheckingPossible(true);
    setCheckProgress(0);
    setTestResult('NONE');
    setDifficulty(null);
    
    // Slight timeout to let UI update before blocking
    setTimeout(async () => {
       const res = await checkLevelPossible(level, (prog) => {
          setCheckProgress(prog);
       }, true);
       if (res.isPossible) {
           setTestResult('POSSIBLE');
           setSolutionVelocity(res.solution || null);
           setDifficulty(res.difficulty ?? null);
       } else {
           setTestResult('IMPOSSIBLE');
           setSolutionVelocity(null);
           setDifficulty(null);
       }
       setIsCheckingPossible(false);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row text-white font-sans">
      <div className="w-full md:w-80 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col h-1/3 md:h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-wider text-emerald-400">Level Creator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Level Name</label>
             <input 
               type="text" 
               value={level.name} 
               onChange={e => setLevel({...level, name: e.target.value})}
               className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
             />
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Load Template</label>
             <select 
               className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
               onChange={(e) => {
                 if (e.target.value) {
                   const loadedLevel = LEVELS[parseInt(e.target.value)];
                   if (loadedLevel) {
                     setLevel(JSON.parse(JSON.stringify(loadedLevel)));
                     setTestResult('NONE');
                     setSolutionVelocity(null);
                     setDifficulty(null);
                     setSelectedBodyId(null);
                   }
                   e.target.value = "";
                 }
               }}
             >
                <option value="">-- Select Built-in Level --</option>
                {LEVELS.map((lvl, index) => (
                  <option key={index} value={index}>{lvl.name}</option>
                ))}
             </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tools</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setTool('SELECT')}
                className={`flex items-center gap-2 p-2 rounded justify-center ${tool === 'SELECT' ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
              >
                <MousePointer2 size={16} /> Select
              </button>
              <button 
                onClick={() => setTool('PLACE_BODY')}
                className={`flex items-center gap-2 p-2 rounded justify-center ${tool === 'PLACE_BODY' ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
              >
                <Plus size={16} /> Planet
              </button>
              <button 
                onClick={() => setTool('PLACE_START')}
                className={`flex items-center gap-2 p-2 rounded justify-center ${tool === 'PLACE_START' ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
              >
                <Move size={16} /> Start Pos
              </button>
              <button 
                onClick={() => setTool('PLACE_TARGET')}
                className={`flex items-center gap-2 p-2 rounded justify-center ${tool === 'PLACE_TARGET' ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
              >
                <Move size={16} /> Target
              </button>
            </div>
          </div>

          {selectedBodyId && (
            <div className="p-4 bg-gray-800 rounded-lg flex flex-col gap-3">
               <h3 className="text-sm font-bold uppercase text-gray-400">Selected Planet</h3>
               <label className="flex flex-col gap-1 text-xs text-gray-400">
                  Mass
                  <input 
                    type="range" min="100" max="50000" step="100"
                    value={level.bodies.find(b => b.id === selectedBodyId)?.mass}
                    onChange={e => setLevel(prev => ({
                      ...prev, bodies: prev.bodies.map(b => b.id === selectedBodyId ? {...b, mass: Number(e.target.value)} : b)
                    }))}
                  />
               </label>
               <label className="flex flex-col gap-1 text-xs text-gray-400">
                  Radius
                  <input 
                    type="range" min="10" max="300" step="1"
                    value={level.bodies.find(b => b.id === selectedBodyId)?.radius}
                    onChange={e => setLevel(prev => ({
                      ...prev, bodies: prev.bodies.map(b => b.id === selectedBodyId ? {...b, radius: Number(e.target.value)} : b)
                    }))}
                  />
               </label>
               
               <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button 
                      key={c}
                      className="w-6 h-6 rounded-full border border-gray-600 cursor-pointer"
                      style={{ backgroundColor: c }}
                      onClick={() => setLevel(prev => ({
                        ...prev, bodies: prev.bodies.map(b => b.id === selectedBodyId ? {...b, color: c} : b)
                      }))}
                    />
                  ))}
               </div>

               <button 
                 onClick={() => {
                   setLevel(prev => ({ ...prev, bodies: prev.bodies.filter(b => b.id !== selectedBodyId)}));
                   setSelectedBodyId(null);
                 }}
                 className="mt-2 bg-red-600 hover:bg-red-500 text-white py-1 rounded text-sm uppercase font-bold"
               >
                 Delete Planet
               </button>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <div className="bg-gray-800 p-3 rounded flex flex-col gap-2">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-gray-400 uppercase">Solver tool</span>
                 {testResult === 'POSSIBLE' && <span className="text-xs font-bold text-emerald-400 border border-emerald-400 px-1 rounded">POSSIBLE</span>}
                 {testResult === 'IMPOSSIBLE' && <span className="text-xs font-bold text-red-400 border border-red-400 px-1 rounded">IMPOSSIBLE</span>}
              </div>
              <button 
                onClick={handleRunSolver}
                disabled={isCheckingPossible}
                className={`flex items-center justify-center gap-2 p-2 rounded font-bold uppercase tracking-wider transition-colors text-sm ${isCheckingPossible ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                <Settings2 size={16} className={isCheckingPossible ? 'animate-spin' : ''} /> 
                {isCheckingPossible ? `Checking... ${Math.round(checkProgress * 100)}%` : 'Check Possible'}
              </button>
              
              <button 
                onClick={handleEstimateDifficulty}
                disabled={isCheckingPossible}
                className={`flex items-center justify-center gap-2 p-2 rounded font-bold uppercase tracking-wider transition-colors text-sm ${isCheckingPossible ? 'bg-teal-900 text-teal-300' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
              >
                <Settings2 size={16} className={isCheckingPossible ? 'animate-spin' : ''} /> 
                {isCheckingPossible ? `Estimating... ${Math.round(checkProgress * 100)}%` : 'Estimate Difficulty'}
              </button>
              
              {difficulty !== null && (
                 <div className="text-xs text-teal-400 font-mono text-center mb-1">
                    Difficulty Score: {difficulty.toFixed(2)}
                 </div>
              )}

              {testResult === 'POSSIBLE' && (
                <div className="flex gap-2 mt-1">
                   <button
                      onClick={() => setShowSolution(!showSolution)}
                      className={`flex items-center justify-center gap-2 flex-1 p-2 rounded text-xs font-bold uppercase transition-colors ${showSolution ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                   >
                      <Eye size={14} /> {showSolution ? 'Hide Path' : 'Show Path'}
                   </button>
                   <button
                      onClick={handlePlaySolution}
                      className="flex items-center justify-center gap-2 flex-1 p-2 rounded text-xs font-bold uppercase transition-colors bg-emerald-600 hover:bg-emerald-500 text-white"
                   >
                      <Play size={14} /> Play
                   </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleTestLevel}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded font-bold uppercase tracking-wider transition-colors"
            >
              {isPlaying ? <X size={20} /> : <Play size={20} />} {isPlaying ? 'Stop Test' : 'Test Level'}
            </button>
            
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded font-bold uppercase tracking-wider transition-colors"
            >
              <Download size={20} /> Export JSON
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-950 p-4 flex items-center justify-center">
        {isPlaying ? (
           <div className="w-full h-full relative">
             <GameCanvas 
               key={testSessionId}
               level={level}
               gameState={gameState}
               setGameState={setGameState}
               onStateChange={(state) => setGameState(state)}
               showTrajectory={true}
               trajectoryLength={150}
               forcedInitialVelocity={playTargetVelocity}
             />
             <div className="absolute top-4 left-4 z-10 flex gap-2">
                 <button onClick={() => setGameState('PLAYING')} className="bg-emerald-600 px-4 py-2 rounded text-white font-bold">Play</button>
                 <button onClick={() => setGameState('SETUP')} className="bg-gray-600 px-4 py-2 rounded text-white font-bold">Reset</button>
             </div>
           </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
             <canvas
                ref={canvasRef}
                width={level.bounds.w}
                height={level.bounds.h}
                className={`max-w-full max-h-full block rounded-sm shadow-[0_0_60px_rgba(30,58,138,0.3)] bg-black ${tool === 'SELECT' ? 'cursor-default' : 'cursor-crosshair'} touch-none`}
             />
          </div>
        )}
      </div>
    </div>
  );
}
