"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Tile, LevelConfig } from "@/utils/game-config";

interface TileGameBoardProps {
  tiles: Tile[];
  currentLevelConfig: LevelConfig;
  isTileBlocked: (tile: Tile, allTiles: Tile[]) => boolean;
  moveToSlot: (id: number) => void;
  selectedTiles: number[];
  peekedTileId: number | null;
  peekedTileEmoji: string | null;
  peekDisplayTileId: number | null;
  isPeekModeActive: boolean;
  handleTileClickOnBoard: (id: number, isBlocked: boolean) => void;
  availableWidth: number; // New prop for the parent's width
  blockingTilesToMove: number[]; // New prop for tiles to move during peek
}

const TileGameBoard: React.FC<TileGameBoardProps> = ({
  tiles,
  currentLevelConfig,
  isTileBlocked,
  selectedTiles,
  peekedTileId,
  peekedTileEmoji,
  peekDisplayTileId,
  isPeekModeActive,
  handleTileClickOnBoard,
  availableWidth, // Destructure new prop
  blockingTilesToMove, // Destructure new prop
}) => {
  // Sort tiles by layer to ensure correct z-index rendering (lower layers first)
  const sortedTiles = [...tiles].sort((a, b) => a.layer - b.layer);

  const [calculatedTileSize, setCalculatedTileSize] = useState(52); // Default desktop size
  const [calculatedTileSpacing, setCalculatedTileSpacing] = useState(4); // Default spacing

  const calculateSizes = useCallback(() => {
    if (availableWidth > 0) {
      // The board container itself has p-2 (8px total padding) and border-4 (8px total border)
      // These are applied to the inner div, so they reduce the space available for the grid.
      const boardHorizontalPaddingAndBorder = (2 * 4) + (2 * 4); // p-2 is 4px each side, border-4 is 4px each side
      const effectiveAvailableWidth = availableWidth - boardHorizontalPaddingAndBorder;

      const newTileSpacing = 4; // Keep spacing consistent
      const totalSpacingWidth = (currentLevelConfig.gridSize - 1) * newTileSpacing;
      
      let newTileSize = Math.floor((effectiveAvailableWidth - totalSpacingWidth) / currentLevelConfig.gridSize);
      
      // Ensure a minimum tile size for usability, allowing it to shrink more if necessary
      newTileSize = Math.max(newTileSize, 25); // Allow shrinking down to 25px if necessary
      
      setCalculatedTileSize(newTileSize);
      setCalculatedTileSpacing(newTileSpacing);
    }
  }, [availableWidth, currentLevelConfig.gridSize]);

  useEffect(() => {
    calculateSizes(); // Recalculate when availableWidth or gridSize changes
  }, [calculateSizes]);

  const getEmojiFontSize = (size: number) => {
    if (size >= 50) return "text-3xl"; // 30px
    if (size >= 40) return "text-2xl"; // 24px
    if (size >= 30) return "text-xl";  // 20px
    return "text-lg"; // 18px
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
            const blocked = isTileBlocked(tile, tiles);
            const isDisplayingPeek = peekDisplayTileId === tile.id;
            const isThisThePeekedTile = peekedTileId === tile.id;
            const isBlockingTileToMove = blockingTilesToMove.includes(tile.id);
            
            let tileZIndex = tile.layer;
            if (isThisThePeekedTile) {
              tileZIndex = 100; // Highest z-index for the actual peeked tile
            } else if (isDisplayingPeek) {
              tileZIndex = 90; // Z-index for the clicked tile that moves up
            } else if (isBlockingTileToMove) {
              tileZIndex = 80; // Z-index for other blocking tiles that move aside
            }

            return (
              <motion.div
                key={`tile-container-${tile.id}`}
                className="absolute"
                layout
                initial={!blocked ? { scale: 0.8, opacity: 0 } : {}}
                animate={
                  isThisThePeekedTile || isDisplayingPeek
                    ? { scale: 1, opacity: 1 }
                    : blocked
                      ? { scale: 1, opacity: 0.6 }
                      : { scale: 1, opacity: 1 }
                }
                exit={{
                  scale: 0,
                  opacity: 0,
                  rotate: tile.isMatched ? 360 : 0,
                  transition: { duration: 0.1 }
                }}
                transition={!blocked ? {
                  type: "spring",
                  stiffness: 900,
                  damping: 45
                } : { duration: 0 }}
                style={{
                  left: `${tile.position.col * (calculatedTileSize + calculatedTileSpacing)}px`,
                  top: `${tile.position.row * (calculatedTileSize + calculatedTileSpacing)}px`,
                  zIndex: tileZIndex, // Use calculated z-index
                }}
              >
                {/* The actual tile that moves */}
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
                      ? { y: 0, x: 0, scale: 1.1 } // Peeked tile might slightly scale up
                      : isDisplayingPeek // The clicked tile, moves up
                        ? { y: -30, scale: 1 }
                        : isBlockingTileToMove // Other blocking tiles, move slightly up and side
                          ? { y: -15, x: tile.id % 2 === 0 ? -15 : 15, scale: 0.9 } // Alternate left/right
                          : selectedTiles.includes(tile.id)
                            ? { scale: 0.95 }
                            : { scale: 1 }
                  }
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileHover={!blocked && !isDisplayingPeek && !isBlockingTileToMove
                    ? { 
                        scale: 1.08, 
                        y: -5, 
                        zIndex: 100, 
                        transition: { type: "tween", duration: 0.08, ease: "easeOut" }
                      } 
                    : {}}
                >
                  {/* Front Face (Emoji) */}
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
};

export default TileGameBoard;