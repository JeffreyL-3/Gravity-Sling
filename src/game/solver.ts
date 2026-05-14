import { Level, Body, Vector2 } from './levels';
import { Vec2 } from './math';

const GRAVITY_CONST = 2500;
const SHIP_MASS = 1;
const SHIP_RADIUS = 24;
const MAX_START_VELOCITY = 400; // From GameCanvas
const MAX_STEPS = 60 * 15; // Simulate up to 15 seconds
const DT = 1/60;

export function simulatePhysics(dt: number, currentPos: Vector2, currentVel: Vector2, bodies: Body[]): { newPos: Vector2, newVel: Vector2 } {
  let totalForce = { x: 0, y: 0 };
  for (const body of bodies) {
    const dir = Vec2.sub(body.position, currentPos);
    const distSq = Math.max(Vec2.magSq(dir), 1);
    const dist = Math.sqrt(distSq);
    
    const forceMag = GRAVITY_CONST * ((SHIP_MASS * body.mass) / distSq);
    const force = Vec2.mult(Vec2.normalize(dir), forceMag);
    totalForce = Vec2.add(totalForce, force);
  }
  
  const acc = Vec2.div(totalForce, SHIP_MASS);
  const newVel = Vec2.add(currentVel, Vec2.mult(acc, dt));
  const newPos = Vec2.add(currentPos, Vec2.mult(newVel, dt));
  
  return { newPos, newVel };
}

function pointLineDistSq(p: Vector2, a: Vector2, b: Vector2): number {
    const l2 = Vec2.magSq(Vec2.sub(b, a));
    if (l2 === 0) return Vec2.magSq(Vec2.sub(p, a));
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    return Vec2.magSq(Vec2.sub(p, proj));
}

export async function checkLevelPossible(
  level: Level, 
  onProgress?: (progress: number) => void,
  estimateDifficulty: boolean = false
): Promise<{isPossible: boolean, solution?: Vector2, difficulty?: number}> {
  const numAngles = 720; // 0.5 degree steps
  const numVelocities = 20; 
  const totalSims = numAngles * numVelocities;
  let simsDone = 0;
  
  let bestDifficulty = Infinity;
  let bestSolution: Vector2 | null = null;
  let foundAny = false;

  for (let a = 0; a < numAngles; a++) {
    const angleRad = (a * 2 * Math.PI) / numAngles;
    const dir = { x: Math.cos(angleRad), y: Math.sin(angleRad) };
    
    for (let v = 1; v <= numVelocities; v++) {
      const velMag = (v / numVelocities) * MAX_START_VELOCITY;
      const initialVel = Vec2.mult(dir, velMag);
      
      let pos = level.startPosition;
      let vel = initialVel;
      let won = false;
      let collided = false;
      
      let totalCurvature = 0;
      
      for (let step = 0; step < MAX_STEPS; step++) {
        const { newPos, newVel } = simulatePhysics(DT, pos, vel, level.bodies);
        
        let angle1 = Math.atan2(vel.y, vel.x);
        let angle2 = Math.atan2(newVel.y, newVel.x);
        let diff = Math.abs(angle2 - angle1);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        totalCurvature += diff;
        
        // Culling bounds: in the actual game, going outside bounds is an immediate loss.
        if (newPos.x < 0 || newPos.x > level.bounds.w || newPos.y < 0 || newPos.y > level.bounds.h) {
            break;
        }

        // Did it hit target? (Sweep check to be precise)
        const targetRadiusHit = level.target.radius + SHIP_RADIUS;
        if (pointLineDistSq(level.target.position, pos, newPos) < targetRadiusHit * targetRadiusHit) {
            won = true;
            break;
        }
        
        // Did it hit body? (Sweep check against tunneling)
        for (const body of level.bodies) {
          const bodyRadiusHit = body.radius + SHIP_RADIUS;
          if (pointLineDistSq(body.position, pos, newPos) < bodyRadiusHit * bodyRadiusHit) {
             collided = true;
             break;
          }
        }
        if (collided) {
             break;
        }
        
        pos = newPos;
        vel = newVel;
      }
      
      simsDone++;
      if (simsDone % (numVelocities * 10) === 0 && onProgress) { 
          await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
          onProgress(simsDone / totalSims);
      }
      
      if (won && !collided) {
         foundAny = true;
         if (!estimateDifficulty) {
             if (onProgress) onProgress(1);
             return { isPossible: true, solution: initialVel };
         } else {
             if (totalCurvature < bestDifficulty) {
                 bestDifficulty = totalCurvature;
                 bestSolution = initialVel;
             }
         }
      }
    }
  }
  
  if (onProgress) onProgress(1);
  if (foundAny) {
      return { isPossible: true, solution: bestSolution!, difficulty: bestDifficulty };
  }
  return { isPossible: false };
}

