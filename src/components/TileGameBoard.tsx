"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Tile, LevelConfig } from "@/utils/game-config";

interface TileGameBoardProps {
  tiles: Tile[];
  currentLevelConfig: LevelConfig;
  blockedStatusMap: Map<number, boolean>;
  moveToSlot: (id: number) => void;
  selectedTiles: number[];
  peekedTileId: number | null;
  peekedTileEmoji: string | null;
  peekDisplayTileId: number | null;
  isPeekModeActive: boolean;
  handleTileClickOnBoard: (id: number, isBlocked: boolean) => void;
  availableWidth: number;
  blockingTilesToMove: number[];
}

const TileGameBoard: React.FC<TileGameBoardProps> = React.memo(({
  tiles,
  currentLevelConfig,
  blockedStatusMap,
  selectedTiles,
  peekedTileId,
  peekedTileEmoji,
  peekDisplayTileId,
  isPeekModeActive,
  handleTileClickOnBoard,
  availableWidth,
  blockingTilesToMove,
}) => {
  const sortedTiles = [...tiles].sort((a, b) => a.layer - b.layer);

  const [calculatedTileSize, setCalculatedTileSize] = useState(52);
  const [calculatedTileSpacing, setCalculatedTileSpacing] = useState(4);

  const calculateSizes = useCallback(() => {
    if (availableWidth > 0) {
      const boardHorizontalPaddingAndBorder = (2 * 4) + (2 * 4);
      const effectiveAvailableWidth = availableWidth - boardHorizontalPaddingAndBorder;

      const newTileSpacing = 4;
      const totalSpacingWidth = (currentLevelConfig.gridSize - 1) * newTileSpacing;
      
      let newTileSize = Math.floor((effectiveAvailableWidth - totalSpacingWidth) / currentLevelConfig.gridSize);
      
      const minTileSize = 25;
      const maxTileSize = 60;

      newTileSize = Math.max(newTileSize, minTileSize);
      newTileSize = Math.min(newTileSize, maxTileSize);
      
      setCalculatedTileSize(newTileSize);
      setCalculatedTileSpacing(newTileSpacing);
    }
  }, [availableWidth, currentLevelConfig.gridSize]);

  useEffect(() => {
    calculateSizes();
  }, [calculateSizes]);

  const getEmojiFontSize = (size: number) => {
    if (size >= 50) return "text-3xl";
    if (size >= 40) return "text-2xl";
    if (size >= 30) return "text-xl";
    return "text-lg";
  };

  return (
    <div className="flex justify-center mb-6 w-full">
      <div 
        className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-2 shadow-2xl relative overflow-hidden border-4 border-indigo-200"
      >
        <div
          className="relative"
          style={{
            width: `${currentLevelConfig.gridSize * calculatedTileSize + (currentLevelConfig.gridSize - 1) * calculatedTileSpacing}px`,
            height: `${currentLevelConfig.gridSize * calculatedTileSize + (currentLevelConfig.gridSize - 1) * calculatedTileSpacing}px`,
          }}
        >
          {sortedTiles.map((tile) => {
            const blocked = blockedStatusMap.get(tile.id) || false;
            const isDisplayingPeek = peekDisplayTileId === tile.id;
            const isThisThePeekedTile = peekedTileId === tile.id;
            const isBlockingTileToMove = blockingTilesToMove.includes(tile.id);
            
            let tileZIndex = tile.layer;
            if (isThisThePeekedTile) {
              tileZIndex = 100;
            } else if (isDisplayingPeek) {
              tileZIndex = 90;
            } else if (isBlockingTileToMove) {
              tileZIndex = 80;
            }

            return (
              <motion.div
                key={`tile-container-${tile.id}`}
                layoutId={`tile-${tile.id}`}
                className="absolute"
                layout
                initial={{ y: -50, opacity: 0, scale: 0.8 }} // Staggered entry animation
                animate={{
                  y: 0,
                  opacity: blocked ? 0.6 : 1, // Final opacity based on blocked status
                  scale: 1,
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  rotate: tile.isMatched ? 360 : 0,
                  transition: { duration: 0.1 }
                }}
                transition={{
                  type: "spring",
                  stiffness: 900,
                  damping: 45,
                  delay: tile.layer * 0.05 // Staggered delay based on layer
                }}
                style={{
                  left: `${tile.position.col * (calculatedTileSize + calculatedTileSpacing)}px`,
                  top: `${tile.position.row * (calculatedTileSize + calculatedTileSpacing)}px`,
                  zIndex: tileZIndex,
                }}
              >
                <motion.div
                  key={`actual-tile-${tile.id}`}
                  className={`
                    relative cursor-pointer transform
                    ${(blocked && !isDisplayingPeek && !isThisThePeekedTile) ? "cursor-not-allowed" : ""}
                  `}
                  onClick={() => handleTileClickOnBoard(tile.id, blocked)}
                  style={{
                    width: `${calculatedTileSize}px`,
                    height: `${calculatedTileSize}px`,
                    zIndex: isDisplayingPeek ? 2 : (isThisThePeekedTile ? 1.5 : 1),
                  }}
                  animate={
                    isThisThePeekedTile
                      ? { y: 0, x: 0, scale: 1.1 }
                      : isDisplayingPeek
                        ? { y: -15, scale: 1 }
                        : isBlockingTileToMove
                          ? { y: -10, x: tile.id % 2 === 0 ? -10 : 10, scale: 0.9 }
                          : selectedTiles.includes(tile.id)
                            ? { scale: 0.95 }
                            : { y: 0, x: 0, scale: 1 }
                  }
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <div className={`
                    absolute w-full h-full flex items-center justify-center rounded-lg ${getEmojiFontSize(calculatedTileSize)} font-bold
                    border-2 transition-all duration-200
                    ${(blocked && !isThisThePeekedTile)
                      ? "border-gray-500 bg-gray-400"
                      : tile.layer === 0
                        ? "border-indigo-500 bg-white"
                        : tile.layer === 1
                          ? "border-purple-600 bg-purple-200"
                          : "border-pink-700 bg-pink-300"}
                    ${isThisThePeekedTile ? "border-yellow-500 ring-4 ring-yellow-300" : ""}
                  `}
                  >
                    <span className="relative z-10">
                      {isThisThePeekedTile && peekedTileEmoji ? peekedTileEmoji : tile.emoji}
                    </span>
                  </div>

                  {tile.isMatched && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-60 flex items-center justify-center rounded-lg">
                      <Check className="text-white" size={24} />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default TileGameBoard;