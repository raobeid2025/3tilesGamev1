"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Tile, LevelConfig, GameStatus } from "@/utils/game-config";

interface TileSlotProps {
  slotTiles: Tile[];
  tilesToRemove: number[];
  vibratingTiles: number[];
  slotAnimationKey: number;
  currentLevelConfig: LevelConfig;
  handleSlotTileClick: (id: number) => void;
  isChecking: boolean;
  gameStatus: GameStatus;
  isProcessingSlot: boolean;
  selectedTiles: number[];
  availableWidth: number;
}

// Define the functional component first
const TileSlotComponent: React.FC<TileSlotProps> = ({
  slotTiles,
  tilesToRemove,
  vibratingTiles,
  slotAnimationKey,
  currentLevelConfig,
  handleSlotTileClick,
  isChecking,
  gameStatus,
  isProcessingSlot,
  selectedTiles,
  availableWidth,
}) => {
  const [calculatedSlotTileSize, setCalculatedSlotTileSize] = useState(56);
  const [calculatedSlotTileGap, setCalculatedSlotTileGap] = useState(8);

  const getEmojiFontSize = (size: number) => {
    if (size >= 50) return "text-3xl";
    if (size >= 40) return "text-2xl";
    if (size >= 30) return "text-xl";
    return "text-lg";
  };

  const calculateSlotTileSizes = useCallback(() => {
    if (availableWidth > 0) {
      const slotPadding = 8 * 2;
      const effectiveWidth = availableWidth - slotPadding;
      const numTilesInSlot = currentLevelConfig.slotSize;

      const maxTileSize = 64;
      const minTileSize = 30;

      const targetGap = 4;

      let potentialTileSize = (effectiveWidth - (numTilesInSlot - 1) * targetGap) / numTilesInSlot;

      let newTileSize = Math.floor(potentialTileSize);
      let newTileGap = targetGap;

      if (newTileSize > maxTileSize) {
        newTileSize = maxTileSize;
        newTileGap = Math.floor((effectiveWidth - numTilesInSlot * newTileSize) / (numTilesInSlot - 1));
        newTileGap = Math.max(0, newTileGap);
      } else if (newTileSize < minTileSize) {
        newTileSize = minTileSize;
      }
      
      setCalculatedSlotTileSize(newTileSize);
      setCalculatedSlotTileGap(newTileGap);
    }
  }, [availableWidth, currentLevelConfig.slotSize]);

  useEffect(() => {
    calculateSlotTileSizes();
  }, [calculateSlotTileSizes]);

  return (
    <div className="mb-4 w-full">
      <div className="rounded-xl p-2 border-2 border-dashed bg-indigo-100 border-indigo-300 h-[80px] overflow-x-auto overflow-y-hidden">
        <AnimatePresence mode="popLayout">
          {slotTiles.length > 0 ? (
            <motion.div 
              key={slotAnimationKey}
              className="flex flex-nowrap h-full items-center"
              style={{ gap: `${calculatedSlotTileGap}px` }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
            >
              {slotTiles.map((tile) => (
                <motion.div
                  key={`slot-${tile.id}`}
                  layoutId={`tile-${tile.id}`}
                  className="relative flex-shrink-0"
                  layout
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    y: 0, 
                    rotate: 0,
                    transition: { 
                      delay: 0.1, 
                      type: "spring", 
                      stiffness: 800, 
                      damping: 25, 
                      mass: 1 
                    }
                  }}
                  exit={tilesToRemove.includes(tile.id) ? {
                    scale: [1, 1.2, 0],
                    opacity: [1, 0.8, 0],
                    rotate: [0, 15, -15, 0],
                    y: [0, -10, -30],
                    transition: { duration: 0.3, ease: "easeOut" }
                  } : {
                    scale: 0,
                    opacity: 0,
                    transition: { duration: 0.1 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 800,
                    damping: 25,
                    mass: 1,
                    layout: { 
                      type: "spring",
                      stiffness: 400, 
                      damping: 30 
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
                        relative flex items-center justify-center bg-white border-2 rounded-lg shadow-lg z-10
                        ${getEmojiFontSize(calculatedSlotTileSize)}
                        ${selectedTiles.includes(tile.id) 
                          ? "border-yellow-400 bg-yellow-50 scale-90" 
                          : "border-indigo-300"}
                        transition-all duration-100 transform hover:scale-105
                      `}
                      style={{
                        width: `${calculatedSlotTileSize}px`,
                        height: `${calculatedSlotTileSize}px`,
                      }}
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
              {/* Removed the sentence here */}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Wrap the component with React.memo
const TileSlot = React.memo(TileSlotComponent);

export default TileSlot;