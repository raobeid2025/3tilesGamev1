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
  // peekedTileId: number | null; // No longer directly used for rendering here
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
  // peekedTileId, // No longer directly used for rendering here
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
      <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-2 shadow-2xl relative overflow-hidden border-4 border-indigo-200">
        <div
          className="relative"
          style={{
            width: `${currentLevelConfig.gridSize * effectiveTileSize}px`,
            height: `${currentLevelConfig.gridSize * effectiveTileSize}px`,
          }}
        >
          {sortedTiles.map((tile) => {
            const blocked = isTileBlocked(tile, tiles);
            const isDisplayingPeek = peekDisplayTileId === tile.id; // This is the clicked tile that should show the peeked emoji
            
            return (
              <motion.div
                key={`tile-container-${tile.id}`} // Unique key for the container
                className="absolute"
                layout
                initial={!blocked ? { scale: 0.8, opacity: 0 } : {}}
                animate={!blocked ? { scale: 1, opacity: 1 } : {}}
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
                  zIndex: tile.layer, // Base zIndex for the container
                }}
              >
                {/* Placeholder for the peeked emoji, appears in the original spot */}
                <AnimatePresence>
                  {isDisplayingPeek && peekedTileEmoji && (
                    <motion.div
                      key={`peek-placeholder-${tile.id}`}
                      className="absolute w-12 h-12 flex items-center justify-center rounded-lg text-2xl font-bold bg-yellow-100 border-2 border-yellow-500 shadow-lg"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      style={{ zIndex: 1 }} // Relative to its parent (the container motion.div)
                    >
                      {peekedTileEmoji}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* The actual tile that moves */}
                <motion.div
                  key={`actual-tile-${tile.id}`} // Unique key for the moving tile
                  className={`
                    relative w-12 h-12 cursor-pointer transform transition-all duration-200
                    ${blocked ? "opacity-60 cursor-not-allowed" : ""}
                    ${selectedTiles.includes(tile.id) ? "scale-95" : ""}
                  `}
                  onClick={() => handleTileClickOnBoard(tile.id, blocked)}
                  style={{
                    transformStyle: "preserve-3d",
                    // Ensure the moving tile is always on top of the placeholder
                    zIndex: isDisplayingPeek ? 2 : 1, // 2 for moving tile, 1 for placeholder
                  }}
                  // Animation for lifting the tile
                  animate={isDisplayingPeek ? { y: -20, x: 10, rotate: 5 } : { y: 0, x: 0, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileHover={!blocked && !isDisplayingPeek ? { scale: 1.08, y: -5, zIndex: 100 } : {}} // Only hover if not blocked and not peeking
                >
                  <div className={`
                    absolute w-full h-full flex items-center justify-center rounded-lg text-2xl font-bold
                    border-2 transition-all duration-200
                    ${blocked
                      ? "border-gray-500 bg-gray-400"
                      : selectedTiles.includes(tile.id)
                        ? "border-yellow-500 bg-yellow-200"
                        : tile.layer === 0
                          ? "border-indigo-500 bg-white"
                          : tile.layer === 1
                            ? "border-purple-600 bg-purple-200"
                            : "border-pink-700 bg-pink-300"}
                  `}
                    style={{
                      transform: "translateZ(10px)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
                      background: blocked
                        ? "linear-gradient(145deg, #cccccc, #aaaaaa)"
                        : tile.layer === 0
                          ? "linear-gradient(145deg, #ffffff, #e0e0e0)"
                          : tile.layer === 1
                            ? "linear-gradient(145deg, #e8dcfc, #c7b8f5)"
                            : "linear-gradient(145deg, #fcdde9, #f5b8d1)"
                    }}
                  >
                    <span className="relative z-10">
                      {tile.emoji}
                    </span>
                  </div>

                  <div className={`
                    absolute w-full h-2 rounded-t-lg
                    ${blocked
                      ? "bg-gray-500"
                      : selectedTiles.includes(tile.id)
                        ? "bg-yellow-400"
                        : tile.layer === 0
                          ? "bg-indigo-400"
                          : tile.layer === 1
                            ? "bg-purple-500"
                            : "bg-pink-600"}
                  `}
                    style={{
                      transform: "rotateX(90deg) translateZ(10px)",
                      boxShadow: "0 -2px 4px rgba(0,0,0,0.1)"
                    }}
                  ></div>

                  <div className={`
                    absolute h-full w-2 rounded-r-lg
                    ${blocked
                      ? "bg-gray-600"
                      : selectedTiles.includes(tile.id)
                        ? "bg-yellow-600"
                        : tile.layer === 0
                          ? "bg-indigo-600"
                          : tile.layer === 1
                            ? "bg-purple-700"
                            : "bg-pink-800"}
                  `}
                    style={{
                      transform: "rotateY(90deg) translateZ(36px)",
                      boxShadow: "2px 0 4px rgba(0,0,0,0.1)"
                    }}
                  ></div>

                  {tile.isMatched && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-60 flex items-center justify-center rounded-lg"
                      style={{ transform: "translateZ(15px)" }}>
                      <Check className="text-white" size={24} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TileGameBoard;