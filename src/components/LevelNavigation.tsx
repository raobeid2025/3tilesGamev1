import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LevelConfig } from "@/utils/game-config";

interface LevelNavigationProps {
  currentLevel: number;
  levelConfigs: LevelConfig[];
  onPrevLevel: () => void;
  onNextLevel: () => void;
  onToggleLevelSelect: () => void;
}

const LevelNavigation: React.FC<LevelNavigationProps> = ({
  currentLevel,
  levelConfigs,
  onPrevLevel,
  onNextLevel,
  onToggleLevelSelect,
}) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
      <Button 
        onClick={onPrevLevel}
        disabled={currentLevel === 1}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <ChevronLeft size={16} />
        Prev
      </Button>
      
      <Button 
        onClick={onToggleLevelSelect}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
      >
        Select Level
      </Button>
      
      <Button 
        onClick={onNextLevel}
        disabled={currentLevel === levelConfigs.length} {/* Added disabled prop */}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        Next
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

export default LevelNavigation;