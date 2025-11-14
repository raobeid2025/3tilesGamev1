"use client";

import React from 'react';
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Tile, LevelConfig } from "@/utils/game-config";

interface TileGameBoardProps {
  tiles: Tile[];
  currentLevelConfig: LevelConfig;
  isTileBlocked: (tile: Tile, allTiles: Tile[]) => boolean;
  moveToSlot: (id: number) => void; // Still needed for direct move if not peek mode
  selectedTiles: number[];
  peekedTileId: number | null;
  peekedTileEmoji: string | null; // New prop
  isPeekModeActive: boolean; // New prop
  handleTileClickOnBoard: (id: number, isBlocked: boolean) => void; // New prop
}

const TileGameBoard: React.FC<TileGameBoardProps> = ({
  tiles,
  currentLevelConfig,
  isTileBlocked,
  selectedTiles,
  peekedTileId,
  peekedTileEmoji, // Destructure new prop
  isPeekModeActive, // Destructure new prop
  handleTileClickOnBoard, // Destructure new prop
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
            const isCurrentlyPeeked = peekedTileId === tile.id; // Check if THIS tile is the one being peeked
            
            return (
              <motion.div
                key={`tile-${tile.id}`}
                className="absolute"
                layout
                // Apply initial/animate only to unblocked tiles
                initial={!blocked ? { scale: 0.8, opacity: 0 } : {}}
                animate={!blocked ? { scale: 1, opacity: 1 } : {}}
                exit={{
                  scale: 0,
                  opacity: 0,
                  rotate: tile.isMatched ? 360 : 0,
                  transition: { duration: 0.1 } // Faster exit for all tiles
                }}
                // Apply spring transition only to unblocked tiles, instant for blocked
                transition={!blocked ? {
                  type: "spring",
                  stiffness: 900, // Slightly increased stiffness
                  damping: 45 // Slightly increased damping
                } : { duration: 0 }} // Instant transition for blocked tiles
                whileHover={!blocked ? { scale: 1.08, y: -5, zIndex: 100 } : {}} // Enhanced hover effect for unblocked tiles
                style={{
                  left: `${tile.position.col * effectiveTileSize + tileSpacing / 2}px`,
                  top: `${tile.position.row * effectiveTileSize + tileSpacing / 2}px`,
                  transform: `translateZ(${tile.layer * 15}px)`,
                  zIndex: tile.layer,
                }}
              >
                <div
                  className={`
                    relative w-12 h-12 cursor-pointer transform transition-all duration-200
                    ${blocked ? "opacity-60 cursor-not-allowed" : ""}
                    ${selectedTiles.includes(tile.id) ? "scale-95" : ""}
                  `}
                  onClick={() => handleTileClickOnBoard(tile.id, blocked)} // Use the new unified handler
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `translateZ(${tile.layer * 15}px) ${selectedTiles.includes(tile.id) ? "scale(0.95)" : ""}`
                  }}
                >
                  <div className={`
                    absolute w-full h-full flex items-center justify-center rounded-lg text-2xl font-bold
                    border-2 transition-all duration-200
                    ${blocked
                      ? (isCurrentlyPeeked ? "border-yellow-500 bg-yellow-100" : "border-gray-500 bg-gray-400")
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
                      background: blocked && !isCurrentlyPeeked
                        ? "linear-gradient(145deg, #cccccc, #aaaaaa)"
                        : tile.layer === 0
                          ? "linear-gradient(145deg, #ffffff, #e0e0e0)"
                          : tile.layer === 1
                            ? "linear-gradient(145deg, #e8dcfc, #c7b8f5)"
                            : "linear-gradient(145deg, #fcdde9, #f5b8d1)"
                    }}
                  >
                    <span className="relative z-10">
                      {isCurrentlyPeeked && peekedTileEmoji ? peekedTileEmoji : (blocked ? "❓" : tile.emoji)}
                    </span>
                  </div>

                  <div className={`
                    absolute w-full h-2 rounded-t-lg
                    ${blocked
                      ? (isCurrentlyPeeked ? "bg-yellow-400" : "bg-gray-500")
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
                      ? (isCurrentlyPeeked ? "bg-yellow-600" : "bg-gray-600")
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