"use client";

import React from 'react';
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
  // Removed dynamic size calculation logic (calculateSlotTileSizes, slotRef, states, useEffect)

  const fixedTileSize = 64; // Fixed size for tiles in the slot
  const fixedGap = 8; // Fixed gap between tiles in the slot
  const fixedEmojiFontSize = "text-3xl"; // Fixed font size for emojis

  return (
    <div className="mb-4">
      {/* Removed the div containing the tile count */}
      <div className="rounded-xl p-2 border-2 border-dashed bg-indigo-100 border-indigo-300 h-[80px] overflow-x-auto overflow-y-hidden"> {/* Changed min-h-[100px] max-h-[150px] to h-[80px] */}
        <AnimatePresence mode="popLayout">
          {slotTiles.length > 0 ? (
            <motion.div 
              key={slotAnimationKey}
              className="flex flex-nowrap h-full items-center" // Added items-center to vertically align tiles
              style={{ gap: `${fixedGap}px` }} // Using fixed gap
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
                        ${fixedEmojiFontSize}
                        ${selectedTiles.includes(tile.id) 
                          ? "border-yellow-400 bg-yellow-50 scale-90" 
                          : "border-indigo-300"}
                        transition-all duration-100 transform hover:scale-105
                      `}
                      style={{
                        width: `${fixedTileSize}px`,
                        height: `${fixedTileSize}px`,
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