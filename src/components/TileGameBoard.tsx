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
}) => {
  // Sort tiles by layer to ensure correct z-index rendering (lower layers first)
  const sortedTiles = [...tiles].sort((a, b) => a.layer - b.layer);

  const boardRef = useRef<HTMLDivElement>(null);
  const [calculatedTileSize, setCalculatedTileSize] = useState(52); // Default desktop size
  const [calculatedTileSpacing, setCalculatedTileSpacing] = useState(4); // Default spacing

  const calculateSizes = useCallback(() => {
    if (boardRef.current) {
      const containerWidth = boardRef.current.offsetWidth;
      // Max board width for larger screens, otherwise use container width
      const maxBoardWidth = Math.min(containerWidth, 600); 
      
      const newTileSpacing = 4; // Keep spacing consistent
      const availableWidthForTiles = maxBoardWidth - (currentLevelConfig.gridSize - 1) * newTileSpacing;
      let newTileSize = Math.floor(availableWidthForTiles / currentLevelConfig.gridSize);
      
      // Ensure a minimum tile size for usability
      newTileSize = Math.max(newTileSize, 30); 
      
      setCalculatedTileSize(newTileSize);
      setCalculatedTileSpacing(newTileSpacing);
    }
  }, [currentLevelConfig.gridSize]);

  useEffect(() => {
    calculateSizes(); // Initial calculation

    const resizeObserver = new ResizeObserver(calculateSizes);
    if (boardRef.current) {
      resizeObserver.observe(boardRef.current);
    }

    return () => {
      if (boardRef.current) {
        resizeObserver.unobserve(boardRef.current);
      }
    };
  }, [calculateSizes]);

  const effectiveTileSize = calculatedTileSize + calculatedTileSpacing;
  const dynamicTileDepth = Math.max(4, Math.floor(calculatedTileSize / 8)); // Minimum 4px depth, scales with tile size

  const getEmojiFontSize = (size: number) => {
    if (size >= 50) return "text-3xl"; // 30px
    if (size >= 40) return "text-2xl"; // 24px
    if (size >= 30) return "text-xl";  // 20px
    return "text-lg"; // 18px
  };

  return (
    <div className="flex justify-center mb-6 w-full px-2 sm:px-4"> {/* Added w-full and padding for responsiveness */}
      <div 
        ref={boardRef} // Attach ref here
        className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-2 shadow-2xl relative overflow-hidden border-4 border-indigo-200"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative"
          style={{
            width: `${currentLevelConfig.gridSize * effectiveTileSize - calculatedTileSpacing}px`, // Adjust total width
            height: `${currentLevelConfig.gridSize * effectiveTileSize - calculatedTileSpacing}px`, // Adjust total height
          }}
        >
          {sortedTiles.map((tile) => {
            const blocked = isTileBlocked(tile, tiles);
            const isDisplayingPeek = peekDisplayTileId === tile.id;
            const isThisThePeekedTile = peekedTileId === tile.id;
            
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
                  left: `${tile.position.col * effectiveTileSize}px`,
                  top: `${tile.position.row * effectiveTileSize}px`,
                  transform: `translateZ(${tile.layer * 15}px)`,
                  zIndex: isDisplayingPeek ? 2 : (isThisThePeekedTile ? 1.5 : tile.layer),
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
                    transformStyle: "preserve-3d",
                    transformOrigin: `center center -${dynamicTileDepth / 2}px`, // Set transform origin for 3D rotation
                    zIndex: isDisplayingPeek ? 2 : (isThisThePeekedTile ? 1.5 : 1),
                  }}
                  animate={isDisplayingPeek 
                    ? { y: -30, x: 15, rotate: 8, scale: 1 }
                    : selectedTiles.includes(tile.id) 
                      ? { scale: 0.95 }
                      : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileHover={!blocked && !isDisplayingPeek 
                    ? { 
                        scale: 1.08, 
                        y: -5, 
                        rotateX: 5, 
                        rotateY: 5, 
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
                    style={{
                      transform: `translateZ(${dynamicTileDepth / 2}px)`,
                      background: (blocked && !isThisThePeekedTile)
                        ? "#a0a0a0"
                        : tile.layer === 0
                          ? "#ffffff"
                          : tile.layer === 1
                            ? "#e8dcfc"
                            : "#fcdde9"
                    }}
                  >
                    <span className="relative z-10">
                      {isThisThePeekedTile && peekedTileEmoji ? peekedTileEmoji : tile.emoji}
                    </span>
                  </div>

                  {/* Top Face */}
                  <div className={`
                    absolute w-full rounded-t-lg
                    ${(blocked && !isThisThePeekedTile)
                      ? "bg-gray-500"
                      : selectedTiles.includes(tile.id)
                        ? "bg-yellow-400"
                        : tile.layer === 0
                          ? "bg-indigo-400"
                          : "bg-purple-500"}
                    ${isThisThePeekedTile ? "bg-yellow-500" : ""}
                  `}
                    style={{
                      height: `${dynamicTileDepth}px`,
                      transform: `rotateX(90deg) translateY(${calculatedTileSize / -2 + dynamicTileDepth / 2}px) translateZ(${dynamicTileDepth / 2}px)`,
                    }}
                  ></div>

                  {/* Right Face */}
                  <div className={`
                    absolute h-full rounded-r-lg
                    ${(blocked && !isThisThePeekedTile)
                      ? "bg-gray-600"
                      : selectedTiles.includes(tile.id)
                        ? "bg-yellow-600"
                        : tile.layer === 0
                          ? "bg-indigo-600"
                          : "bg-purple-700"}
                    ${isThisThePeekedTile ? "bg-yellow-600" : ""}
                  `}
                    style={{
                      width: `${dynamicTileDepth}px`,
                      transform: `rotateY(90deg) translateX(${calculatedTileSize / 2 - dynamicTileDepth / 2}px) translateZ(${dynamicTileDepth / 2}px)`,
                    }}
                  ></div>

                  {tile.isMatched && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-60 flex items-center justify-center rounded-lg"
                      style={{ transform: `translateZ(${dynamicTileDepth + 5}px)` }}> {/* Ensure checkmark is above faces */}
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