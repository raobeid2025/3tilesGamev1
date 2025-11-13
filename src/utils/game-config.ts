// Tile data structure
export interface Tile {
  id: number;
  emoji: string;
  isMatched: boolean;
  isInSlot?: boolean;
  layer: number;
  position: { row: number; col: number };
  pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle';
}

// Game status types
export type GameStatus = "playing" | "won" | "lost" | "level-complete";

// Emoji themes
export type EmojiTheme = "animals" | "food" | "objects" | "faces" | "mixed";

export const emojiThemes: Record<EmojiTheme, string[]> = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐮", "🐷"],
  food: ["🍎", "🍕", "🍔", "🍟", "🥝", "🍇", "🍉", "🍓", "🍒", "🍑", "🍍", "🥥"],
  objects: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🥏", "🎮", "🎯"],
  faces: ["😀", "😂", "🥰", "😎", "🤩", "😍", "🤗", "🤑", "🤠", "🥳", "😜", "🤪"],
  mixed: ["🐶", "🍕", "⚽", "😀", "🐱", "🍔", "🏀", "😂", "🐭", "🍎", "🏈", "🥰"]
};

export interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  layers: number;
  emojisNeeded: number;
  slotSize: number;
  totalTiles: number;
  pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle';
}

// Generate levels with geometric patterns
export const generateLevels = (): LevelConfig[] => {
  const levels: LevelConfig[] = [];
  const allPatterns: ('X' | 'square' | 'diamond' | 'plus' | 'circle')[] = ['X', 'square', 'diamond', 'plus', 'circle'];
  let patternIndex = 0;

  const getNextPattern = () => {
    const pattern = allPatterns[patternIndex % allPatterns.length];
    patternIndex++;
    return pattern;
  };
  
  for (let i = 1; i <= 50; i++) {
    let gridSize: number;
    let layers: number;
    let totalTiles: number;
    let pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle';
    const slotSize = 7; // Keep slot size consistent

    if (i <= 4) { // Levels 1-4: Single Layer Intro
      gridSize = 6;
      layers = 1;
      pattern = getNextPattern(); // Cycle through patterns
      if (pattern === 'square') totalTiles = 18; // 6 emojis * 3
      else if (pattern === 'diamond') totalTiles = 15; // 5 emojis * 3
      else totalTiles = 12; // 4 emojis * 3 (for X, plus, circle)
    } else if (i <= 10) { // Levels 5-10: Two Layers Intro
      gridSize = 7;
      layers = 2;
      pattern = getNextPattern();
      totalTiles = 24; // 8 emojis * 3
    } else if (i <= 20) { // Levels 11-20: More Two Layers
      gridSize = 8;
      layers = 2;
      pattern = getNextPattern();
      totalTiles = 30; // 10 emojis * 3
    } else if (i <= 30) { // Levels 21-30: Three Layers Intro
      gridSize = 9;
      layers = 3;
      pattern = getNextPattern();
      totalTiles = 36; // 12 emojis * 3
    } else if (i <= 40) { // Levels 31-40: More Three Layers
      gridSize = 10;
      layers = 3;
      pattern = getNextPattern();
      totalTiles = 45; // 15 emojis * 3
    } else { // Levels 41-50: Four Layers Challenge
      gridSize = 11;
      layers = 4;
      pattern = getNextPattern();
      totalTiles = 60; // 20 emojis * 3
    }
    
    const emojisNeeded = totalTiles / 3; // This will always be an integer now

    levels.push({
      id: i,
      name: `Level ${i}`,
      gridSize,
      layers,
      emojisNeeded,
      slotSize,
      totalTiles,
      pattern
    });
  }
  
  return levels;
};

export const levelConfigs: LevelConfig[] = generateLevels();

// Pattern position generators
export const generatePatternPositions = (pattern: string, gridSize: number) => {
  const positions: { row: number; col: number }[] = [];
  
  switch (pattern) {
    case 'X':
      // Diagonal X pattern
      for (let i = 0; i < gridSize; i++) {
        positions.push({ row: i, col: i });
        if (i !== gridSize - 1 - i) {
          positions.push({ row: i, col: gridSize - 1 - i });
        }
      }
      break;
      
    case 'square':
      // Square outline pattern
      for (let i = 0; i < gridSize; i++) {
        positions.push({ row: 0, col: i }); // Top row
        positions.push({ row: gridSize - 1, col: i }); // Bottom row
        positions.push({ row: i, col: 0 }); // Left column
        positions.push({ row: i, col: gridSize - 1 }); // Right column
      }
      // Remove duplicates
      const uniquePositions = positions.filter((pos, index, self) => 
        index === self.findIndex(p => p.row === pos.row && p.col === pos.col)
      );
      return uniquePositions;
      
    case 'diamond':
      // Diamond pattern
      const center = Math.floor(gridSize / 2);
      for (let i = 0; i < gridSize; i++) {
        const distance = Math.abs(i - center);
        for (let j = distance; j < gridSize - distance; j++) {
          positions.push({ row: i, col: j });
        }
      }
      break;
      
    case 'plus':
      // Plus pattern
      const mid = Math.floor(gridSize / 2);
      for (let i = 0; i < gridSize; i++) {
        positions.push({ row: mid, col: i }); // Horizontal line
        positions.push({ row: i, col: mid }); // Vertical line
      }
      break;
      
    case 'circle':
      // Circle-like pattern (corners and midpoints)
      positions.push({ row: 0, col: 0 }); // Top-left
      positions.push({ row: 0, col: gridSize - 1 }); // Top-right
      positions.push({ row: gridSize - 1, col: 0 }); // Bottom-left
      positions.push({ row: gridSize - 1, col: gridSize - 1 }); // Bottom-right
      positions.push({ row: 0, col: Math.floor(gridSize / 2) }); // Top-center
      positions.push({ row: gridSize - 1, col: Math.floor(gridSize / 2) }); // Bottom-center
      positions.push({ row: Math.floor(gridSize / 2), col: 0 }); // Left-center
      positions.push({ row: Math.floor(gridSize / 2), col: gridSize - 1 }); // Right-center
      break;
  }
  
  return positions;
};