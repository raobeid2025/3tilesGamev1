"use client";

import React from "react";
import { useTileGame } from "@/hooks/use-tile-game";
import TileGameControls from "@/components/TileGameControls";
import TileGameBoard from "@/components/TileGameBoard";
import TileSlot from "@/components/TileSlot";
import LevelNavigation from "@/components/LevelNavigation";
import LevelSelectModal from "@/components/LevelSelectModal";
import GameStatusModals from "@/components/GameStatusModals";

export default function TileMasterMatch() {
  const {
    tiles,
    selectedTiles,
    moves,
    gameStatus,
    isChecking,
    selectedTheme,
    slotTiles,
    tilesToRemove,
    vibratingTiles,
    slotAnimationKey,
    currentLevel,
    showLevelComplete,
    levelSelectOpen,
    isProcessingSlot,
    shufflesLeft,
    currentLevelConfig,
    levelConfigs,
    
    isTileBlocked,
    getTopTileAtPosition,
    handleThemeChange,
    moveToSlot,
    handleSlotTileClick,
    handleNextLevel,
    handlePrevLevel,
    handleRestartLevel,
    handleLevelSelect,
    handleShuffle,
    setLevelSelectOpen,
    setShowLevelComplete,
  } = useTileGame();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="w-full text-3xl font-bold text-indigo-800 mb-2">Tile Master Match</h1>
          <p className="text-indigo-600">Level {currentLevel}: Match 3 tiles to clear them!</p>
        </div>

        <TileGameControls
          moves={moves}
          currentLevel={currentLevel}
          shufflesLeft={shufflesLeft}
          selectedTheme={selectedTheme}
          onThemeChange={handleThemeChange}
          onRestart={handleRestartLevel}
          onShuffle={handleShuffle}
          gameStatus={gameStatus}
          isChecking={isChecking}
          isProcessingSlot={isProcessingSlot}
        />

        <div className="text-center text-gray-600 mb-6">
          <p className="bg-white rounded-lg p-3 shadow-sm">
            Pattern: <span className="font-bold capitalize">{currentLevelConfig.pattern}</span> with {currentLevelConfig.layers} layer{currentLevelConfig.layers > 1 ? 's' : ''}. 
            Match 3+ same tiles in slot to remove them!
            <span className="block mt-1 text-red-500 font-medium">⚠️ Slot can hold max {currentLevelConfig.slotSize} tiles!</span>
          </p>
        </div>

        <TileSlot
          slotTiles={slotTiles}
          tilesToRemove={tilesToRemove}
          vibratingTiles={vibratingTiles}
          slotAnimationKey={slotAnimationKey}
          currentLevelConfig={currentLevelConfig}
          handleSlotTileClick={handleSlotTileClick}
          isChecking={isChecking}
          gameStatus={gameStatus}
          isProcessingSlot={isProcessingSlot}
          selectedTiles={selectedTiles}
        />

        <TileGameBoard
          tiles={tiles}
          currentLevelConfig={currentLevelConfig}
          isTileBlocked={isTileBlocked}
          getTopTileAtPosition={getTopTileAtPosition}
          moveToSlot={moveToSlot}
          selectedTiles={selectedTiles}
        />

        <LevelNavigation
          currentLevel={currentLevel}
          levelConfigs={levelConfigs}
          onPrevLevel={handlePrevLevel}
          onNextLevel={handleNextLevel}
          onToggleLevelSelect={() => setLevelSelectOpen(!levelSelectOpen)}
        />

        <LevelSelectModal
          isOpen={levelSelectOpen}
          onClose={() => setLevelSelectOpen(false)}
          levelConfigs={levelConfigs}
          currentLevel={currentLevel}
          onSelectLevel={handleLevelSelect}
        />

        <GameStatusModals
          gameStatus={gameStatus}
          showLevelComplete={showLevelComplete}
          currentLevel={currentLevel}
          currentLevelConfig={currentLevelConfig}
          moves={moves}
          slotTilesLength={slotTiles.length}
          onRestartLevel={handleRestartLevel}
          onNextLevel={handleNextLevel}
          totalLevels={levelConfigs.length}
        />
      </div>
    </div>
  );
}