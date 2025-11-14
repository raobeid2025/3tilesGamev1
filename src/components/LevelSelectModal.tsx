"use client";

import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LevelConfig } from "@/utils/game-config";

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelConfigs: LevelConfig[];
  currentLevel: number;
  onSelectLevel: (levelId: number) => void;
}

const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  levelConfigs,
  currentLevel,
  onSelectLevel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-800">Select Level</h2>
              <Button 
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2"> {/* Adjusted grid columns */}
              {levelConfigs.map((level) => (
                <Button
                  key={level.id}
                  onClick={() => onSelectLevel(level.id)}
                  className={`
                    h-10 flex items-center justify-center text-xs
                    ${level.id === currentLevel 
                      ? "bg-indigo-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"}
                    ${level.layers > 1 ? "font-bold" : ""}
                  `}
                >
                  {level.id}
                  {level.layers > 1 && (
                    <span className="ml-1 text-xs">({level.layers})</span>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Pattern levels: {levelConfigs.length}/50</p>
              <p className="mt-1">Bold numbers indicate multi-layer levels</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelSelectModal;