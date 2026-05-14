import { Vector2 } from './levels';

export const Vec2 = {
  add: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y }),
  mult: (v: Vector2, scalar: number): Vector2 => ({ x: v.x * scalar, y: v.y * scalar }),
  div: (v: Vector2, scalar: number): Vector2 => ({ x: v.x / scalar, y: v.y / scalar }),
  mag: (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y),
  magSq: (v: Vector2): number => v.x * v.x + v.y * v.y,
  normalize: (v: Vector2): Vector2 => {
    const m = Vec2.mag(v);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
  },
  dist: (a: Vector2, b: Vector2): number => Vec2.mag(Vec2.sub(a, b)),
  dot: (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y,
};
