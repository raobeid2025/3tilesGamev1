"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
}

const TileSlot: React.FC<TileSlotProps> = ({
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
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const [calculatedSlotTileSize, setCalculatedSlotTileSize] = useState(64); // Default for sm:w-16
  const [slotEmojiFontSize, setSlotEmojiFontSize] = useState("text-3xl");
  const [calculatedGap, setCalculatedGap] = useState(12); // Default gap-3

  const calculateSlotTileSizes = useCallback(() => {
    if (slotRef.current) {
      const containerWidth = slotRef.current.offsetWidth;
      const maxTilesInRow = currentLevelConfig.slotSize; 
      const minTileSize = 25; // Minimum size for slot tiles on very small screens (reduced from 30)
      const maxTileSize = 64; // Max size for slot tiles (sm:w-16)
      const baseGap = 12; // gap-3 is 12px

      // Adjust gap based on screen size, smaller gap for smaller screens
      const newGap = containerWidth < 400 ? 8 : baseGap; // Use 8px gap for screens < 400px
      setCalculatedGap(newGap);

      // Calculate how many tiles can fit in a row
      let tilesPerRow = Math.floor((containerWidth + newGap) / (minTileSize + newGap));
      tilesPerRow = Math.max(1, Math.min(tilesPerRow, maxTilesInRow)); // Ensure at least 1 tile, max slotSize

      let newSize = (containerWidth - (tilesPerRow - 1) * newGap) / tilesPerRow;
      newSize = Math.max(minTileSize, Math.min(newSize, maxTileSize)); // Clamp between min and max

      setCalculatedSlotTileSize(newSize);

      if (newSize >= 60) setSlotEmojiFontSize("text-3xl");
      else if (newSize >= 48) setSlotEmojiFontSize("text-2xl");
      else if (newSize >= 40) setSlotEmojiFontSize("text-xl");
      else setSlotEmojiFontSize("text-lg");
    }
  }, [currentLevelConfig.slotSize]);

  useEffect(() => {
    calculateSlotTileSizes();
    const resizeObserver = new ResizeObserver(calculateSlotTileSizes);
    if (slotRef.current) {
      resizeObserver.observe(slotRef.current);
    }
    return () => {
      if (slotRef.current) {
        resizeObserver.unobserve(slotRef.current);
      }
    };
  }, [calculateSlotTileSizes]);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-indigo-700">Tile Slot</h2>
        <span className={`text-sm ${slotTiles.length >= currentLevelConfig.slotSize - 2 ? "text-red-500 font-bold" : "text-gray-500"}`}>
          {slotTiles.length}/{currentLevelConfig.slotSize} tiles
        </span>
      </div>
      <div className="rounded-xl p-4 border-2 border-dashed bg-indigo-100 border-indigo-300"
           style={{ height: '120px' }}>
        <AnimatePresence mode="popLayout">
          {slotTiles.length > 0 ? (
            <motion.div 
              key={slotAnimationKey}
              className="flex flex-wrap h-full overflow-y-auto" // Removed gap-3 here, using dynamic gap
              style={{ gap: `${calculatedGap}px` }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              ref={slotRef}
            >
              {slotTiles.map((tile) => (
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
                    transition: { duration: 0.1 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 800,
                    damping: 40,
                    layout: {
                      type: "spring",
                      stiffness: 800,
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
                        relative flex items-center justify-center bg-white border-2 rounded-lg shadow-lg z-10
                        ${slotEmojiFontSize}
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
              <p>Click tiles to move them here. 3+ same tiles are automatically removed!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TileSlot;