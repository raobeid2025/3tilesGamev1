"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RotateCcw, Shuffle, Eye } from "lucide-react"; // Import Eye icon
import { EmojiTheme, GameStatus, LevelConfig } from "@/utils/game-config";

interface TileGameControlsProps {
  moves: number;
  currentLevel: number;
  shufflesLeft: number;
  peekUsesLeft: number; // New prop
  selectedTheme: EmojiTheme;
  onThemeChange: (value: string) => void;
  onRestart: () => void;
  onShuffle: () => void;
  onActivatePeekMode: () => void; // New prop
  gameStatus: GameStatus;
  isChecking: boolean;
  isProcessingSlot: boolean;
  isPeekModeActive: boolean; // New prop
  currentLevelConfig: LevelConfig; // Added to check layers
  hasPeekableTiles: boolean; // New prop
}

const TileGameControls: React.FC<TileGameControlsProps> = ({
  moves,
  currentLevel,
  shufflesLeft,
  peekUsesLeft,
  selectedTheme,
  onThemeChange,
  onRestart,
  onShuffle,
  onActivatePeekMode, // Destructure new prop
  gameStatus,
  isChecking,
  isProcessingSlot,
  isPeekModeActive, // Destructure new prop
  currentLevelConfig, // Destructure new prop
  hasPeekableTiles, // Destructure new prop
}) => {
  const isPeekDisabled = peekUsesLeft <= 0 || isPeekModeActive || gameStatus !== "playing" || isChecking || isProcessingSlot || currentLevelConfig.layers === 1 || !hasPeekableTiles;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Moves</div>
          <div className="text-xl font-bold text-indigo-700">{moves}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Level</div>
          <div className="text-xl font-bold text-indigo-700">{currentLevel}/50</div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Select value={selectedTheme} onValueChange={onThemeChange}>
          <SelectTrigger className="w-full sm:w-[160px]"> {/* Made responsive */}
            <SelectValue placeholder="Emoji Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mixed">Mixed Emojis</SelectItem>
            <SelectItem value="animals">Animals</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="objects">Objects</SelectItem>
            <SelectItem value="faces">Faces</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={onRestart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg"
        >
          <RotateCcw size={16} />
        </Button>
        <Button 
          onClick={onShuffle}
          disabled={shufflesLeft <= 0 || gameStatus !== "playing" || isChecking || isProcessingSlot}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-1"
        >
          <Shuffle size={16} /> Shuffle ({shufflesLeft})
        </Button>
        <Button 
          onClick={onActivatePeekMode}
          disabled={isPeekDisabled}
          className={`px-3 py-2 rounded-lg flex items-center gap-1 ${isPeekModeActive ? "bg-yellow-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        >
          <Eye size={16} /> Peek ({peekUsesLeft})
        </Button>
      </div>
    </div>
  );
};

export default TileGameControls;