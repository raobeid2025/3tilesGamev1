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

  // Get the top tile at a specific position
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

  const initializeGame = useCallback((levelId: number = currentLevel, theme: EmojiTheme = selectedTheme) => {
    const levelConfig = levelConfigs.find(level => level.id === levelId) || levelConfigs[0];
    const themeEmojis = [...emojiThemes[theme]].slice(0, levelConfig.emojisNeeded);
    
    const allEmojis: string[] = [];
    themeEmojis.forEach(emoji => {
      for (let i = 0; i < 3; i++) {
        allEmojis.push(emoji);
      }
    });
    
    const shuffledEmojis = [...allEmojis].sort(() => Math.random() - 0.5);
    
    const patternPositions = generatePatternPositions(levelConfig.pattern, levelConfig.gridSize);
    
    // Create a pool of all possible (row, col, layer) spots
    const availableSpots: { row: number; col: number; layer: number }[] = [];
    for (let layer = 0; layer < levelConfig.layers; layer++) {
      patternPositions.forEach((pos) => {
        availableSpots.push({ ...pos, layer });
      });
    }

    // Shuffle the available spots and pick 'totalTiles' number of spots
    const shuffledSpots = availableSpots.sort(() => Math.random() - 0.5);
    const chosenSpots = shuffledSpots.slice(0, levelConfig.totalTiles);

    let newTiles: Tile[] = [];
    chosenSpots.forEach((spot, index) => {
      newTiles.push({
        id: index, // Assign unique ID
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
    
    if (isTileBlocked(tile, tiles)) return;
    
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

    const patternPositions = generatePatternPositions(currentLevelConfig.pattern, currentLevelConfig.gridSize);
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
    
    isTileBlocked,
    getTopTileAtPosition,
    handleThemeChange,
    moveToSlot,
    handleSlotTileClick,
    handleNextLevel,
    handlePrevLevel,
    handleRestartLevel,
    handleLevelSelect,
    handleShuffle,
    setLevelSelectOpen,
    setShowLevelComplete,
  };
};