"use client";

import React, { useRef, useState, useEffect } from "react";
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
    peekedTileId,
    peekedTileEmoji,
    peekDisplayTileId,
    peekUsesLeft,
    isPeekModeActive,
    blockingTilesToMove,
    blockedStatusMap,
    hasPeekableTiles,
    
    getTopTileAtPosition,
    handleThemeChange,
    moveToSlot,
    handleSlotTileClick,
    handleTileClickOnBoard,
    handleActivatePeekMode,
    handleNextLevel,
    handlePrevLevel,
    handleRestartLevel,
    handleLevelSelect,
    handleShuffle,
    setLevelSelectOpen,
    setShowLevelComplete,
  } = useTileGame();

  const gameBoardWrapperRef = useRef<HTMLDivElement>(null);
  const [gameBoardWrapperWidth, setGameBoardWrapperWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (gameBoardWrapperRef.current) {
        setGameBoardWrapperWidth(gameBoardWrapperRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-evenly px-2 py-2 sm:p-4">
      <div ref={gameBoardWrapperRef} className="w-full max-w-full sm:max-w-6xl mx-auto flex flex-col items-center gap-2">
        {/* Tile Game Controls at the top */}
        <TileGameControls
          moves={moves}
          currentLevel={currentLevel}
          shufflesLeft={shufflesLeft}
          peekUsesLeft={peekUsesLeft}
          selectedTheme={selectedTheme}
          // onThemeChange={handleThemeChange} // Removed as it's no longer used in TileGameControls
          onRestart={handleRestartLevel}
          onShuffle={handleShuffle}
          onActivatePeekMode={handleActivatePeekMode}
          gameStatus={gameStatus}
          isChecking={isChecking}
          isProcessingSlot={isProcessingSlot}
          isPeekModeActive={isPeekModeActive}
          currentLevelConfig={currentLevelConfig}
          hasPeekableTiles={hasPeekableTiles}
        />

        {/* Game Board */}
        <TileGameBoard
          tiles={tiles}
          currentLevelConfig={currentLevelConfig}
          blockedStatusMap={blockedStatusMap}
          moveToSlot={moveToSlot}
          selectedTiles={selectedTiles}
          peekedTileId={peekedTileId}
          peekedTileEmoji={peekedTileEmoji}
          peekDisplayTileId={peekDisplayTileId}
          isPeekModeActive={isPeekModeActive}
          handleTileClickOnBoard={handleTileClickOnBoard}
          availableWidth={gameBoardWrapperWidth}
          blockingTilesToMove={blockingTilesToMove}
        />

        {/* Tile Slot below the Game Board */}
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
          availableWidth={gameBoardWrapperWidth}
        />

        {/* Level Navigation at the bottom */}
        <LevelNavigation
          currentLevel={currentLevel}
          levelConfigs={levelConfigs}
          onPrevLevel={handlePrevLevel}
          onNextLevel={handleNextLevel}
          onToggleLevelSelect={() => setLevelSelectOpen(!levelSelectOpen)}
        />

        {/* Modals remain as overlays */}
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
          selectedTheme={selectedTheme}
        />
      </div>
    </div>
  );
}