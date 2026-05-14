# Gravity Sling - As-Built Documentation

## Overview
Gravity Sling is a 2D physics-based puzzle game set in space. Players command a spacecraft and must calculate trajectories to launch it from a starting position to a target destination. The core challenge involves navigating through the gravitational fields of various celestial bodies, all of which pull the ship inward, while avoiding collisions with those bodies and navigating around obstacles.

## Features

### Core Gameplay Mechanics
- **Physics-Based Trajectories:** Gameplay relies on Newtonian gravity calculations, accurately simulating how celestial bodies with different masses affect the path of the player's spacecraft.
- **Trajectory Prediction:** An interactive aiming system that displays a predicted trajectory pathway, allowing players to plan their moves and understand the gravitational forces at play before launching.
- **Continuous Collision Detection:** Using a line-sweep collision detection algorithm (via `pointLineDistSq`), the game ensures that fast-moving ships cannot "tunnel" through celestial bodies or the target in a single frame.
- **Out of Bounds Failure:** Going outside the level boundaries results in an immediate loss, requiring players to stay within the simulated space.

### Content & Levels
- **10 Core Hand-Crafted Levels:** Ten progressive levels varying in difficulty:
  1. Tutorial
  2. Binary System
  3. The Wall
  4. Asteroid Field
  5. Slingshot Maneuver
  6. Twin Suns (Figure 8)
  7. Wired
  8. Gravity Well
  9. The Gauntlet
  10. Event Horizon
- **Difficulty Rating:** Each level has a calculated difficulty rating, generated automatically via a brute-force solving algorithm that analyzes the curvature and precision required for the optimal solution trajectory.

### Tools & Modes
- **Level Creator:** An integrated visual editing tool allowing players or developers to construct their custom puzzle combinations. Users can:
  - Place, move, and remove celestial bodies.
  - Adjust celestial body parameters (mass, radius, visual representation).
  - Set the level boundaries, the target destination, and the ship's starting position.
  - Export and import custom levels via serialized JSON data.
- **Mission Selector:** Navigate back to previous levels or skip forward using the mission selection UI from the start menu.
- **Adjustable Trajectories:** The HUD provides toggles and sliders to turn the prediction arc on/off or adjust its length, catering to players wanting a purer challenge without trajectory assists.

## Technical Architecture

The application is a single-page reacting functional web app built with TypeScript, Vite, and Tailwind CSS. It is entirely self-contained and runs fully on the client-side without needing a backend server or database.

### Core Components
- **`App.tsx`**: The main entry point that manages the top-level application state (`MENU`, `GAME`, `CREATOR`).
- **`MenuScreen.tsx`**: The game's start menu. Includes access to the Mission Selector (where users can pick levels) and the Level Editor.
- **`GameCanvas.tsx`**: A performant HTML5 `<canvas>` rendering component. Responsible for rendering the background grid, celestial bodies, the target, the interactive aiming mechanism, the simulated prediction trail, particle trails during flight, and the player ship itself. It also runs the main game loop (`requestAnimationFrame`) during the `PLAYING` state.
- **`HUD.tsx`**: The overlay UI displaying level information, difficulty metrics, playback control buttons (Play, Reset, Next), and settings configuration tools (Trajectory Toggles and Length sliders).
- **`LevelCreator.tsx`**: A GUI specialized for building games, allowing the placement and tuning of physics objects, and serializing the level structure out as raw JSON.

### Physics & Logic Engine
Located in `src/game/math.ts` and `src/game/solver.ts`:
- **Vector Mathematics:** `math.ts` contains custom `Vector2` utility functions for addition, subtraction, scalar multiplication/division, magnitude calculation, normalization, dot products, and distance measurements.
- **Physics Simulation:** Instead of higher-order complex integrators, the game employs a Semi-Implicit Euler integration for performance and stability across high-frame-rate simulations (`newVel = currentVel + force_accel * dt; currentPos = currentPos + newVel * dt;`). Standard gravitational equations `F = G * (m1 * m2) / r^2` define the forces applied. 
- **Automated Level Solver:** `solver.ts` contains the auto-solver/evaluator. It runs simulations to test if levels are theoretically completable (`isPossible`). It uses an exhaustive broad-phase search (720 angles × 20 velocity steps) and simulates thousands of steps per candidate. Difficulty is scored internally by analyzing the trajectory curvature required (total angular change in velocity vectors).

### Game State Management
The `App` component is the source of truth for the game state, containing:
- `currentLevelIndex`: The active puzzle index pointing to the `LEVELS` array in `src/game/levels.ts`.
- `gameState`: An Enum managing the lifecycle of the level:
  - `SETUP`: The player is aiming and tuning the launch velocity.
  - `PLAYING`: The ship has launched and physics are being simulated real-time.
  - `WON`: The ship successfully impacted the target.
  - `LOST`: The ship collided with a body or flew out of bounds.
- `appMode`: Controls the top-level screen rendering: `MENU`, `GAME`, or `CREATOR`.

## UI/UX Design
- **Styling:** Designed entirely with Tailwind CSS, leveraging a dark space-themed palette (`#000000`, `#070b14`), neon accents for celestial bodies and HUD elements, and modern backdrop blur effects (`backdrop-blur-md`).
- **Animations:** Frame-to-frame `<canvas>` redraws for core gameplay, while UI transitions and dynamic visual states are powered by `motion/react` (Framer Motion).
- **Icons:** `lucide-react` provides scalable, clean vector iconography for HUD controls, play buttons, and menu navigation.

## Build Requirements & Setup
- **Toolchain:** Built using Vite + React 19 + TypeScript.
- **Dependencies:** Key packages include `react`, `react-dom`, `motion`, `lucide-react`, and `tailwindcss` (via `@tailwindcss/vite` plugin).
- **Run Instructions:** Starts out of the box via standard NPM scripts (`npm run dev` to start the development server, `npm run build` to package). No backend API, external database, or third-party OAuth is required to run the game natively.
