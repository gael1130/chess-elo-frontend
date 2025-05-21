// chess-elo-frontend/components/ui/ChessPuzzle.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js"; // You'll need to install chess.js
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, HelpCircle } from "lucide-react";
import { ChessPuzzleData, PuzzleMove } from "@/data/types";

interface FSRSStatus {
  difficulty: number;
  stability: number;
  retrievability: number;
  next_review_date: string;
  last_attempted: string;
  attempts_count: number;
}

interface ChessPuzzleProps {
  puzzle: ChessPuzzleData;
  onSolve?: (triesCount: number, hintUsed: boolean) => void;
  onFail?: () => void;
  attemptHistory?: FSRSStatus;
}

export function ChessPuzzle({ puzzle, onSolve, onFail, attemptHistory }: ChessPuzzleProps) {
  // Game state
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [status, setStatus] = useState<"initial" | "correct" | "incorrect" | "solved">("initial");
  const [showHint, setShowHint] = useState(false);
  const [initialMoveMade, setInitialMoveMade] = useState(false);
  
  // FSRS tracking state
  const [triesCount, setTriesCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  
  // Store the opponent's move for highlighting
  const [opponentMove, setOpponentMove] = useState<PuzzleMove | null>(null);
  
  // Ref for the chessboard container to measure its width
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400); // Default width
  
  // Timeout reference for animations
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update board width based on container size
  useEffect(() => {
    const updateBoardWidth = () => {
      if (boardContainerRef.current) {
        // Get the container width
        const containerWidth = boardContainerRef.current.clientWidth;
        // Set a maximum width to prevent the board from getting too large
        const maxWidth = 600;
        // Calculate the new board width (subtract padding if needed)
        const newWidth = Math.min(containerWidth, maxWidth);
        setBoardWidth(newWidth);
      }
    };

    // Initial width calculation
    updateBoardWidth();

    // Update width on window resize
    window.addEventListener('resize', updateBoardWidth);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateBoardWidth);
    };
  }, []);

  // Setup puzzle when it changes
  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset state
    setCurrentSolutionIndex(0);
    setStatus("initial");
    setShowHint(false);
    setInitialMoveMade(false);
    
    // Reset FSRS tracking for new puzzle
    setTriesCount(0);
    setHintUsed(false);
    
    // Load the starting position
    const initialGame = new Chess(puzzle.startFEN);
    setGame(initialGame);
    
    // Set board orientation based on player color
    setOpponentMove(puzzle.opponentMove);
    
    // Show the initial position first, then make the opponent's move
    timeoutRef.current = setTimeout(() => {
      try {
        initialGame.move({
          from: puzzle.opponentMove.from,
          to: puzzle.opponentMove.to,
          promotion: puzzle.opponentMove.promotion || "q"
        });
        
        setGame(new Chess(initialGame.fen()));
        setInitialMoveMade(true);
        
        console.log(`Made opponent's move: ${puzzle.opponentMove.from} to ${puzzle.opponentMove.to}`);
        console.log(`New position: ${initialGame.fen()}`);
      } catch (error) {
        console.error("Error making opponent's move:", error);
        
        // If move fails, still allow the player to play
        // (this should not happen with valid data)
        setInitialMoveMade(true);
      }
    }, 1000);
    
    // Debug info
    console.log("Puzzle loaded:", {
      id: puzzle.id,
      startFEN: puzzle.startFEN,
      playerColor: puzzle.playerColor,
      opponentMove: puzzle.opponentMove,
      solution: puzzle.solution
    });
    
    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [puzzle]);

  // Function to check if a move matches the expected solution move
  const isCorrectMove = useCallback((move: any, expected: PuzzleMove) => {
    return move.from === expected.from && move.to === expected.to;
  }, []);

  // Handle making a move
  const makeMove = useCallback((move: any) => {
    try {
      // Try to make the move in the game
      const result = game.move({
        from: move.from,
        to: move.to,
        promotion: "q" // Always promote to queen for simplicity
      });
      
      if (!result) return false;
      
      // Clone the game to avoid direct state mutation
      const gameCopy = new Chess(game.fen());
      
      // Check if the move is correct
      const expectedMove = puzzle.solution[currentSolutionIndex];
      
      if (isCorrectMove(move, expectedMove)) {
        // Correct move!
        const isLastMove = currentSolutionIndex + 2 >= puzzle.solution.length;
        
        if (isLastMove) {
          // Puzzle solved - no more moves
          setGame(gameCopy);
          setStatus("solved");
          onSolve?.(triesCount, hintUsed);
          return true;
        } else {
          // Make the opponent's next move automatically
          const opponentMove = puzzle.solution[currentSolutionIndex + 1];
          
          try {
            gameCopy.move({
              from: opponentMove.from,
              to: opponentMove.to,
              promotion: opponentMove.promotion || "q"
            });
            
            setGame(gameCopy);
            setCurrentSolutionIndex(currentSolutionIndex + 2);
            setStatus("correct");
            setShowHint(false);
            return true;
          } catch (error) {
            console.error("Error making opponent's response:", error);
            return false;
          }
        }
      } else {
        // Incorrect move
        setStatus("incorrect");
        setTriesCount(prev => prev + 1); // Increment tries count for FSRS
        onFail?.();
        
        // Reset to the position after the opponent's initial move
        resetToOpponentMove();
        return false;
      }
    } catch (error) {
      console.error("Error making move:", error);
      return false;
    }
  }, [game, puzzle.solution, currentSolutionIndex, isCorrectMove, onSolve, onFail, triesCount, hintUsed]);

  // Reset to the position after the opponent's move
  const resetToOpponentMove = useCallback(() => {
    const resetGame = new Chess(puzzle.startFEN);
    
    try {
      resetGame.move({
        from: puzzle.opponentMove.from,
        to: puzzle.opponentMove.to,
        promotion: puzzle.opponentMove.promotion || "q"
      });
      
      setGame(new Chess(resetGame.fen()));
      setInitialMoveMade(true);
    } catch (error) {
      console.error("Error resetting to opponent's move position:", error);
      setGame(new Chess(puzzle.startFEN));
    }
  }, [puzzle.startFEN, puzzle.opponentMove]);

  // Handle piece drop on the board
  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    if (status === "solved" || !initialMoveMade) return false;
    
    return makeMove({
      from: sourceSquare,
      to: targetSquare
    });
  }, [makeMove, status, initialMoveMade]);

  // Get the next move for the hint
  const getNextMove = useCallback(() => {
    if (currentSolutionIndex < puzzle.solution.length) {
      return puzzle.solution[currentSolutionIndex];
    }
    return null;
  }, [currentSolutionIndex, puzzle.solution]);

  // Show hint
  const handleShowHint = useCallback(() => {
    setShowHint(true);
    setHintUsed(true); // Track hint usage for FSRS
  }, []);

  // Reset the puzzle
  const handleReset = useCallback(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setCurrentSolutionIndex(0);
    setStatus("initial");
    setShowHint(false);
    
    // Reset FSRS tracking on manual reset
    setTriesCount(0);
    setHintUsed(false);
    
    // Start from the beginning
    const resetGame = new Chess(puzzle.startFEN);
    setGame(resetGame);
    setInitialMoveMade(false);
    
    // Make the opponent's move after a delay
    timeoutRef.current = setTimeout(() => {
      try {
        resetGame.move({
          from: puzzle.opponentMove.from,
          to: puzzle.opponentMove.to,
          promotion: puzzle.opponentMove.promotion || "q"
        });
        
        setGame(new Chess(resetGame.fen()));
        setInitialMoveMade(true);
      } catch (error) {
        console.error("Error making opponent's move during reset:", error);
        setInitialMoveMade(true);
      }
    }, 1000);
  }, [puzzle.startFEN, puzzle.opponentMove]);

  // Generate custom square styles for hints and highlighting
  const customSquareStyles = useCallback(() => {
    const styles: Record<string, React.CSSProperties> = {};
    
    // Highlight the hint square (only the source square in green)
    if (showHint && status !== "solved") {
      const nextMove = getNextMove();
      if (nextMove) {
        styles[nextMove.from] = { 
          backgroundColor: "rgba(76, 175, 80, 0.4)", // Green color for the source square
          borderRadius: "8px"
        };
        // No highlighting for destination square to make it more challenging
      }
    }
    
    // Highlight the opponent's move
    if (opponentMove && initialMoveMade) {
      styles[opponentMove.from] = { 
        backgroundColor: "rgba(255, 235, 59, 0.3)", 
        borderRadius: "8px" 
      };
      styles[opponentMove.to] = { 
        backgroundColor: "rgba(255, 235, 59, 0.3)", 
        borderRadius: "8px" 
      };
    }
    
    return styles;
  }, [showHint, status, getNextMove, initialMoveMade, opponentMove]);

  return (
    <div className="flex flex-col space-y-4">
      {/* Board container with reference for measuring width */}
      <div className="w-full" ref={boardContainerRef}>
        <div className="mx-auto" style={{ maxWidth: `${boardWidth}px` }}>
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            boardOrientation={puzzle.playerColor}
            customSquareStyles={customSquareStyles()}
            boardWidth={boardWidth}
            areArrowsAllowed={true}
            customBoardStyle={{
              borderRadius: "4px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        <div className="flex space-x-2">
          <Button 
            onClick={handleReset} 
            variant="outline" 
            size="sm"
            className="flex items-center"
          >
            <RefreshCw size={16} className="mr-1" />
            Reset
          </Button>
          
          <Button 
            onClick={handleShowHint} 
            variant="outline" 
            size="sm"
            className="flex items-center"
            disabled={status === "solved"}
          >
            <HelpCircle size={16} className="mr-1" />
            Hint
          </Button>
        </div>
        
        {/* FSRS status indicator */}
        {attemptHistory && (
          <div className="text-xs text-muted-foreground">
            {attemptHistory.attempts_count > 0 ? (
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded-full">
                  Reviewed {attemptHistory.attempts_count} time{attemptHistory.attempts_count !== 1 ? 's' : ''}
                </span>
                <span title={`Difficulty: ${attemptHistory?.difficulty ? attemptHistory.difficulty.toFixed(1) : 'N/A'}`}>
                  D: {attemptHistory?.difficulty ? attemptHistory.difficulty.toFixed(1) : 'N/A'}
                </span>
                <span title={`Stability: ${attemptHistory?.stability ? attemptHistory.stability.toFixed(1) : 'N/A'} days`}>
                  S: {attemptHistory?.stability ? attemptHistory.stability.toFixed(1) : 'N/A'}d
                </span>
                <span title={`Retrievability: ${attemptHistory?.retrievability ? (attemptHistory.retrievability * 100).toFixed(0) : 'N/A'}%`}>
                  R: {attemptHistory?.retrievability ? (attemptHistory.retrievability * 100).toFixed(0) : 'N/A'}%
                </span>
              </div>
            ) : (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                New Puzzle
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Current attempt stats (if puzzle is in progress) */}
      {status !== "solved" && (triesCount > 0 || hintUsed) && (
        <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
          {triesCount > 0 && (
            <span className="text-amber-500">Incorrect attempts: {triesCount}</span>
          )}
          {hintUsed && (
            <span className="text-blue-500">Hint used</span>
          )}
        </div>
      )}
    </div>
  );
}