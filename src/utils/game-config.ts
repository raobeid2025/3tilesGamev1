"use client";

// Tile data structure
export interface Tile {
  id: number;
  emoji: string; // This will now store country codes for the 'countryFlags' theme
  isMatched: boolean;
  isInSlot?: boolean;
  layer: number;
  position: { row: number; col: number };
  pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle' | 'concentric-circles' | 'hollow-square' | 'spiral' | 'scattered';
}

// Game status types
export type GameStatus = "playing" | "won" | "lost" | "level-complete";

// Emoji themes
export type EmojiTheme = "animals" | "food" | "faces" | "mixed"; // Removed "countryFlags"

export const emojiThemes: Record<EmojiTheme, string[]> = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐮", "🐷"],
  food: ["🍎", "🍕", "🍔", "🍟", "🥝", "🍇", "🍉", "🍓", "🍒", "🍑", "🍍", "🥥"],
  faces: ["😀", "😂", "🥰", "😎", "🤩", "😍", "🤗", "🤑", "🤠", "🥳", "😜", "🤪"],
  mixed: ["🐶", "🍕", "😀", "🐱", "🍔", "😂", "🐭", "🍎", "🥰", "🐻", "🥝", "😎"], // Updated mixed theme
};

export interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  layers: number;
  emojisNeeded: number;
  slotSize: number;
  totalTiles: number;
  pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle' | 'concentric-circles' | 'hollow-square' | 'spiral' | 'scattered';
}

// Pattern position generators
export const generatePatternPositions = (pattern: LevelConfig['pattern'], gridSize: number, isFilled: boolean) => {
  const positions: { row: number; col: number }[] = [];
  const center = Math.floor(gridSize / 2);
  const centerX = (gridSize - 1) / 2; // Defined centerX
  const centerY = (gridSize - 1) / 2; // Defined centerY

  const addUniquePosition = (r: number, c: number) => {
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      if (!positions.some(p => p.row === r && p.col === c)) {
        positions.push({ row: r, col: c });
      }
    }
  };

  if (isFilled) {
    switch (pattern) {
      case 'X':
      case 'diamond':
        for (let i = 0; i < gridSize; i++) {
          const distance = Math.abs(i - center);
          for (let j = distance; j < gridSize - distance; j++) {
            addUniquePosition(i, j);
          }
        }
        break;
      case 'square':
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            addUniquePosition(r, c);
          }
        }
        break;
      case 'plus':
        const mid = Math.floor(gridSize / 2);
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (r === mid || c === mid) {
              addUniquePosition(r, c);
            }
          }
        }
        break;
      case 'circle':
      case 'concentric-circles': // Filled concentric circles
        const maxRadius = gridSize / 2;
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const dist = Math.sqrt(Math.pow(r - centerX, 2) + Math.pow(c - centerY, 2));
            if (dist <= maxRadius + 0.5) {
              addUniquePosition(r, c);
            }
          }
        }
        break;
      case 'hollow-square': // Filled square, but this case is for 'hollow' so it will be handled in else
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            addUniquePosition(r, c);
          }
        }
        break;
      case 'spiral': // Filled spiral (more dense)
        let r = 0, c = 0;
        let dr = 0, dc = 1; // Initial direction: right
        let visited = new Set<string>();
        let count = 0;
        let totalCells = gridSize * gridSize;

        while (count < totalCells) {
          if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && !visited.has(`${r},${c}`)) {
            addUniquePosition(r, c);
            visited.add(`${r},${c}`);
            count++;
          }

          let nextR = r + dr;
          let nextC = c + dc;

          if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize || visited.has(`${nextR},${nextC}`)) {
            // Change direction
            if (dr === 0 && dc === 1) { dr = 1; dc = 0; } // Right -> Down
            else if (dr === 1 && dc === 0) { dr = 0; dc = -1; } // Down -> Left
            else if (dr === 0 && dc === -1) { dr = -1; dc = 0; } // Left -> Up
            else if (dr === -1 && dc === 0) { dr = 0; dc = 1; } // Up -> Right
            nextR = r + dr;
            nextC = c + dc;
          }
          r = nextR;
          c = nextC;
        }
        break;
      case 'scattered': // Randomly scattered, always "filled" in a sense
        const numScatteredTiles = Math.floor(gridSize * gridSize * 0.7); // 70% of grid
        while (positions.length < numScatteredTiles) {
          addUniquePosition(Math.floor(Math.random() * gridSize), Math.floor(Math.random() * gridSize));
        }
        break;
    }
  } else { // Original (sparse) patterns for single layer
    switch (pattern) {
      case 'X':
        for (let i = 0; i < gridSize; i++) {
          addUniquePosition(i, i);
          if (i !== gridSize - 1 - i) {
            addUniquePosition(i, gridSize - 1 - i);
          }
        }
        break;
      case 'square':
        for (let i = 0; i < gridSize; i++) {
          addUniquePosition(0, i); // Top row
          addUniquePosition(gridSize - 1, i); // Bottom row
          addUniquePosition(i, 0); // Left column
          addUniquePosition(i, gridSize - 1); // Right column
        }
        break;
      case 'diamond':
        for (let i = 0; i < gridSize; i++) {
          const distance = Math.abs(i - center);
          addUniquePosition(i, center - distance);
          if (distance !== 0) {
            addUniquePosition(i, center + distance);
          }
        }
        break;
      case 'plus':
        const mid = Math.floor(gridSize / 2);
        for (let i = 0; i < gridSize; i++) {
          addUniquePosition(mid, i); // Horizontal line
          addUniquePosition(i, mid); // Vertical line
        }
        break;
      case 'circle':
      case 'concentric-circles': // Outline concentric circles
        const radii = [Math.floor(gridSize / 2) - 1, Math.floor(gridSize / 2)]; // Two main circles
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const dist = Math.sqrt(Math.pow(r - centerX, 2) + Math.pow(c - centerY, 2));
            if (radii.some(rad => Math.abs(dist - rad) < 0.8)) { // Check if close to a radius
              addUniquePosition(r, c);
            }
          }
        }
        break;
      case 'hollow-square':
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (r === 0 || r === gridSize - 1 || c === 0 || c === gridSize - 1) {
              addUniquePosition(r, c); // Outer border
            }
          }
        }
        break;
      case 'spiral': // Sparse spiral
        let sr = 0, sc = 0;
        let sdr = 0, sdc = 1;
        let sVisited = new Set<string>();
        let sCount = 0;
        let sMaxTiles = Math.floor(gridSize * gridSize * 0.5); // Fewer tiles for sparse

        while (sCount < sMaxTiles) {
          if (sr >= 0 && sr < gridSize && sc >= 0 && sc < gridSize && !sVisited.has(`${sr},${sc}`)) {
            addUniquePosition(sr, sc);
            sVisited.add(`${sr},${sc}`);
            sCount++;
          }

          let sNextR = sr + sdr;
          let sNextC = sc + sdc;

          if (sNextR < 0 || sNextR >= gridSize || sNextC < 0 || sNextC >= gridSize || sVisited.has(`${sNextR},${sNextC}`)) {
            if (sdr === 0 && sdc === 1) { sdr = 1; sdc = 0; }
            else if (sdr === 1 && sdc === 0) { sdr = 0; sdc = -1; }
            else if (sdr === 0 && sdc === -1) { sdr = -1; sdc = 0; }
            else if (sdr === -1 && sdc === 0) { sdr = 0; sdc = 1; }
            sNextR = sr + sdr;
            sNextC = sc + sdc;
          }
          sr = sNextR;
          sc = sNextC;
        }
        break;
      case 'scattered': // Randomly scattered, always "filled" in a sense
        const numScatteredTiles = Math.floor(gridSize * gridSize * 0.4); // 40% of grid for sparse
        while (positions.length < numScatteredTiles) {
          addUniquePosition(Math.floor(Math.random() * gridSize), Math.floor(Math.random() * gridSize));
        }
        break;
    }
  }
  return positions;
};

// Generate levels with geometric patterns
export const generateLevels = (): LevelConfig[] => {
  const levels: LevelConfig[] = [];
  const allPatterns: LevelConfig['pattern'][] = [
    'X', 'square', 'diamond', 'plus', 'circle',
    'concentric-circles', 'hollow-square', 'spiral', 'scattered'
  ];
  let patternIndex = 0;

  const getNextPattern = () => {
    const pattern = allPatterns[patternIndex % allPatterns.length];
    patternIndex++;
    return pattern;
  };
  
  for (let i = 1; i <= 50; i++) {
    let gridSize: number;
    let layers: number;
    let pattern: LevelConfig['pattern'];
    const slotSize = 7; // Keep slot size consistent

    if (i <= 4) { // Levels 1-4: Single Layer Intro (simple patterns)
      gridSize = 6;
      layers = 1;
      pattern = allPatterns[i - 1]; // Use first 4 simple patterns
    } else if (i <= 10) { // Levels 5-10: Two Layers Intro (mix simple and new)
      gridSize = 7;
      layers = 2;
      pattern = getNextPattern();
    } else if (i <= 20) { // Levels 11-20: More Two Layers, larger grid, more new patterns
      gridSize = 8;
      layers = 2 + (i % 2); // Alternate between 2 and 3 layers
      pattern = getNextPattern();
    } else if (i <= 30) { // Levels 21-30: Three Layers Intro, larger grid
      gridSize = 9;
      layers = 3;
      pattern = getNextPattern();
    } else if (i <= 40) { // Levels 31-40: More Three Layers, even larger grid
      gridSize = 10;
      layers = 3 + (i % 2); // Alternate between 3 and 4 layers
      pattern = getNextPattern();
    } else { // Levels 41-50: Four Layers Challenge, max grid size, all patterns
      gridSize = 11;
      layers = 4;
      pattern = getNextPattern();
    }

    const isFilledPattern = layers > 1;
    const patternPositions = generatePatternPositions(pattern, gridSize, isFilledPattern);
    
    let calculatedTotalTiles = patternPositions.length * layers;
    let minEmojisNeeded = 4; 
    if (layers === 2) minEmojisNeeded = 8;
    if (layers === 3) minEmojisNeeded = 12;
    if (layers === 4) minEmojisNeeded = 15;

    let totalTiles = Math.max(minEmojisNeeded * 3, Math.floor(calculatedTotalTiles / 3) * 3);
    totalTiles = Math.min(totalTiles, patternPositions.length * layers);
    totalTiles = Math.floor(totalTiles / 3) * 3;

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