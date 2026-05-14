import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Level, Vector2, Target, Body } from '../game/levels';

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};
import { Vec2 } from '../game/math';

type GameState = 'SETUP' | 'PLAYING' | 'WON' | 'LOST';

interface GameCanvasProps {
  level: Level;
  onStateChange: (state: GameState, message?: string) => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  showTrajectory: boolean;
  trajectoryLength: number;
  forcedInitialVelocity?: Vector2 | null;
}

const GRAVITY_CONST = 2500; // Tweaked for feel 
const SHIP_MASS = 1;
const SHIP_RADIUS = 24;
const MAX_START_VELOCITY = 400;

export default function GameCanvas({ level, gameState, setGameState, onStateChange, showTrajectory, trajectoryLength, forcedInitialVelocity }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game state refs (to avoid React re-renders during rendering loop)
  const shipPos = useRef<Vector2 | null>({ ...level.startPosition });
  const shipStartPos = useRef<Vector2 | null>({ ...level.startPosition });
  const shipInitialVel = useRef<Vector2>(forcedInitialVelocity ? { ...forcedInitialVelocity } : { x: 0, y: 0 });
  const shipVel = useRef<Vector2>({ x: 0, y: 0 });
  const shipPath = useRef<Vector2[]>([]);
  
  interface Star { x: number, y: number, radius: number, alpha: number, twinkleSpeed: number, color: string }
  const stars = useRef<Star[]>([]);
  
  interface Particle { x: number, y: number, vx: number, vy: number, life: number, size: number, color: string }
  const particles = useRef<Particle[]>([]);

  const isDraggingVelocity = useRef(false);
  const mousePos = useRef<Vector2>({ x: 0, y: 0 });

  const message = useRef<string>('');

  // Physics simulation step
  const simulatePhysics = (dt: number, currentPos: Vector2, currentVel: Vector2, bodies: Body[]): { newPos: Vector2, newVel: Vector2 } => {
    let totalForce = { x: 0, y: 0 };
    for (const body of bodies) {
      const dir = Vec2.sub(body.position, currentPos);
      const distSq = Math.max(Vec2.magSq(dir), 1); // Avoid div by zero
      const dist = Math.sqrt(distSq);
      
      const forceMag = GRAVITY_CONST * ((SHIP_MASS * body.mass) / distSq);
      const force = Vec2.mult(Vec2.normalize(dir), forceMag);
      totalForce = Vec2.add(totalForce, force);
    }
    
    // a = F/m
    const acc = Vec2.div(totalForce, SHIP_MASS);
    const newVel = Vec2.add(currentVel, Vec2.mult(acc, dt));
    const newPos = Vec2.add(currentPos, Vec2.mult(newVel, dt));
    
    return { newPos, newVel };
  };

  // Preview trajectory calculation
  const calcTrajectory = useCallback(() => {
    if (!shipStartPos.current || gameState !== 'SETUP') return { path: [], hitsTarget: false };
    
    const path: Vector2[] = [];
    let pos = shipStartPos.current;
    let vel = shipInitialVel.current;
    const dt = 1/60;
    
    let hitsTarget = false;
    const MAX_PREDICT_STEPS = 900;

    for (let i = 0; i < MAX_PREDICT_STEPS; i++) { // Predict frames based on length
      const { newPos, newVel } = simulatePhysics(dt, pos, vel, level.bodies);
      pos = newPos;
      vel = newVel;
      
      const inRecordingRange = i < trajectoryLength;
      if (inRecordingRange && i % 5 === 0) path.push(pos);
      
      // Stop predicting if collision happens
      if (level.bodies.some(b => Vec2.dist(pos, b.position) < b.radius + SHIP_RADIUS)) {
        if (inRecordingRange && i % 5 !== 0) path.push(pos);
        break;
      }
      if (Vec2.dist(pos, level.target.position) < level.target.radius + SHIP_RADIUS) {
        if (inRecordingRange && i % 5 !== 0) path.push(pos);
        hitsTarget = true;
        break;
      }
      if (pos.x < 0 || pos.x > level.bounds.w || pos.y < 0 || pos.y > level.bounds.h) {
        if (inRecordingRange && i % 5 !== 0) path.push(pos);
        break;
      }
    }
    return { path, hitsTarget };
  }, [level, gameState, trajectoryLength]);


  // Handle Input
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (gameState !== 'SETUP') return;
      isDraggingVelocity.current = true;
      mousePos.current = getMouseCoord(e, canvas);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (gameState !== 'SETUP') return;
      const pos = getMouseCoord(e, canvas);
      mousePos.current = pos;
      
      if (isDraggingVelocity.current && shipStartPos.current) {
         // Slingshot: drag backward to pull forward
         // So velocity is (startPos - pos) * multiplier
         const rawVel = Vec2.mult(Vec2.sub(shipStartPos.current, pos), 2.5);
         const mag = Vec2.mag(rawVel);
         if (mag > MAX_START_VELOCITY) {
            shipInitialVel.current = Vec2.mult(Vec2.normalize(rawVel), MAX_START_VELOCITY);
         } else {
            shipInitialVel.current = rawVel;
         }
      }
    };

    const handleUp = () => {
      isDraggingVelocity.current = false;
    };

    // Generate stars
    const newStars: Star[] = [];
    for (let i = 0; i < 250; i++) {
        newStars.push({
            x: Math.random() * level.bounds.w,
            y: Math.random() * level.bounds.h,
            radius: Math.random() * 1.5 + 0.2,
            alpha: Math.random(),
            twinkleSpeed: (Math.random() * 0.02) + 0.005,
            color: Math.random() > 0.8 ? '#a5b4fc' : (Math.random() > 0.5 ? '#fca5a5' : '#ffffff')
        });
    }
    stars.current = newStars;

    canvas.addEventListener('mousedown', handleDown, { passive: false });
    canvas.addEventListener('mousemove', handleMove, { passive: false });
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
  }, [gameState, level]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      // Delta time in seconds, capped at 0.05 to avoid huge jumps on lag
      const dt = Math.min((time - lastTime) / 1000, 0.05); 
      lastTime = time;

      // Update Physics
      if (gameState === 'PLAYING' && shipPos.current) {
        const { newPos, newVel } = simulatePhysics(dt, shipPos.current, shipVel.current, level.bodies);
        shipPos.current = newPos;
        shipVel.current = newVel;
        
        // Engine particles (slipstream)
        if (Math.random() < 0.6) {
           particles.current.push({
               x: newPos.x + (Math.random() - 0.5) * 8,
               y: newPos.y + (Math.random() - 0.5) * 8,
               vx: -newVel.x * 0.05 + (Math.random() - 0.5) * 15,
               vy: -newVel.y * 0.05 + (Math.random() - 0.5) * 15,
               life: 1.0,
               size: Math.random() * 2 + 1.5,
               color: '#7dd3fc'
           });
        }

        // Push to path every frame for smooth trail
        shipPath.current.push({ ...newPos });
        if (shipPath.current.length > 150) shipPath.current.shift();

        // Check Collisions
        let crashed = false;
        let reachedTarget = false;
        // Target
        if (Vec2.dist(newPos, level.target.position) < level.target.radius + SHIP_RADIUS) {
          setGameState('WON');
          onStateChange('WON', 'Target Reached!');
          reachedTarget = true;
          // Pulse particles
          for(let i = 0; i < 30; i++) {
              particles.current.push({
                  x: newPos.x,
                  y: newPos.y,
                  vx: (Math.random() - 0.5) * 200 + newVel.x * 0.1,
                  vy: (Math.random() - 0.5) * 200 + newVel.y * 0.1,
                  life: 2.0,
                  size: Math.random() * 5 + 3,
                  color: Math.random() > 0.5 ? '#34d399' : '#10b981'
              });
          }
        } else {
          // Bodies
          for (const body of level.bodies) {
            if (Vec2.dist(newPos, body.position) < body.radius + SHIP_RADIUS) {
              setGameState('LOST');
              onStateChange('LOST', 'Crashed into a planet!');
              crashed = true;
              // Explosion particles
              for(let i = 0; i < 80; i++) {
                 particles.current.push({
                     x: newPos.x,
                     y: newPos.y,
                     vx: (Math.random() - 0.5) * 500 + newVel.x * 0.3,
                     vy: (Math.random() - 0.5) * 500 + newVel.y * 0.3,
                     life: 1.8,
                     size: Math.random() * 6 + 2,
                     color: Math.random() > 0.6 ? '#ef4444' : (Math.random() > 0.3 ? '#f97316' : '#facc15')
                 });
              }
              break;
            }
          }
        }
        
        // Bounds
        if (!crashed && !reachedTarget && (newPos.x < 0 || newPos.x > level.bounds.w || newPos.y < 0 || newPos.y > level.bounds.h)) {
          setGameState('LOST');
          onStateChange('LOST', 'Ship lost in deep space...');
          crashed = true;
          // Fade out particles
          for(let i = 0; i < 30; i++) {
             particles.current.push({
                 x: newPos.x,
                 y: newPos.y,
                 vx: (Math.random() - 0.5) * 100 + newVel.x * 0.5,
                 vy: (Math.random() - 0.5) * 100 + newVel.y * 0.5,
                 life: 1.5,
                 size: Math.random() * 4 + 1,
                 color: '#94a3b8'
             });
          }
        }

        if (crashed) {
            shipPos.current = null;
        } else if (reachedTarget) {
            shipVel.current.x *= 0.5;
            shipVel.current.y *= 0.5;
        }
      } else if (gameState === 'WON' && shipPos.current) {
        // Spin and pull towards center of target
        const targetPos = level.target.position;
        const dir = Vec2.sub(targetPos, shipPos.current);
        
        // pull slowly
        shipPos.current.x += dir.x * dt * 3.0;
        shipPos.current.y += dir.y * dt * 3.0;
        
        // slow down velocity smoothly
        shipVel.current.x *= Math.pow(0.8, dt * 60);
        shipVel.current.y *= Math.pow(0.8, dt * 60);

        // optional particle trail effect when in target
        if (Math.random() < 0.3) {
            particles.current.push({
                x: shipPos.current.x + (Math.random() - 0.5) * 10,
                y: shipPos.current.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1.0,
                size: Math.random() * 3 + 1,
                color: '#34d399'
            });
        }
      }

      // Update Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
         const p = particles.current[i];
         p.x += p.vx * dt;
         p.y += p.vy * dt;
         p.life -= dt * 2.0;
         if (p.life <= 0) particles.current.splice(i, 1);
      }

      // Draw
      ctx.clearRect(0, 0, level.bounds.w, level.bounds.h);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, level.bounds.w, level.bounds.h);
      bgGrad.addColorStop(0, '#020024');
      bgGrad.addColorStop(0.5, '#090979');
      bgGrad.addColorStop(1, '#00d4ff');
      // Darker space background
      const darkGrad = ctx.createRadialGradient(level.bounds.w/2, level.bounds.h/2, 0, level.bounds.w/2, level.bounds.h/2, Math.max(level.bounds.w, level.bounds.h));
      darkGrad.addColorStop(0, '#0a0a2a');
      darkGrad.addColorStop(1, '#000000');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, level.bounds.w, level.bounds.h);

      // Draw Stars
      for (const star of stars.current) {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0) {
            star.twinkleSpeed *= -1;
            star.alpha = Math.max(0, Math.min(1, star.alpha));
        }
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      
      // Draw Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, level.bounds.w - 4, level.bounds.h - 4);

      // Draw Target No-Start Zone
      const target = level.target;
      if (gameState === 'SETUP' && shipPos.current) {
          const inNoStart = Vec2.dist(shipPos.current, target.position) < target.noStartRadius;
          ctx.beginPath();
          ctx.arc(target.position.x, target.position.y, target.noStartRadius, 0, Math.PI * 2);
          ctx.fillStyle = inNoStart ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = inNoStart ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)';
          ctx.stroke();
      }

      // Draw Target
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#34d399';
      
      // Target Event Horizon
      const targetPulse = (Math.sin(time / 400) + 1) / 2; // 0 to 1
      ctx.beginPath();
      ctx.arc(target.position.x, target.position.y, target.radius + 15 * targetPulse, 0, Math.PI * 2);
      const targetGrad = ctx.createRadialGradient(
          target.position.x, target.position.y, target.radius,
          target.position.x, target.position.y, target.radius + 20
      );
      targetGrad.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
      targetGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = targetGrad;
      ctx.fill();

      // Target Core
      ctx.beginPath();
      ctx.arc(target.position.x, target.position.y, target.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#34d399';
      ctx.stroke();
      
      // Target Inner Ring (pulsing rotation)
      const ringAngle = time / 1000;
      ctx.save();
      ctx.translate(target.position.x, target.position.y);
      ctx.rotate(ringAngle);
      ctx.beginPath();
      ctx.arc(0, 0, target.radius * 0.6, 0, Math.PI * 1.5);
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.shadowBlur = 0; // reset

      // Draw Bodies
      for (const body of level.bodies) {
        const colorRgb = hexToRgb(body.color);
        
        // Atmosphere Glow / Gravity Well visualization
        ctx.beginPath();
        const atmosSize = body.radius * 1.4;
        ctx.arc(body.position.x, body.position.y, atmosSize, 0, Math.PI * 2);
        const atmosGrad = ctx.createRadialGradient(
            body.position.x, body.position.y, body.radius * 0.9,
            body.position.x, body.position.y, atmosSize
        );
        atmosGrad.addColorStop(0, `rgba(${colorRgb}, 0.35)`);
        atmosGrad.addColorStop(1, `rgba(${colorRgb}, 0)`);
        ctx.fillStyle = atmosGrad;
        ctx.fill();

        // Planet Body
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
        
        // Enhance lighting (stronger highlight, deeper shadow)
        const planetGrad = ctx.createRadialGradient(
            body.position.x - body.radius * 0.4, body.position.y - body.radius * 0.4, body.radius * 0.05,
            body.position.x, body.position.y, body.radius
        );
        // Lighten the base color for the highlight
        planetGrad.addColorStop(0, '#ffffff');
        planetGrad.addColorStop(0.15, `rgba(255, 255, 255, 0.5)`);
        planetGrad.addColorStop(0.4, body.color);
        planetGrad.addColorStop(0.8, `rgba(${colorRgb}, 0.4)`);
        planetGrad.addColorStop(1, '#050510');
        
        ctx.fillStyle = planetGrad;
        ctx.fill();
        
        // Inner rim light
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${colorRgb}, 0.8)`;
        ctx.stroke();
      }

      // Draw Path Trail
      if (shipPath.current.length > 1) {
        for(let i=1; i<shipPath.current.length; i++) {
           ctx.beginPath();
           ctx.moveTo(shipPath.current[i-1].x, shipPath.current[i-1].y);
           ctx.lineTo(shipPath.current[i].x, shipPath.current[i].y);
           const progress = i / shipPath.current.length;
           ctx.strokeStyle = `rgba(125, 211, 252, ${progress * 0.8})`; 
           ctx.lineWidth = 4 * progress + 1;
           ctx.stroke();
        }
      }

      // Draw Particles
      for (const p of particles.current) {
         ctx.beginPath();
         ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
         ctx.globalAlpha = p.life;
         // Add a small glow to particles
         ctx.shadowBlur = 4;
         ctx.shadowColor = p.color;
         ctx.fillStyle = p.color;
         ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Draw Setup Aids
      if (gameState === 'SETUP' && shipStartPos.current) {
        // Draw predictable trajectory
        if (showTrajectory) {
            const { path: traj } = calcTrajectory();
            if (traj.length > 0) {
                ctx.beginPath();
                ctx.moveTo(shipStartPos.current.x, shipStartPos.current.y);
                for(const p of traj) ctx.lineTo(p.x, p.y);
                ctx.setLineDash([12, 12]);
                // Create gradient for trajectory
                const trajGrad = ctx.createLinearGradient(
                    shipStartPos.current.x, shipStartPos.current.y, 
                    traj[traj.length-1].x, traj[traj.length-1].y
                );
                trajGrad.addColorStop(0, 'rgba(255,255,255,1)');
                trajGrad.addColorStop(1, 'rgba(255,255,255,0.4)');
                ctx.strokeStyle = trajGrad;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw Velocity Drag Line
        if (isDraggingVelocity.current) {
            ctx.beginPath();
            ctx.moveTo(shipStartPos.current.x, shipStartPos.current.y);
            // Drawn opposite to mouse, but calculated from actual clamped velocity
            const dragVector = Vec2.div(shipInitialVel.current, 2.5);
            const targetPos = Vec2.add(shipStartPos.current, dragVector);
            ctx.lineTo(targetPos.x, targetPos.y);
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(dragVector.y, dragVector.x);
            ctx.save();
            ctx.translate(targetPos.x, targetPos.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -5);
            ctx.lineTo(-10, 5);
            ctx.fillStyle = '#f97316';
            ctx.fill();
            ctx.restore();
        }
      }

      // Draw Ship
      if (shipPos.current) {
        ctx.save();
        ctx.translate(shipPos.current.x, shipPos.current.y);
        
        // Rotation points direction of travel or direction of launch vector
        let angle = 0;
        if (gameState === 'WON') {
            // Spin slowly
            angle = (time / 200) % (Math.PI * 2);
        } else if (gameState === 'PLAYING' && Vec2.magSq(shipVel.current) > 0.1) {
            angle = Math.atan2(shipVel.current.y, shipVel.current.x);
        } else if (gameState === 'SETUP') {
           if (Vec2.magSq(shipInitialVel.current) > 0.1) {
               angle = Math.atan2(shipInitialVel.current.y, shipInitialVel.current.x);
           }
        }
        ctx.rotate(angle);

        // Ship thrust glow effect (when moving)
        if (gameState === 'PLAYING' || gameState === 'WON') {
           const speedRatio = Math.min(Vec2.mag(shipVel.current) / MAX_START_VELOCITY, 1.0);
           ctx.shadowBlur = 15 + speedRatio * 15;
           if (gameState === 'WON') {
               ctx.shadowColor = '#34d399';
           } else {
               ctx.shadowColor = '#38bdf8';
           }
           ctx.beginPath();
           // Exhaust flame
           ctx.moveTo(-SHIP_RADIUS * 0.5, 0);
           ctx.lineTo(-SHIP_RADIUS * 1.5 - (Math.random() * 5 * speedRatio), 0);
           ctx.lineWidth = 4;
           if (gameState === 'WON') {
               ctx.strokeStyle = '#6ee7b7';
           } else {
               ctx.strokeStyle = '#7dd3fc';
           }
           ctx.stroke();
        } else {
           ctx.shadowBlur = 10;
           ctx.shadowColor = '#ffffff';
        }

        ctx.beginPath();
        // Chevron shape
        ctx.moveTo(SHIP_RADIUS, 0);
        ctx.lineTo(-SHIP_RADIUS, SHIP_RADIUS * 0.8);
        ctx.lineTo(-SHIP_RADIUS * 0.5, 0);
        ctx.lineTo(-SHIP_RADIUS, -SHIP_RADIUS * 0.8);
        ctx.closePath();
        
        // Gradient ship fill
        const shipGrad = ctx.createLinearGradient(-SHIP_RADIUS, 0, SHIP_RADIUS, 0);
        shipGrad.addColorStop(0, '#e0f2fe');
        shipGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = shipGrad;
        ctx.fill();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0ea5e9';
        ctx.stroke();
        
        ctx.restore();
      }

      // --- Tutorial UI Layer --- //
      if (level.name === 'Tutorial') {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const pulse = Math.sin(time / 200) * 0.5 + 0.5;

        if (gameState === 'SETUP' && shipStartPos.current) {
          if (!isDraggingVelocity.current && Vec2.magSq(shipInitialVel.current) < 100) {
            const offset = (Math.sin(time / 200) + 1) * 40; // 0 to 80
            const cx = shipStartPos.current.x - 40 - offset;
            const cy = shipStartPos.current.y;
            
            // Draw dummy cursor representation
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.4})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(shipStartPos.current.x, shipStartPos.current.y);
            ctx.lineTo(cx, cy);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.3})`;
            ctx.setLineDash([8, 8]);
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + pulse * 0.3})`;
            ctx.font = '800 48px Inter, sans-serif';
            ctx.fillText("1. Drag backward to aim", shipStartPos.current.x, shipStartPos.current.y + 100);
          } else if (isDraggingVelocity.current) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = '800 48px Inter, sans-serif';
            ctx.fillText("Bend the trajectory around the planet", shipStartPos.current.x, shipStartPos.current.y + 100);
          } else if (!isDraggingVelocity.current && Vec2.magSq(shipInitialVel.current) >= 100) {
            const { hitsTarget } = calcTrajectory();
            
            if (hitsTarget) {
                 ctx.fillStyle = `rgba(52, 211, 153, ${0.7 + pulse * 0.3})`;
                 ctx.font = '800 48px Inter, sans-serif';
                 ctx.fillText("2. Perfect! Press PLAY ↗", shipStartPos.current.x, shipStartPos.current.y + 100);
            } else {
                 ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
                 ctx.font = '800 48px Inter, sans-serif';
                 ctx.fillText("Adjust aim (trajectory should end in green target)", shipStartPos.current.x, shipStartPos.current.y + 100);
            }
          }
        } else if (gameState === 'PLAYING') {
           ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.2})`;
           ctx.font = '800 56px Inter, sans-serif';
           ctx.fillText("Watch gravity bend your path!", level.bounds.w / 2, level.target.position.y - 300);
        }
        
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [gameState, level, onStateChange, setGameState, calcTrajectory, showTrajectory]);

  // Expose methods via useEffect intercept or refs if needed, but we manage state purely by gameState prop
  // Wait, if play button is pressed in parent, it updates gameState to PLAYING.
  // We need to set initial velocity!
  useEffect(() => {
     if (gameState === 'PLAYING') {
         shipPos.current = shipStartPos.current ? { ...shipStartPos.current } : { ...level.startPosition };
         if (forcedInitialVelocity) shipInitialVel.current = { ...forcedInitialVelocity };
         shipVel.current = { ...shipInitialVel.current };
         shipPath.current = [];
         particles.current = [];
     } else if (gameState === 'SETUP') {
         // Reset to start pos
         if (shipStartPos.current) shipPos.current = { ...shipStartPos.current };
         if (forcedInitialVelocity) shipInitialVel.current = { ...forcedInitialVelocity };
         shipPath.current = [];
         particles.current = [];
     }
  }, [gameState, level.startPosition, onStateChange, setGameState, forcedInitialVelocity]);

  // Reset entirely on level change
  useEffect(() => {
      shipPos.current = { ...level.startPosition };
      shipStartPos.current = { ...level.startPosition };
      if (forcedInitialVelocity) {
         shipInitialVel.current = { ...forcedInitialVelocity };
      } else {
         shipInitialVel.current = {x: 0, y:0};
      }
      shipPath.current = [];
      particles.current = [];
  }, [level, forcedInitialVelocity]);


  return (
    <div className="relative w-full h-[100dvh] p-2 md:p-6 overflow-hidden bg-gray-950 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={level.bounds.w}
          height={level.bounds.h}
          className="max-w-full max-h-full block cursor-crosshair touch-none rounded-sm overflow-hidden shadow-[0_0_60px_rgba(30,58,138,0.3)] bg-black"
        />
      </div>
    </div>
  );
}
