"use client";

import React from 'react';
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Tile, LevelConfig } from "@/utils/game-config";

interface TileGameBoardProps {
  tiles: Tile[];
  currentLevelConfig: LevelConfig;
  isTileBlocked: (tile: Tile, allTiles: Tile[]) => boolean;
  getTopTileAtPosition: (row: number, col: number, allTiles: Tile[]) => Tile | null;
  moveToSlot: (id: number) => void;
  selectedTiles: number[];
}

const TileGameBoard: React.FC<TileGameBoardProps> = ({
  tiles,
  currentLevelConfig,
  isTileBlocked,
  getTopTileAtPosition,
  moveToSlot,
  selectedTiles,
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-2 shadow-2xl relative overflow-hidden border-4 border-indigo-200">
        <div 
          className="grid gap-0.5 relative z-10"
          style={{ 
            gridTemplateColumns: `repeat(${currentLevelConfig.gridSize}, minmax(0, 1fr))`,
            width: `${currentLevelConfig.gridSize * 56}px`
          }}
        >
          {Array(currentLevelConfig.gridSize).fill(null).map((_, rowIndex) => (
            Array(currentLevelConfig.gridSize).fill(null).map((_, colIndex) => {
              const topTile = getTopTileAtPosition(rowIndex, colIndex, tiles);
              
              return (
                <div 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  className="relative flex items-center justify-center"
                  style={{ 
                    width: '52px',
                    height: '52px'
                  }}
                >
                  {topTile ? (
                    <motion.div
                      key={`tile-${topTile.id}`}
                      className="absolute"
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ 
                        scale: 0, 
                        opacity: 0,
                        rotate: topTile.isMatched ? 360 : 0,
                        transition: { duration: 0.15 }
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 600,
                        damping: 30
                      }}
                      style={{
                        transform: `translateZ(${topTile.layer * 15}px)`, // Increased Z-separation
                        zIndex: topTile.layer
                      }}
                    >
                      <div 
                        className={`
                          relative w-12 h-12 cursor-pointer transform transition-all duration-200
                          ${isTileBlocked(topTile, tiles) ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}
                          ${selectedTiles.includes(topTile.id) ? "scale-95" : ""}
                        `}
                        onClick={() => {
                          if (!isTileBlocked(topTile, tiles)) {
                            moveToSlot(topTile.id);
                          }
                        }}
                        style={{
                          transformStyle: "preserve-3d",
                          transform: `translateZ(${topTile.layer * 15}px) ${selectedTiles.includes(topTile.id) ? "scale(0.95)" : ""}`
                        }}
                      >
                        <div className={`
                          absolute w-full h-full flex items-center justify-center rounded-lg text-2xl font-bold
                          border-2 transition-all duration-200
                          ${isTileBlocked(topTile, tiles)
                            ? "border-gray-500 bg-gray-400" 
                            : selectedTiles.includes(topTile.id)
                              ? "border-yellow-500 bg-yellow-200"
                              : topTile.layer === 0
                                ? "border-indigo-500 bg-white" // Base layer
                                : topTile.layer === 1
                                  ? "border-purple-600 bg-purple-200" // Middle layer
                                  : "border-pink-700 bg-pink-300"} // Top layer
                        `}
                          style={{
                            transform: "translateZ(10px)",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
                            background: topTile.layer === 0 
                              ? "linear-gradient(145deg, #ffffff, #e0e0e0)" 
                              : topTile.layer === 1 
                                ? "linear-gradient(145deg, #e8dcfc, #c7b8f5)" // More distinct purple
                                : "linear-gradient(145deg, #fcdde9, #f5b8d1)" // More distinct pink
                          }}
                        >
                          <span className="relative z-10">{topTile.emoji}</span>
                        </div>
                        
                        <div className={`
                          absolute w-full h-2 rounded-t-lg
                          ${isTileBlocked(topTile, tiles)
                            ? "bg-gray-500" 
                            : selectedTiles.includes(topTile.id)
                              ? "bg-yellow-400"
                              : topTile.layer === 0
                                ? "bg-indigo-400"
                                : topTile.layer === 1
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
                          ${isTileBlocked(topTile, tiles)
                            ? "bg-gray-600" 
                            : selectedTiles.includes(topTile.id)
                              ? "bg-yellow-600"
                              : topTile.layer === 0
                                ? "bg-indigo-600"
                                : topTile.layer === 1
                                  ? "bg-purple-700"
                                  : "bg-pink-800"}
                        `}
                          style={{
                            transform: "rotateY(90deg) translateZ(36px)",
                            boxShadow: "2px 0 4px rgba(0,0,0,0.1)"
                          }}
                        ></div>
                        
                        {topTile.isMatched && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-60 flex items-center justify-center rounded-lg"
                            style={{ transform: "translateZ(15px)" }}>
                            <Check className="text-white" size={24} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 relative"
                      style={{ transform: "translateZ(0)" }}>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
};

export default TileGameBoard;