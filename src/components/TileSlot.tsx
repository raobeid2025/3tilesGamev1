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
  return (
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
  );
};

export default TileSlot;