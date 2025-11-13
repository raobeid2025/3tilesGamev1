"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, ArrowRight, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast"; // Import toast utilities

// Tile data structure
interface Tile {
  id: number;
  emoji: string;
  isMatched: boolean;
  isInSlot?: boolean;
  layer: number;
  position: { row: number; col: number };
  pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle';
}

// Game status types
type GameStatus = "playing" | "won" | "lost" | "level-complete";

// Emoji themes
type EmojiTheme = "animals" | "food" | "objects" | "faces" | "mixed";

const emojiThemes: Record<EmojiTheme, string[]> = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐮", "🐷"],
  food: ["🍎", "🍕", "🍔", "🍟", "🥝", "🍇", "🍉", "🍓", "🍒", "🍑", "🍍", "🥥"],
  objects: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🥏", "🎮", "🎯"],
  faces: ["😀", "😂", "🥰", "😎", "🤩", "😍", "🤗", "🤑", "🤠", "🥳", "😜", "🤪"],
  mixed: ["🐶", "🍕", "⚽", "😀", "🐱", "🍔", "🏀", "😂", "🐭", "🍎", "🏈", "🥰"]
};

// Generate levels with geometric patterns
const generateLevels = (): LevelConfig[] => {
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

interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  layers: number;
  emojisNeeded: number;
  slotSize: number;
  totalTiles: number;
  pattern: 'X' | 'square' | 'diamond' | 'plus' | 'circle';
}

const levelConfigs: LevelConfig[] = generateLevels();

// Pattern position generators
const generatePatternPositions = (pattern: string, gridSize: number) => {
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

export default function TileMasterMatch() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [isChecking, setIsChecking] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<EmojiTheme>("mixed");
  const [slotTiles, setSlotTiles] = useState<Tile[]>([]);
  const [comboMessage, setComboMessage] = useState<{emoji: string, count: number} | null>(null);
  const [tilesToRemove, setTilesToRemove] = useState<number[]>([]);
  const [vibratingTiles, setVibratingTiles] = useState<number[]>([]);
  const [slotAnimationKey, setSlotAnimationKey] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelSelectOpen, setLevelSelectOpen] = useState(false);
  const [isProcessingSlot, setIsProcessingSlot] = useState(false);
  const [shufflesLeft, setShufflesLeft] = useState(3); // New state for shuffles

  const currentLevelConfig = levelConfigs.find(level => level.id === currentLevel) || levelConfigs[0];

  // Check if a tile is blocked by another tile
  const isTileBlocked = (tile: Tile, allTiles: Tile[]) => {
    // A tile is blocked if there's another tile at the same position with a higher layer
    return allTiles.some(t => 
      t.position.row === tile.position.row && 
      t.position.col === tile.position.col && 
      t.layer > tile.layer && 
      !t.isMatched
    );
  };

  // Get the top tile at a specific position
  const getTopTileAtPosition = (row: number, col: number, allTiles: Tile[]) => {
    const tilesAtPosition = allTiles.filter(t => 
      t.position.row === row && 
      t.position.col === col && 
      !t.isMatched
    );
    
    if (tilesAtPosition.length === 0) return null;
    
    // Return the tile with the highest layer
    return tilesAtPosition.reduce((top, current) => 
      current.layer > (top?.layer || -1) ? current : top
    );
  };

  const initializeGame = useCallback((levelId: number = currentLevel, theme: EmojiTheme = selectedTheme) => {
    const levelConfig = levelConfigs.find(level => level.id === levelId) || levelConfigs[0];
    const themeEmojis = [...emojiThemes[theme]].slice(0, levelConfig.emojisNeeded);
    
    // Create exactly 3 copies of each emoji
    const allEmojis: string[] = [];
    themeEmojis.forEach(emoji => {
      for (let i = 0; i < 3; i++) {
        allEmojis.push(emoji);
      }
    });
    
    // Shuffle all emojis
    const shuffledEmojis = [...allEmojis].sort(() => Math.random() - 0.5);
    
    // Generate pattern positions
    const patternPositions = generatePatternPositions(levelConfig.pattern, levelConfig.gridSize);
    
    let allTiles: Tile[] = [];
    let idCounter = 0;
    
    // Create tiles for each layer
    for (let layer = 0; layer < levelConfig.layers; layer++) {
      patternPositions.forEach((pos, index) => {
        if (idCounter < shuffledEmojis.length) {
          allTiles.push({
            id: idCounter++,
            emoji: shuffledEmojis[idCounter - 1],
            isMatched: false,
                        isInSlot: false, // Ensure isInSlot is false for new tiles
            layer,
            position: pos,
            pattern: levelConfig.pattern
          });
        }
      });
    }
    
    setTiles(allTiles);
    setSelectedTiles([]);
    setMoves(0);
    setGameStatus("playing");
    setIsChecking(false);
    setSlotTiles([]);
    setComboMessage(null);
    setTilesToRemove([]);
    setVibratingTiles([]);
    setSlotAnimationKey(prev => prev + 1);
    setCurrentLevel(levelId);
    setShowLevelComplete(false);
    setLevelSelectOpen(false);
    setIsProcessingSlot(false);
    setShufflesLeft(3); // Reset shuffles for new level
  }, [currentLevel, selectedTheme]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleThemeChange = (value: string) => {
    const theme = value as EmojiTheme;
    setSelectedTheme(theme);
    initializeGame(currentLevel, theme);
  };

  const moveToSlot = (id: number) => {
    if (isChecking || gameStatus !== "playing" || isProcessingSlot) return;
    
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.isMatched || tile.isInSlot) return;
    
    // Check if tile is blocked by another tile
    if (isTileBlocked(tile, tiles)) return;
    
    setIsProcessingSlot(true);
    
    const updatedTiles = tiles.filter(tile => tile.id !== id);
    const movedTile = tiles.find(t => t.id === id);
    
    if (movedTile) {
      const newSlotTiles = [...slotTiles, { ...movedTile, isInSlot: true }];
      setSlotTiles(newSlotTiles);
      setTiles(updatedTiles);
      
      // Check if this is the 7th tile
      if (newSlotTiles.length >= currentLevelConfig.slotSize) {
        // Slot is full - game over
        setTimeout(() => {
          setGameStatus("lost");
          setIsProcessingSlot(false);
        }, 500);
        return;
      }
      
      // Check for matches in slot
      const emojis = newSlotTiles.map(t => t.emoji);
      const emojiCounts: Record<string, number> = {};
      
      // Count occurrences of each emoji
      emojis.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
      });
      
      // Find first emoji with 3 or more occurrences
      let matchedEmoji: string | null = null;
      for (const [emoji, count] of Object.entries(emojiCounts)) {
        if (count >= 3) {
          matchedEmoji = emoji;
          break;
        }
      }
      
      if (matchedEmoji) {
        // Remove first 3 matching tiles
        const matchingTiles = newSlotTiles.filter(t => t.emoji === matchedEmoji);
        const tilesToRemove = matchingTiles.slice(0, 3).map(t => t.id);
        
        setVibratingTiles(tilesToRemove);
        setComboMessage({ emoji: matchedEmoji, count: 3 });
        
        setTimeout(() => {
          setTilesToRemove(tilesToRemove);
          
          setTimeout(() => {
            setSlotTiles(prev => prev.filter(tile => !tilesToRemove.includes(tile.id)));
            setTilesToRemove([]);
            setVibratingTiles([]);
            setComboMessage(null);
            setMoves(moves => moves + 1);
            setSlotAnimationKey(prev => prev + 1);
            setIsProcessingSlot(false);
          }, 150);
        }, 300);
      } else {
        // No matches found - just increment moves
        setMoves(moves => moves + 1);
        setIsProcessingSlot(false);
      }
    } else {
      setIsProcessingSlot(false);
    }
  };

  const handleSlotTileClick = (id: number) => {
    if (isChecking || gameStatus !== "playing" || isProcessingSlot) return;
    
    if (selectedTiles.includes(id)) {
      setSelectedTiles(selectedTiles.filter(tileId => tileId !== id));
    } else {
      const newSelectedTiles = [...selectedTiles, id];
      setSelectedTiles(newSelectedTiles);
      
      if (newSelectedTiles.length === 3) {
        setIsChecking(true);
        setMoves(moves + 1);
        
        const [firstId, secondId, thirdId] = newSelectedTiles;
        const firstTile = [...tiles, ...slotTiles].find(t => t.id === firstId);
        const secondTile = [...tiles, ...slotTiles].find(t => t.id === secondId);
        const thirdTile = [...tiles, ...slotTiles].find(t => t.id === thirdId);
        
        if (firstTile && secondTile && thirdTile && 
            firstTile.emoji === secondTile.emoji && 
            secondTile.emoji === thirdTile.emoji) {
          setTimeout(() => {
            setTiles(prev => prev.filter(tile => 
              tile.id !== firstId && tile.id !== secondId && tile.id !== thirdId
            ));
            setSlotTiles(prev => prev.filter(tile => 
              tile.id !== firstId && tile.id !== secondId && tile.id !== thirdId
            ));
            setSelectedTiles([]);
            setIsChecking(false);
            setSlotAnimationKey(prev => prev + 1);
          }, 150);
        } else {
          setTimeout(() => {
            setSelectedTiles([]);
            setIsChecking(false);
          }, 300);
        }
      }
    }
  };

  // Check win condition - all tiles cleared
  useEffect(() => {
    if (tiles.length === 0 && slotTiles.length === 0 && gameStatus === "playing") {
      setGameStatus("won");
      setShowLevelComplete(true);
    }
  }, [tiles, slotTiles, gameStatus]);

  const handleNextLevel = () => {
    const nextLevel = currentLevel + 1;
    if (nextLevel <= levelConfigs.length) {
      initializeGame(nextLevel);
    } else {
      initializeGame(1);
    }
  };

  const handlePrevLevel = () => {
    const prevLevel = currentLevel - 1;
    if (prevLevel >= 1) {
      initializeGame(prevLevel);
    }
  };

  const handleRestartLevel = () => {
    initializeGame(currentLevel);
  };

  const handleLevelSelect = (levelId: number) => {
    initializeGame(levelId);
    setLevelSelectOpen(false);
  };

  const handleShuffle = () => {
    if (shufflesLeft <= 0) {
      showError("No shuffles left!");
      return;
    }
    if (gameStatus !== "playing" || isChecking || isProcessingSlot) return;

    setShufflesLeft(prev => prev - 1);
    showSuccess(`Shuffling tiles! ${shufflesLeft - 1} shuffles left.`);

    // Get only the tiles that are currently on the board and not matched
    const boardTiles = tiles.filter(t => !t.isMatched && !t.isInSlot);
    const slotTilesCopy = slotTiles.filter(t => !t.isMatched); // Keep slot tiles as they are

    // Extract emojis and layers from board tiles
    const emojisAndLayers = boardTiles.map(t => ({ emoji: t.emoji, layer: t.layer }));

    // Shuffle the emojis and layers
    emojisAndLayers.sort(() => Math.random() - 0.5);

    // Reassign shuffled emojis and layers to the board tiles, keeping their positions
    const shuffledBoardTiles = boardTiles.map((tile, index) => ({
      ...tile,
      emoji: emojisAndLayers[index].emoji,
      layer: emojisAndLayers[index].layer, // Reassign layer as well to potentially change blocking
    }));

    // Re-assign positions to ensure no overlaps and maintain pattern structure
    const patternPositions = generatePatternPositions(currentLevelConfig.pattern, currentLevelConfig.gridSize);
    const availablePositions: { row: number; col: number; layer: number }[] = [];
    for (let layer = 0; layer < currentLevelConfig.layers; layer++) {
      patternPositions.forEach(pos => {
        availablePositions.push({ ...pos, layer });
      });
    }

    // Shuffle available positions
    availablePositions.sort(() => Math.random() - 0.5);

    // Assign new positions and layers to shuffled tiles
    const finalShuffledTiles = shuffledBoardTiles.map((tile, index) => {
      const newPos = availablePositions[index % availablePositions.length]; // Cycle through positions if needed
      return {
        ...tile,
        position: { row: newPos.row, col: newPos.col },
        layer: newPos.layer,
      };
    });

    setTiles(finalShuffledTiles);
    setMoves(moves => moves + 1);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="w-full text-3xl font-bold text-indigo-800 mb-2">Tile Master Match</h1>
          <p className="text-indigo-600">Level {currentLevel}: Match 3 tiles to clear them!</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Moves</div>
              <div className="text-xl font-bold text-indigo-700">{moves}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Level</div>
              <div className="text-xl font-bold text-indigo-700">{currentLevel}/50</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Shuffles</div>
              <div className="text-xl font-bold text-indigo-700">{shufflesLeft}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Emoji Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed Emojis</SelectItem>
                <SelectItem value="animals">Animals</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="objects">Objects</SelectItem>
                <SelectItem value="faces">Faces</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleRestartLevel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg"
            >
              <RotateCcw size={16} />
            </Button>
            <Button 
              onClick={handleShuffle}
              disabled={shufflesLeft <= 0 || gameStatus !== "playing" || isChecking || isProcessingSlot}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg"
            >
              <Shuffle size={16} />
            </Button>
          </div>
        </div>

        <div className="text-center text-gray-600 mb-6">
          <p className="bg-white rounded-lg p-3 shadow-sm">
            Pattern: <span className="font-bold capitalize">{currentLevelConfig.pattern}</span> with {currentLevelConfig.layers} layer{currentLevelConfig.layers > 1 ? 's' : ''}. 
            Match 3+ same tiles in slot to remove them!
            <span className="block mt-1 text-red-500 font-medium">⚠️ Slot can hold max {currentLevelConfig.slotSize} tiles!</span>
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-indigo-700">Tile Slot</h2>
            <span className={`text-sm ${slotTiles.length >= currentLevelConfig.slotSize - 2 ? "text-red-500 font-bold" : "text-gray-500"}`}>
              {slotTiles.length}/{currentLevelConfig.slotSize} tiles
            </span>
          </div>
          <div className={`rounded-xl p-4 border-2 border-dashed ${slotTiles.length >= currentLevelConfig.slotSize ? "bg-red-100 border-red-400" : "bg-indigo-100 border-indigo-300"}`}
               style={{ height: '120px' }}>
            <AnimatePresence mode="popLayout">
              {slotTiles.length > 0 ? (
                <motion.div 
                  key={slotAnimationKey}
                  className="flex flex-wrap gap-3 overflow-y-auto h-full"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 1 }}
                >
                  {slotTiles.map((tile, index) => (
                    <motion.div
                      key={`slot-${tile.id}`}
                      className="relative"
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ 
                        scale: 0, 
                        opacity: 0,
                        rotate: tilesToRemove.includes(tile.id) ? 180 : 0,
                        transition: { duration: 0.15 }
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 600,
                        damping: 30,
                        layout: {
                          type: "spring",
                          stiffness: 600,
                          damping: 40
                        }
                      }}
                    >
                      <motion.div
                        animate={vibratingTiles.includes(tile.id) ? {
                          x: [0, -2, 2, -2, 2, 0],
                          y: [0, -2, 2, -2, 2, 0],
                          rotate: [0, -2, 2, -2, 2, 0]
                        } : {}}
                        transition={{ 
                          duration: 0.3,
                          repeat: vibratingTiles.includes(tile.id) ? 0 : 0,
                          ease: "easeInOut"
                        }}
                      >
                        {vibratingTiles.includes(tile.id) && (
                          <motion.div 
                            className="absolute -inset-2 rounded-full bg-yellow-400 opacity-30"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.4, 0.3]
                            }}
                            transition={{ 
                              duration: 0.3,
                              repeat: vibratingTiles.includes(tile.id) ? 0 : 0
                            }}
                          />
                        )}
                        
                        <div 
                          className={`
                            relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-white border-2 rounded-lg shadow-lg text-2xl sm:text-3xl z-10
                            ${selectedTiles.includes(tile.id) 
                              ? "border-yellow-400 bg-yellow-50 scale-90" 
                              : "border-indigo-300"}
                            transition-all duration-100 transform hover:scale-105
                          `}
                          onClick={() => handleSlotTileClick(tile.id)}
                        >
                          {tile.emoji}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Click tiles to move them here. 3+ same tiles are automatically removed!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-2 shadow-2xl relative overflow-hidden border-4 border-indigo-200">
            <div 
              className="grid gap-0.5 relative z-10"
              style={{ 
                gridTemplateColumns: `repeat(${currentLevelConfig.gridSize}, minmax(0, 1fr))`,
                width: `${currentLevelConfig.gridSize * 56}px`
              }}
            >
              {Array(currentLevelConfig.gridSize).fill(null).map((_, rowIndex) => (
                Array(currentLevelConfig.gridSize).fill(null).map((_, colIndex) => {
                  // Get the top tile at this position
                  const topTile = getTopTileAtPosition(rowIndex, colIndex, tiles);
                  
                  return (
                    <div 
                      key={`cell-${rowIndex}-${colIndex}`} 
                      className="relative flex items-center justify-center"
                      style={{ 
                        width: '52px',
                        height: '52px'
                      }}
                    >
                      {topTile ? (
                        <motion.div
                          key={`tile-${topTile.id}`}
                          className="absolute"
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ 
                            scale: 0, 
                            opacity: 0,
                            rotate: topTile.isMatched ? 360 : 0,
                            transition: { duration: 0.15 }
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 600,
                            damping: 30
                          }}
                          style={{
                            transform: `translateZ(${topTile.layer * 5}px)`,
                            zIndex: topTile.layer
                          }}
                        >
                          {/* Tile with geometric pattern */}
                          <div 
                            className={`
                              relative w-12 h-12 cursor-pointer transform transition-all duration-200
                              ${isTileBlocked(topTile, tiles) ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}
                              ${selectedTiles.includes(topTile.id) ? "scale-95" : ""}
                            `}
                            onClick={() => {
                              if (!isTileBlocked(topTile, tiles)) {
                                moveToSlot(topTile.id);
                              }
                            }}
                            style={{
                              transformStyle: "preserve-3d",
                              transform: `translateZ(${topTile.layer * 5}px) ${selectedTiles.includes(topTile.id) ? "scale(0.95)" : ""}`
                            }}
                          >
                            {/* Front face */}
                            <div className={`
                              absolute w-full h-full flex items-center justify-center rounded-lg text-2xl font-bold
                              border-2 transition-all duration-200
                              ${isTileBlocked(topTile, tiles)
                                ? "border-gray-500 bg-gray-400" 
                                : selectedTiles.includes(topTile.id)
                                  ? "border-yellow-500 bg-yellow-200"
                                  : topTile.layer === 0
                                    ? "border-indigo-500 bg-white"
                                    : topTile.layer === 1
                                      ? "border-purple-500 bg-purple-100"
                                      : "border-pink-500 bg-pink-100"}
                            `}
                              style={{
                                transform: "translateZ(10px)",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
                                background: topTile.layer === 0 
                                  ? "linear-gradient(145deg, #ffffff, #e0e0e0)" 
                                  : topTile.layer === 1 
                                    ? "linear-gradient(145deg, #f3e5f5, #d1c4e9)" 
                                    : "linear-gradient(145deg, #fce4ec, #f8bbd0)"
                              }}
                            >
                              <span className="relative z-10">{topTile.emoji}</span>
                            </div>
                            
                            {/* Top face */}
                            <div className={`
                              absolute w-full h-2 rounded-t-lg
                              ${isTileBlocked(topTile, tiles)
                                ? "bg-gray-500" 
                                : selectedTiles.includes(topTile.id)
                                  ? "bg-yellow-400"
                                  : topTile.layer === 0
                                    ? "bg-indigo-400"
                                    : topTile.layer === 1
                                      ? "bg-purple-400"
                                      : "bg-pink-400"}
                            `}
                              style={{
                                transform: "rotateX(90deg) translateZ(10px)",
                                boxShadow: "0 -2px 4px rgba(0,0,0,0.1)"
                              }}
                            ></div>
                            
                            {/* Right face */}
                            <div className={`
                              absolute h-full w-2 rounded-r-lg
                              ${isTileBlocked(topTile, tiles)
                                ? "bg-gray-600" 
                                : selectedTiles.includes(topTile.id)
                                  ? "bg-yellow-600"
                                  : topTile.layer === 0
                                    ? "bg-indigo-600"
                                    : topTile.layer === 1
                                      ? "bg-purple-600"
                                      : "bg-pink-600"}
                            `}
                              style={{
                                transform: "rotateY(90deg) translateZ(36px)",
                                boxShadow: "2px 0 4px rgba(0,0,0,0.1)"
                              }}
                            ></div>
                            
                            {/* Matched overlay */}
                            {topTile.isMatched && (
                              <div className="absolute inset-0 bg-green-500 bg-opacity-60 flex items-center justify-center rounded-lg"
                                style={{ transform: "translateZ(15px)" }}>
                                <Check className="text-white" size={24} />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        // Empty cell indicator
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 relative"
                          style={{ transform: "translateZ(0)" }}>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>

        {/* Level Navigation */}
        <div className="flex justify-center gap-4 mb-6">
          <Button 
            onClick={handlePrevLevel}
            disabled={currentLevel === 1}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Prev
          </Button>
          
          <Button 
            onClick={() => setLevelSelectOpen(!levelSelectOpen)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Select Level
          </Button>
          
          <Button 
            onClick={handleNextLevel}
            disabled={currentLevel === 50}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Level Selection Panel */}
        <AnimatePresence>
          {levelSelectOpen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-indigo-800">Select Level</h2>
                  <Button 
                    onClick={() => setLevelSelectOpen(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    Close
                  </Button>
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {levelConfigs.map((level) => (
                    <Button
                      key={level.id}
                      onClick={() => handleLevelSelect(level.id)}
                      className={`
                        h-10 flex items-center justify-center text-xs
                        ${level.id === currentLevel 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"}
                        ${level.layers > 1 ? "font-bold" : ""}
                      `}
                    >
                      {level.id}
                      {level.layers > 1 && (
                        <span className="ml-1 text-xs">({level.layers})</span>
                      )}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>Pattern levels: {levelConfigs.length}/50</p>
                  <p className="mt-1">Bold numbers indicate multi-layer levels</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameStatus === "won" && showLevelComplete && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 text-center"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-indigo-800 mb-2">Level Complete!</h2>
                <p className="text-gray-600 mb-1">
                  You cleared all tiles in <span className="font-bold">{moves}</span> moves
                </p>
                <p className="text-gray-600 mb-4">
                  Level {currentLevel} ({currentLevelConfig.pattern} pattern)
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleRestartLevel}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex-1"
                  >
                    Replay Level
                  </Button>
                  
                  <Button 
                    onClick={handleNextLevel}
                    disabled={currentLevel === 50}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 flex-1"
                  >
                    Next Level <ArrowRight size={16} />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameStatus === "lost" && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 text-center"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="text-5xl mb-4">
                  {slotTiles.length >= currentLevelConfig.slotSize ? "꽉!" : "😅"}
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">
                  {slotTiles.length >= currentLevelConfig.slotSize ? "Slot Full!" : "Game Over!"}
                </h2>
                <p className="text-gray-600 mb-1">
                  {slotTiles.length >= currentLevelConfig.slotSize 
                    ? `The slot reached ${currentLevelConfig.slotSize} tiles. Game over!` 
                    : `You cleared ${tiles.length > 0 ? currentLevelConfig.totalTiles - tiles.length - slotTiles.length : 0} tiles`}
                </p>
                <p className="text-gray-600 mb-4">
                  in <span className="font-bold">{moves}</span> moves.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleRestartLevel}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}