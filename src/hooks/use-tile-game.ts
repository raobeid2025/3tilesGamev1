"use client";

import { useState, useEffect, useCallback } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Tile, 
  GameStatus, 
  EmojiTheme, 
  LevelConfig, 
  emojiThemes, 
  levelConfigs, 
  generatePatternPositions 
} from "@/utils/game-config";

export const useTileGame = () => {
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
  const [shufflesLeft, setShufflesLeft] = useState(3);
  const [peekedTileId, setPeekedTileId] = useState<number | null>(null);
  const [peekedTileEmoji, setPeekedTileEmoji] = useState<string | null>(null); // New state for peeked emoji
  const [peekUsesLeft, setPeekUsesLeft] = useState(1); // 1 peek per level
  const [isPeekModeActive, setIsPeekModeActive] = useState(false);

  const currentLevelConfig = levelConfigs.find(level => level.id === currentLevel) || levelConfigs[0];

  // Check if a tile is blocked by another tile
  const isTileBlocked = useCallback((tile: Tile, allTiles: Tile[]) => {
    return allTiles.some(t => 
      t.position.row === tile.position.row && 
      t.position.col === tile.position.col && 
      t.layer > tile.layer && 
      !t.isMatched
    );
  }, []);

  // Get the top tile at a specific position (not used for rendering, but for logic if needed)
  const getTopTileAtPosition = useCallback((row: number, col: number, allTiles: Tile[]) => {
    const tilesAtPosition = allTiles.filter(t => 
      t.position.row === row && 
      t.position.col === col && 
      !t.isMatched
    );
    
    if (tilesAtPosition.length === 0) return null;
    
    return tilesAtPosition.reduce((top, current) => 
      current.layer > (top?.layer || -1) ? current : top
    );
  }, []);

  // Get the bottom tile at a specific position
  const getBottomTileAtPosition = useCallback((row: number, col: number, allTiles: Tile[]) => {
    const tilesAtPosition = allTiles.filter(t =>
      t.position.row === row &&
      t.position.col === col &&
      !t.isMatched
    );

    if (tilesAtPosition.length === 0) return null;

    return tilesAtPosition.reduce((bottom, current) =>
      current.layer < (bottom?.layer || Infinity) ? current : bottom
    );
  }, []);

  const initializeGame = useCallback((levelId: number = currentLevel, theme: EmojiTheme = selectedTheme) => {
    const levelConfig = levelConfigs.find(level => level.id === levelId) || levelConfigs[0];
    const baseThemeEmojis = emojiThemes[theme];

    const isFilledPattern = levelConfig.layers > 1;
    const patternPositions = generatePatternPositions(levelConfig.pattern, levelConfig.gridSize, isFilledPattern);
    
    let finalTileSpots: { row: number; col: number; layer: number }[] = [];

    if (levelConfig.layers > 1) {
      // For multi-layer levels, ensure a mix of blocked and unblocked tiles
      const multiLayerRatio = 0.5; // 50% of pattern positions will have tiles on all layers
      const singleLayerRatio = 0.5; // 50% will have tiles only on the bottom layer

      const shuffledPatternPositions = [...patternPositions].sort(() => Math.random() - 0.5);

      shuffledPatternPositions.forEach((pos, index) => {
        if (index < Math.floor(patternPositions.length * multiLayerRatio)) {
          // These spots get tiles on all layers
          for (let layer = 0; layer < levelConfig.layers; layer++) {
            finalTileSpots.push({ ...pos, layer });
          }
        } else {
          // These spots get tiles only on the bottom layer
          finalTileSpots.push({ ...pos, layer: 0 });
        }
      });
    } else {
      // Single layer levels: all tiles on layer 0
      patternPositions.forEach((pos) => {
        finalTileSpots.push({ ...pos, layer: 0 });
      });
    }

    // Ensure the total number of tiles matches levelConfig.totalTiles and is a multiple of 3
    // First, shuffle the generated spots to randomize which ones are kept/removed if adjusting size
    finalTileSpots.sort(() => Math.random() - 0.5);

    // Adjust to match levelConfig.totalTiles
    if (finalTileSpots.length > levelConfig.totalTiles) {
      finalTileSpots = finalTileSpots.slice(0, levelConfig.totalTiles);
    } else if (finalTileSpots.length < levelConfig.totalTiles) {
      // If we have fewer spots than needed, add more single-layer tiles randomly
      const needed = levelConfig.totalTiles - finalTileSpots.length;
      for (let i = 0; i < needed; i++) {
        const randomPos = patternPositions[Math.floor(Math.random() * patternPositions.length)];
        finalTileSpots.push({ ...randomPos, layer: 0 });
      }
    }

    // Ensure finalTileSpots count is a multiple of 3 for emoji distribution
    while (finalTileSpots.length % 3 !== 0) {
      finalTileSpots.pop(); // Remove one if not a multiple of 3
    }

    // Now, generate emojis for the final set of spots
    const emojisForSpots: string[] = [];
    for (let i = 0; i < finalTileSpots.length / 3; i++) {
      const emojiToRepeat = baseThemeEmojis[i % baseThemeEmojis.length];
      emojisForSpots.push(emojiToRepeat, emojiToRepeat, emojiToRepeat);
    }
    const shuffledEmojis = emojisForSpots.sort(() => Math.random() - 0.5);

    let newTiles: Tile[] = [];
    finalTileSpots.forEach((spot, index) => {
      newTiles.push({
        id: index,
        emoji: shuffledEmojis[index],
        isMatched: false,
        isInSlot: false,
        layer: spot.layer,
        position: { row: spot.row, col: spot.col },
        pattern: levelConfig.pattern
      });
    });
    
    setTiles(newTiles);
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
    setShufflesLeft(3);
    setPeekedTileId(null);
    setPeekedTileEmoji(null); // Reset peeked emoji
    setPeekUsesLeft(1); // Reset peek uses for new level
    setIsPeekModeActive(false); // Deactivate peek mode on new level
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
    
    if (isTileBlocked(tile, tiles)) return; // Only move if not blocked
    
    setIsProcessingSlot(true);
    
    const updatedTiles = tiles.filter(tile => tile.id !== id);
    const movedTile = tiles.find(t => t.id === id);
    
    if (movedTile) {
      const newSlotTiles = [...slotTiles, { ...movedTile, isInSlot: true }];
      setSlotTiles(newSlotTiles);
      setTiles(updatedTiles);
      
      if (newSlotTiles.length >= currentLevelConfig.slotSize) {
        setTimeout(() => {
          setGameStatus("lost");
          setIsProcessingSlot(false);
        }, 500);
        return;
      }
      
      const emojis = newSlotTiles.map(t => t.emoji);
      const emojiCounts: Record<string, number> = {};
      
      emojis.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
      });
      
      let matchedEmoji: string | null = null;
      for (const [emoji, count] of Object.entries(emojiCounts)) {
        if (count >= 3) {
          matchedEmoji = emoji;
          break;
        }
      }
      
      if (matchedEmoji) {
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

  // Unified handler for clicking tiles on the game board
  const handleTileClickOnBoard = useCallback((tileId: number, isBlocked: boolean) => {
    const clickedTile = tiles.find(t => t.id === tileId);
    if (!clickedTile) return;

    if (isPeekModeActive || isBlocked) { // Both peek mode and default blocked tile click
      const bottomTile = getBottomTileAtPosition(clickedTile.position.row, clickedTile.position.col, tiles);
      if (bottomTile) {
        setPeekedTileId(bottomTile.id);
        setPeekedTileEmoji(bottomTile.emoji); // Set the emoji of the bottom tile
        setTimeout(() => {
          setPeekedTileId(null);
          setPeekedTileEmoji(null); // Clear the emoji after timeout
        }, 5000); // 5 seconds
        if (isPeekModeActive) {
          setIsPeekModeActive(false); // Deactivate after one peek
          setPeekUsesLeft(prev => prev - 1); // Decrement peek uses
          showSuccess("Peek used!");
        }
      }
    } else {
      // If not in peek mode and not blocked, move to slot
      moveToSlot(tileId);
    }
  }, [isPeekModeActive, moveToSlot, tiles, getBottomTileAtPosition, setPeekUsesLeft]);

  const handleActivatePeekMode = useCallback(() => {
    if (peekUsesLeft <= 0) {
      showError("No peeks left!");
      return;
    }
    if (gameStatus !== "playing" || isChecking || isProcessingSlot) return;

    setIsPeekModeActive(true);
    showSuccess("Peek mode activated! Click any tile to reveal its bottom-most tile.");
  }, [peekUsesLeft, gameStatus, isChecking, isProcessingSlot]);

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

    const boardTiles = tiles.filter(t => !t.isMatched && !t.isInSlot);
    
    const emojisAndLayers = boardTiles.map(t => ({ emoji: t.emoji, layer: t.layer }));
    emojisAndLayers.sort(() => Math.random() - 0.5);

    const shuffledBoardTiles = boardTiles.map((tile, index) => ({
      ...tile,
      emoji: emojisAndLayers[index].emoji,
      layer: emojisAndLayers[index].layer,
    }));

    const isFilledPattern = currentLevelConfig.layers > 1; // Determine if pattern should be filled
    const patternPositions = generatePatternPositions(currentLevelConfig.pattern, currentLevelConfig.gridSize, isFilledPattern);
    const availablePositions: { row: number; col: number; layer: number }[] = [];
    for (let layer = 0; layer < currentLevelConfig.layers; layer++) {
      patternPositions.forEach(pos => {
        availablePositions.push({ ...pos, layer });
      });
    }

    availablePositions.sort(() => Math.random() - 0.5);

    const finalShuffledTiles = shuffledBoardTiles.map((tile, index) => {
      const newPos = availablePositions[index % availablePositions.length];
      return {
        ...tile,
        position: { row: newPos.row, col: newPos.col },
        layer: newPos.layer,
      };
    });

    setTiles(finalShuffledTiles);
    setMoves(moves => moves + 1);
  };

  return {
    tiles,
    selectedTiles,
    moves,
    gameStatus,
    isChecking,
    selectedTheme,
    slotTiles,
    comboMessage,
    tilesToRemove,
    vibratingTiles,
    slotAnimationKey,
    currentLevel,
    showLevelComplete,
    levelSelectOpen,
    isProcessingSlot,
    shufflesLeft,
    currentLevelConfig,
    levelConfigs,
    peekedTileId,
    peekedTileEmoji, // Export new state
    peekUsesLeft,
    isPeekModeActive,
    
    isTileBlocked,
    getTopTileAtPosition,
    handleThemeChange,
    moveToSlot,
    handleSlotTileClick,
    handleTileClickOnBoard, // Export new handler
    handleActivatePeekMode, // Export new handler
    handleNextLevel,
    handlePrevLevel,
    handleRestartLevel,
    handleLevelSelect,
    handleShuffle,
    setLevelSelectOpen,
    setShowLevelComplete,
  };
};