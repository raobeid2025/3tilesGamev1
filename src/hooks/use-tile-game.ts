"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [peekedTileId, setPeekedTileId] = useState<number | null>(null); // ID of the actual bottom tile
  const [peekedTileEmoji, setPeekedTileEmoji] = useState<string | null>(null); // Emoji of the actual bottom tile
  const [peekDisplayTileId, setPeekDisplayTileId] = useState<number | null>(null); // ID of the clicked tile to display peeked emoji
  const [peekUsesLeft, setPeekUsesLeft] = useState(3); // Changed from 1 to 3 peeks per level
  const [isPeekModeActive, setIsPeekModeActive] = useState(false);
  const [blockingTilesToMove, setBlockingTilesToMove] = useState<number[]>([]); // New state for tiles to move during peek
  const [blockedStatusMap, setBlockedStatusMap] = useState<Map<number, boolean>>(new Map()); // Corrected: Initialize with useState

  const currentLevelConfig = levelConfigs.find(level => level.id === currentLevel) || levelConfigs[0];

  // Effect to pre-calculate blocking status whenever 'tiles' changes
  useEffect(() => {
    const newBlockedStatusMap = new Map<number, boolean>();
    const tilesByPosition = new Map<string, Tile[]>();

    // Group tiles by their grid position
    tiles.forEach(tile => {
      const key = `${tile.position.row},${tile.position.col}`;
      if (!tilesByPosition.has(key)) {
        tilesByPosition.set(key, []);
      }
      tilesByPosition.get(key)?.push(tile);
    });

    // Determine blocking status for each tile
    tiles.forEach(tile => {
      if (tile.isMatched) { // Matched tiles are not blocking and not blocked
        newBlockedStatusMap.set(tile.id, false);
        return;
      }

      const key = `${tile.position.row},${tile.position.col}`;
      const potentialBlockers = tilesByPosition.get(key);

      if (potentialBlockers) {
        const isCurrentlyBlocked = potentialBlockers.some(blocker =>
          blocker.layer > tile.layer && !blocker.isMatched
        );
        newBlockedStatusMap.set(tile.id, isCurrentlyBlocked);
      } else {
        newBlockedStatusMap.set(tile.id, false);
      }
    });
    setBlockedStatusMap(newBlockedStatusMap);
  }, [tiles]); // Recalculate when tiles array changes

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

  // Get ALL un-matched tiles on layers below the clicked tile at the same position
  const getTilesBelow = useCallback((clickedTile: Tile, allTiles: Tile[]) => {
    return allTiles
      .filter(t =>
        t.position.row === clickedTile.position.row &&
        t.position.col === clickedTile.position.col &&
        !t.isMatched &&
        t.layer < clickedTile.layer // Only consider tiles on layers below the clicked tile
      )
      .sort((a, b) => b.layer - a.layer); // Sort by layer descending, so the highest layer below is first
  }, []);

  // Determine if there are any tiles that can be peeked (at least one tile below for multi-layer levels)
  const hasPeekableTiles = useMemo(() => {
    if (currentLevelConfig.layers <= 1) return false; // No layers to peek if one or zero layers

    // For any multi-layer level, we need at least 1 tile below to consider it peekable.
    const minTilesBelowForPeek = 1; 

    for (const tile of tiles) {
      // A tile is "peekable" if it's not matched, not in the slot,
      // AND it has at least one tile below it.
      if (!tile.isMatched && !tile.isInSlot) {
        const tilesBelow = getTilesBelow(tile, tiles);
        if (tilesBelow.length >= minTilesBelowForPeek) {
          return true; // Found at least one tile that can be peeked through
        }
      }
    }
    return false; // No peekable tiles found
  }, [tiles, currentLevelConfig.layers, getTilesBelow]); // Removed blockedStatusMap from dependencies

  const initializeGame = useCallback((levelId: number = currentLevel, theme: EmojiTheme = selectedTheme) => {
    const levelConfig = levelConfigs.find(level => level.id === levelId) || levelConfigs[0];
    const baseThemeEmojis = emojiThemes[theme];

    const isFilledPattern = levelConfig.layers > 1;
    const patternPositions = generatePatternPositions(levelConfig.pattern, levelConfig.gridSize, isFilledPattern);
    
    let finalTileSpots: { row: number; col: number; layer: number }[] = [];
    const occupiedSpots = new Set<string>(); // To track unique (row, col, layer)

    const addUniqueSpot = (row: number, col: number, layer: number) => {
      const key = `${row},${col},${layer}`;
      if (!occupiedSpots.has(key)) {
        finalTileSpots.push({ row, col, layer });
        occupiedSpots.add(key);
        return true;
      }
      return false;
    };

    if (levelConfig.layers > 1) {
      // For multi-layer levels, ensure a mix of blocked and unblocked tiles
      const multiLayerRatio = 0.5; // 50% of pattern positions will have tiles on all layers
      const singleLayerRatio = 0.5; // 50% will have tiles only on the bottom layer

      const shuffledPatternPositions = [...patternPositions].sort(() => Math.random() - 0.5);

      shuffledPatternPositions.forEach((pos, index) => {
        if (index < Math.floor(patternPositions.length * multiLayerRatio)) {
          // These spots get tiles on all layers
          for (let layer = 0; layer < levelConfig.layers; layer++) {
            addUniqueSpot(pos.row, pos.col, layer);
          }
        } else {
          // These spots get tiles only on the bottom layer
          addUniqueSpot(pos.row, pos.col, 0);
        }
      });
    } else {
      // Single layer levels: all tiles on layer 0
      patternPositions.forEach((pos) => {
        addUniqueSpot(pos.row, pos.col, 0);
      });
    }

    // Adjust to match levelConfig.totalTiles
    // This part needs careful handling to ensure uniqueness
    if (finalTileSpots.length > levelConfig.totalTiles) {
      // If too many, remove randomly until target is met
      while (finalTileSpots.length > levelConfig.totalTiles && finalTileSpots.length > 0) {
        const removedSpot = finalTileSpots.pop(); // Remove from end (randomized earlier)
        if (removedSpot) {
          occupiedSpots.delete(`${removedSpot.row},${removedSpot.col},${removedSpot.layer}`);
        }
      }
    } else if (finalTileSpots.length < levelConfig.totalTiles) {
      const needed = levelConfig.totalTiles - finalTileSpots.length;
      let attempts = 0;
      const maxAttempts = needed * 5; // Prevent infinite loop if no more spots
      
      for (let i = 0; i < needed && attempts < maxAttempts; i++) {
        const randomPosIndex = Math.floor(Math.random() * patternPositions.length);
        const randomPos = patternPositions[randomPosIndex];
        if (!addUniqueSpot(randomPos.row, randomPos.col, 0)) {
          i--; // Retry this iteration if spot was already taken
        }
        attempts++;
      }
    }

    // Ensure finalTileSpots count is a multiple of 3 for emoji distribution
    while (finalTileSpots.length % 3 !== 0 && finalTileSpots.length > 0) {
      const removedSpot = finalTileSpots.pop();
      if (removedSpot) {
        occupiedSpots.delete(`${removedSpot.row},${removedSpot.col},${removedSpot.layer}`);
      }
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
    setPeekDisplayTileId(null); // Reset peek display ID
    setPeekUsesLeft(3); // Reset peek uses for new level
    setIsPeekModeActive(false); // Deactivate peek mode on new level
    setBlockingTilesToMove([]); // Reset blocking tiles
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
    
    if (blockedStatusMap.get(tile.id)) return; // Use pre-calculated status
    
    setIsProcessingSlot(true);
    
    const updatedTiles = tiles.filter(tile => tile.id !== id);
    const movedTile = tiles.find(t => t.id === id);
    
    if (movedTile) {
      let newSlotTiles = [...slotTiles, { ...movedTile, isInSlot: true }];
      
      // Sort newSlotTiles by emoji, then by ID for stable order
      newSlotTiles.sort((a, b) => {
        if (a.emoji < b.emoji) return -1;
        if (a.emoji > b.emoji) return 1;
        return a.id - b.id;
      });

      setSlotTiles(newSlotTiles);
      setTiles(updatedTiles);
      
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
            let remainingSlotTiles = newSlotTiles.filter(tile => !tilesToRemove.includes(tile.id));
            // Sort remainingSlotTiles after removal
            remainingSlotTiles.sort((a, b) => {
              if (a.emoji < b.emoji) return -1;
              if (a.emoji > b.emoji) return 1;
              return a.id - b.id;
            });

            setSlotTiles(remainingSlotTiles);
            setTilesToRemove([]);
            setVibratingTiles([]);
            setComboMessage(null);
            setMoves(moves => moves + 1);
            setSlotAnimationKey(prev => prev + 1);
            setIsProcessingSlot(false);

            // After clearing, check if the slot is still full
            if (remainingSlotTiles.length >= currentLevelConfig.slotSize) {
              setGameStatus("lost");
            }
          }, 150);
        }, 300);
      } else {
        // No match found, now check if slot is full
        if (newSlotTiles.length >= currentLevelConfig.slotSize) {
          setGameStatus("lost");
        }
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
  const handleTileClickOnBoard = useCallback((tileId: number) => {
    const clickedTile = tiles.find(t => t.id === tileId);
    if (!clickedTile) return;

    const isBlocked = blockedStatusMap.get(clickedTile.id) || false;

    if (isPeekModeActive) {
      const tilesBelow = getTilesBelow(clickedTile, tiles);
      const deepestTile = tilesBelow.length > 0 ? tilesBelow[tilesBelow.length - 1] : null; // Get the deepest tile

      if (!deepestTile) {
        showError("No tiles hidden below this one!");
        setIsPeekModeActive(false); // Deactivate peek mode without consuming a use
        return;
      }

      // Identify tiles that are blocking the view of the deepest tile
      const tilesToMove = tiles.filter(t =>
        t.position.row === clickedTile.position.row &&
        t.position.col === clickedTile.position.col &&
        !t.isMatched &&
        t.layer > deepestTile.layer && // All tiles strictly above the deepestTile
        t.layer <= clickedTile.layer // Up to and including the clicked tile
      );
      setBlockingTilesToMove(tilesToMove.map(t => t.id));

      setPeekedTileId(deepestTile.id); // ID of the actual deepest tile
      setPeekedTileEmoji(deepestTile.emoji); // Emoji of the actual deepest tile
      setPeekDisplayTileId(clickedTile.id); // ID of the clicked tile to display peeked emoji
      
      setTimeout(() => {
        setPeekedTileId(null);
        setPeekedTileEmoji(null);
        setPeekDisplayTileId(null);
        setBlockingTilesToMove([]); // Clear blocking tiles
      }, 500);
      
      setPeekUsesLeft(prev => {
        const newUsesLeft = prev - 1;
        if (newUsesLeft <= 0) {
          showError("No peeks left!");
        } 
        setIsPeekModeActive(false); // Deactivate peek mode after each use
        return newUsesLeft;
      });
    } else if (!isBlocked) { // If not in peek mode, and not blocked, move to slot
      moveToSlot(tileId);
    }
    // If not in peek mode AND blocked, do nothing.
  }, [isPeekModeActive, moveToSlot, tiles, getTilesBelow, setPeekUsesLeft, blockedStatusMap]);

  const handleActivatePeekMode = useCallback(() => {
    if (currentLevelConfig.layers <= 1) {
      showError("Peek is only available for multi-layer levels!");
      return;
    }
    if (peekUsesLeft <= 0) {
      showError("No peeks left!");
      return;
    }
    if (gameStatus !== "playing" || isChecking || isProcessingSlot) return;
    if (!hasPeekableTiles) { // New check: disable if no peekable tiles
      showError("No tiles available to peek under!"); // Updated error message
      return;
    }

    setIsPeekModeActive(true);
    showSuccess("Peek mode activated! Click any tile with hidden layers below to reveal its deepest hidden tile."); // Updated success message
  }, [peekUsesLeft, gameStatus, isChecking, isProcessingSlot, currentLevelConfig.layers, hasPeekableTiles]);

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

    // Combine tiles from the board and the slot
    const allActiveTiles = [
      ...tiles.filter(t => !t.isMatched), // Tiles still on the board
      ...slotTiles.map(t => ({ ...t, isInSlot: false })) // Tiles in the slot, reset isInSlot
    ];
    
    // Extract emojis and layers for shuffling
    const emojisAndLayers = allActiveTiles.map(t => ({ emoji: t.emoji, layer: t.layer }));
    emojisAndLayers.sort(() => Math.random() - 0.5); // Shuffle emojis and layers

    // Get all possible pattern positions for the current level
    const isFilledPattern = currentLevelConfig.layers > 1;
    const patternPositions = generatePatternPositions(currentLevelConfig.pattern, currentLevelConfig.gridSize, isFilledPattern);
    const availablePositions: { row: number; col: number; layer: number }[] = [];
    for (let layer = 0; layer < currentLevelConfig.layers; layer++) {
      patternPositions.forEach(pos => {
        availablePositions.push({ ...pos, layer });
      });
    }
    availablePositions.sort(() => Math.random() - 0.5); // Shuffle available positions

    // Reassign shuffled emojis, layers, and new positions to the tiles
    const newShuffledTiles = allActiveTiles.map((tile, index) => {
      const newEmojiAndLayer = emojisAndLayers[index % emojisAndLayers.length];
      const newPos = availablePositions[index % availablePositions.length];
      return {
        ...tile,
        emoji: newEmojiAndLayer.emoji,
        layer: newEmojiAndLayer.layer,
        position: { row: newPos.row, col: newPos.col },
        isInSlot: false, // Ensure all are marked as not in slot
      };
    });

    setTiles(newShuffledTiles);
    setSlotTiles([]); // Clear the slot after shuffling
    setMoves(moves => moves + 1);
    setSlotAnimationKey(prev => prev + 1); // Trigger slot animation for clearing
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
    peekedTileEmoji,
    peekDisplayTileId,
    peekUsesLeft,
    isPeekModeActive,
    blockingTilesToMove, // Expose new state
    blockedStatusMap, // Expose new state
    hasPeekableTiles, // Expose new state
    
    getTopTileAtPosition,
    handleThemeChange,
    moveToSlot,
    handleSlotTileClick,
    handleTileClickOnBoard,
    handleActivatePeekMode,
    handleNextLevel,
    handlePrevLevel,
    handleRestartLevel,
    handleLevelSelect,
    handleShuffle,
    setLevelSelectOpen,
    setShowLevelComplete,
  };
};