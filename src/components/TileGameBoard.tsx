"use client";

import React from 'react';
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

  const tileSize = 52; // Base size of a tile
  const tileSpacing = 4; // Gap between tiles (approx 0.5rem)
  const effectiveTileSize = tileSize + tileSpacing; // Total space a tile occupies

  return (
    <div className="flex justify-center mb-6">
      <div 
        className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-2 shadow-2xl relative overflow-hidden border-4 border-indigo-200"
        style={{ perspective: '1000px' }} // Added perspective to the board
      >
        <div
          className="relative"
          style={{
            width: `${currentLevelConfig.gridSize * effectiveTileSize}px`,
            height: `${currentLevelConfig.gridSize * effectiveTileSize}px`,
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
                  isThisThePeekedTile || isDisplayingPeek // If it's the peeked tile OR the tile moving for peek
                    ? { scale: 1, opacity: 1 } // It should be fully opaque
                    : blocked
                      ? { scale: 1, opacity: 0.6 } // If blocked and not involved in peek, 60% opacity
                      : { scale: 1, opacity: 1 } // Otherwise (unblocked), fully opaque
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
                  left: `${tile.position.col * effectiveTileSize + tileSpacing / 2}px`,
                  top: `${tile.position.row * effectiveTileSize + tileSpacing / 2}px`,
                  transform: `translateZ(${tile.layer * 15}px)`,
                  zIndex: isDisplayingPeek ? 2 : (isThisThePeekedTile ? 1.5 : tile.layer), // Ensure peeked tile is visible
                }}
              >
                {/* The actual tile that moves */}
                <motion.div
                  key={`actual-tile-${tile.id}`}
                  className={`
                    relative w-12 h-12 cursor-pointer transform transition-all duration-200
                    ${(blocked && !isDisplayingPeek && !isThisThePeekedTile) ? "cursor-not-allowed" : ""}
                  `}
                  onClick={() => handleTileClickOnBoard(tile.id, blocked)}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center center -2px", // Set transform origin for 3D rotation (assuming 4px depth)
                    zIndex: isDisplayingPeek ? 2 : (isThisThePeekedTile ? 1.5 : 1), // Keep zIndex high for the lifting tile
                    // Removed redundant translateZ here, it's handled by parent container
                  }}
                  // Animation for lifting the tile and handling selection scale (opacity handled by parent)
                  animate={isDisplayingPeek 
                    ? { y: -30, x: 15, rotate: 8, scale: 1 } // Only position/rotation/scale for moving tile
                    : selectedTiles.includes(tile.id) 
                      ? { scale: 0.95 } // Only scale for selected tiles
                      : { scale: 1 }} // Default scale
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileHover={!blocked && !isDisplayingPeek 
                    ? { scale: 1.08, y: -5, rotateX: 5, rotateY: 5, zIndex: 100 } // Added rotateX/Y for 3D tilt
                    : {}}
                >
                  {/* Front Face (Emoji) */}
                  <div className={`
                    absolute w-full h-full flex items-center justify-center rounded-lg text-2xl font-bold
                    border-2 transition-all duration-200
                    ${(blocked && !isThisThePeekedTile) // Apply blocked styling only if not the peeked tile
                      ? "border-gray-500 bg-gray-400"
                      : tile.layer === 0
                        ? "border-indigo-500 bg-white"
                        : tile.layer === 1
                          ? "border-purple-600 bg-purple-200"
                          : "border-pink-700 bg-pink-300"}
                    ${isThisThePeekedTile ? "border-yellow-500 ring-4 ring-yellow-300" : ""} // Highlight peeked tile
                  `}
                    style={{
                      transform: "translateZ(2px)", // Adjusted translateZ for 4px depth
                      boxShadow: "0 6px 12px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.4)", // Enhanced shadow
                      background: (blocked && !isThisThePeekedTile) // Apply blocked background only if not the peeked tile
                        ? "linear-gradient(145deg, #cccccc, #aaaaaa)"
                        : tile.layer === 0
                          ? "linear-gradient(145deg, #ffffff, #e0e0e0)"
                          : tile.layer === 1
                            ? "linear-gradient(145deg, #e8dcfc, #c7b8f5)"
                            : "linear-gradient(145deg, #fcdde9, #f5b8d1)"
                    }}
                  >
                    <span className="relative z-10">
                      {isThisThePeekedTile && peekedTileEmoji ? peekedTileEmoji : tile.emoji}
                    </span>
                  </div>

                  {/* Top Face */}
                  <div className={`
                    absolute w-full h-2 rounded-t-lg
                    ${(blocked && !isThisThePeekedTile)
                      ? "bg-gray-500"
                      : selectedTiles.includes(tile.id)
                        ? "bg-yellow-400"
                        : tile.layer === 0
                          ? "bg-indigo-400"
                          : tile.layer === 1
                            ? "bg-purple-500"
                            : "bg-pink-600"}
                    ${isThisThePeekedTile ? "bg-yellow-500" : ""}
                  `}
                    style={{
                      transform: "rotateX(90deg) translateY(-24px) translateZ(2px)", // Adjusted for 4px depth (48px tile height / 2 = 24px)
                      boxShadow: "0 -3px 6px rgba(0,0,0,0.15)" // Enhanced shadow
                    }}
                  ></div>

                  {/* Right Face */}
                  <div className={`
                    absolute h-full w-2 rounded-r-lg
                    ${(blocked && !isThisThePeekedTile)
                      ? "bg-gray-600"
                      : selectedTiles.includes(tile.id)
                        ? "bg-yellow-600"
                        : tile.layer === 0
                          ? "bg-indigo-600"
                          : tile.layer === 1
                            ? "bg-purple-700"
                            : "bg-pink-800"}
                    ${isThisThePeekedTile ? "bg-yellow-600" : ""}
                  `}
                    style={{
                      transform: "rotateY(90deg) translateX(24px) translateZ(2px)", // Adjusted for 4px depth (48px tile width / 2 = 24px)
                      boxShadow: "3px 0 6px rgba(0,0,0,0.15)" // Enhanced shadow
                    }}
                  ></div>

                  {tile.isMatched && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-60 flex items-center justify-center rounded-lg"
                      style={{ transform: "translateZ(15px)" }}>
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