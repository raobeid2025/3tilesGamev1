"use client";

import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GameStatus, LevelConfig } from "@/utils/game-config";

interface GameStatusModalsProps {
  gameStatus: GameStatus;
  showLevelComplete: boolean;
  currentLevel: number;
  currentLevelConfig: LevelConfig;
  moves: number;
  slotTilesLength: number;
  onRestartLevel: () => void;
  onNextLevel: () => void;
  totalLevels: number;
}

const GameStatusModals: React.FC<GameStatusModalsProps> = ({
  gameStatus,
  showLevelComplete,
  currentLevel,
  currentLevelConfig,
  moves,
  slotTilesLength,
  onRestartLevel,
  onNextLevel,
  totalLevels,
}) => {
  return (
    <AnimatePresence>
      {gameStatus === "won" && showLevelComplete && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 text-center"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-indigo-800 mb-2">Level Complete!</h2>
            <p className="text-gray-600 mb-1">
              You cleared all tiles in <span className="font-bold">{moves}</span> moves
            </p>
            <p className="text-gray-600 mb-4">
              Level {currentLevel} ({currentLevelConfig.pattern} pattern)
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onRestartLevel}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex-1"
              >
                Replay Level
              </Button>
              
              <Button 
                onClick={onNextLevel}
                disabled={currentLevel === totalLevels}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 flex-1"
              >
                Next Level <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {gameStatus === "lost" && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 text-center"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="text-5xl mb-4">
              {slotTilesLength >= currentLevelConfig.slotSize ? "꽉!" : "😅"}
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {slotTilesLength >= currentLevelConfig.slotSize ? "Slot Full!" : "Game Over!"}
            </h2>
            <p className="text-gray-600 mb-1">
              {slotTilesLength >= currentLevelConfig.slotSize 
                ? `The slot reached ${currentLevelConfig.slotSize} tiles. Game over!` 
                : `You cleared some tiles in ${moves} moves.`}
            </p>
            <p className="text-gray-600 mb-4">
              Try again!
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={onRestartLevel}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameStatusModals;