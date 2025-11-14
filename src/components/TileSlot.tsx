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

const TileSlot: React.FC<TileSlotProps> = React.memo(({
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
  const [calculatedSlotTileSize, setCalculatedSlotTileSize] = useState(52);
  const [slotEmojiFontSize, setSlotEmojiFontSize] = useState("text-3xl");
  const [calculatedGap, setCalculatedGap] = useState(12);

  const calculateSlotTileSizes = useCallback(() => {
    if (slotRef.current) {
      const containerWidth = slotRef.current.offsetWidth;
      const maxTilesInSlot = currentLevelConfig.slotSize;
      
      const maxTileSize = 52;
      const minTileSizeBeforeScroll = 25;
      const baseGap = 12;

      const newGap = containerWidth < 400 ? 8 : baseGap;
      setCalculatedGap(newGap);

      let sizeIfAllFit = (containerWidth - (maxTilesInSlot - 1) * newGap) / maxTilesInSlot;
      
      let finalTileSize;

      if (sizeIfAllFit > maxTileSize) {
        finalTileSize = maxTileSize;
      } else if (sizeIfAllFit < minTileSizeBeforeScroll) {
        finalTileSize = minTileSizeBeforeScroll;
      } else {
        finalTileSize = sizeIfAllFit;
      }

      setCalculatedSlotTileSize(finalTileSize);

      if (finalTileSize >= 50) setSlotEmojiFontSize("text-3xl");
      else if (finalTileSize >= 40) setSlotEmojiFontSize("text-2xl");
      else if (finalTileSize >= 30) setSlotEmojiFontSize("text-xl");
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
    <div className="mb-4"> {/* Reduced mb-6 to mb-4 */}
      <div className="flex justify-end items-center mb-1"> {/* Removed h2, adjusted mb-2 to mb-1 */}
        <span className={`text-sm ${slotTiles.length >= currentLevelConfig.slotSize - 2 ? "text-red-500 font-bold" : "text-gray-500"}`}>
          {slotTiles.length}/{currentLevelConfig.slotSize} tiles
        </span>
      </div>
      <div className="rounded-xl p-2 border-2 border-dashed bg-indigo-100 border-indigo-300 min-h-[100px] max-h-[150px] overflow-x-auto overflow-y-hidden"> {/* Reduced p-4 to p-2 */}
        <AnimatePresence mode="popLayout">
          {slotTiles.length > 0 ? (
            <motion.div 
              key={slotAnimationKey}
              className="flex flex-nowrap h-full"
              style={{ gap: `${calculatedGap}px` }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              ref={slotRef}
            >
              {slotTiles.map((tile) => (
                <motion.div
                  key={`slot-${tile.id}`}
                  layoutId={`tile-${tile.id}`}
                  className="relative flex-shrink-0"
                  layout
                  // Removed initial prop to allow framer-motion to animate from the board's position
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    y: 0, 
                    rotate: 0,
                    transition: { // Add a slight delay to the settling animation after layout transition
                      delay: 0.1, 
                      type: "spring", 
                      stiffness: 800, 
                      damping: 25, 
                      mass: 1 
                    }
                  }}
                  exit={{ 
                    scale: 0, 
                    opacity: 0,
                    rotate: tilesToRemove.includes(tile.id) ? 180 : 0,
                    transition: { duration: 0.1 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 800,
                    damping: 25,
                    mass: 1,
                    layout: { // Make layout transition faster
                      type: "spring",
                      stiffness: 400, // Reduced stiffness for faster layout animation
                      damping: 30 // Reduced damping for faster layout animation
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
});

export default TileSlot;