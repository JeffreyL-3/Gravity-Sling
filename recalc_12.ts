import { LEVELS } from './src/game/levels';
import { checkLevelPossible } from './src/game/solver';
import * as fs from 'fs';

async function main() {
    console.log('Recalculating difficulty for Level 12...');
    let changed = false;
    let content = fs.readFileSync('./src/game/levels.ts', 'utf-8');

    const index = LEVELS.findIndex(l => l.id === 12);
    const level = LEVELS[index];
    
    console.log(`Checking level ${index}: ${level.name}...`);
    const result = await checkLevelPossible(level, undefined, true);
    
    if (result.isPossible) {
        const calculatedDifficulty = Number(result.difficulty.toFixed(2));
        console.log(`Level ${index} (${level.name}) difficulty: ${calculatedDifficulty}`);
        
        const regex = new RegExp(`("name": "${level.name}"[\\s\\S]*?"difficulty": )([0-9.]+)`);
        content = content.replace(regex, `$1${calculatedDifficulty}`);
        changed = true;
    } else {
        console.log(`Level ${index} (${level.name}) is IMPOSSIBLE!`);
    }

    if (changed) {
        fs.writeFileSync('./src/game/levels.ts', content);
        console.log('Updated levels.ts');
    }
}

main().catch(console.error);
