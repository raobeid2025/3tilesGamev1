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
  
  for (let i = 1; i <= 50; i++) {
    let gridSize, layers, totalTiles, pattern;
    
    if (i <= 5) {
      // Levels 1-5: X pattern
      gridSize = 6;
      layers = 1;
      pattern = 'X';
      totalTiles = 12; // 4 emojis × 3 copies
    } else if (i <= 10) {
      // Levels 6-10: Square pattern
      gridSize = 6;
      layers = 1;
      pattern = 'square';
      totalTiles = 20; // 5 emojis × 4 copies (but we'll use 3 copies)
    } else if (i <= 15) {
      // Levels 11-15: Diamond pattern
      gridSize = 6;
      layers = 1;
      pattern = 'diamond';
      totalTiles = 16; // 5 emojis × 3 copies + 1 center
    } else if (i <= 20) {
      // Levels 16-20: Plus pattern
      gridSize = 6;
      layers = 1;
      pattern = 'plus';
      totalTiles = 12; // 4 emojis × 3 copies
    } else if (i <= 25) {
      // Levels 21-25: Circle pattern
      gridSize = 6;
      layers = 1;
      pattern = 'circle';
      totalTiles = 15; // 5 emojis × 3 copies
    } else if (i <= 35) {
      // Levels 26-35: Multi-layer X pattern
      gridSize = 7;
      layers = 2;
      pattern = 'X';
      totalTiles = 24; // 8 emojis × 3 copies
    } else if (i <= 45) {
      // Levels 36-45: Multi-layer square pattern
      gridSize = 8;
      layers = 2;
      pattern = 'square';
      totalTiles = 36; // 12 emojis × 3 copies
    } else {
      // Levels 46-50: Multi-layer diamond pattern with more tiles
      gridSize = 10;
      layers = 3;
      pattern = 'diamond';
      totalTiles = 60; // 20 emojis × 3 copies (increased from 48)
    }
    
    const slotSize = 7;
    const emojisNeeded = totalTiles / 3;
    
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