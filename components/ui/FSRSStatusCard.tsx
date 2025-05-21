// Create a new component for FSRS status information
// components/ui/FSRSStatusCard.tsx

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Calendar, RefreshCw } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface FSRSStatus {
  difficulty: number;
  stability: number;
  retrievability: number;
  next_review_date: string;
  last_attempted: string;
  attempts_count: number;
}

interface FSRSDuePuzzle {
  puzzle_id: string;
  fsrs_status: FSRSStatus;
  rating: number;
  themes: string[];
}

interface FSRSStatusCardProps {
  username: string;
  currentPuzzleId: string;
  attemptHistory?: Record<string, FSRSStatus>;
  onSelectPuzzle: (puzzleId: string) => void;
}

export function FSRSStatusCard({ 
  username, 
  currentPuzzleId,
  attemptHistory = {},
  onSelectPuzzle
}: FSRSStatusCardProps) {
  const [duePuzzles, setDuePuzzles] = useState<FSRSDuePuzzle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (dateString?: string) => {
    try {
      if (!dateString) return "N/A";
      
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid date";
      
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Fetch due puzzles
  const fetchDuePuzzles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/due-puzzles/`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch due puzzles: ${response.status}`);
      }
      
      const data = await response.json();
      setDuePuzzles(data.due_puzzles || []);
    } catch (error) {
      console.error("Error fetching due puzzles:", error);
      setError("Failed to load due puzzles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch due puzzles on component mount
  useEffect(() => {
    fetchDuePuzzles();
  }, [username]);

  // Calculate total review count
  const totalReviews = Object.values(attemptHistory).reduce(
    (total, status) => total + (status?.attempts_count || 0), 
    0
  );
  
  // Calculate current status text
  const getPuzzleStatusText = () => {
    const status = attemptHistory[currentPuzzleId];
    
    if (!status) {
      return "New puzzle - not previously reviewed";
    }
    
    return `Reviewed ${status.attempts_count || 0} time${(status.attempts_count || 0) !== 1 ? 's' : ''}`
      + ` - Next review: ${formatDate(status.next_review_date)}`;
  };
  
  // Calculate difficulty level text
  const getDifficultyLevelText = (difficulty?: number) => {
    if (!difficulty) return "Unknown";
    if (difficulty < 1.5) return "Easy";
    if (difficulty < 2.5) return "Medium";
    return "Hard";
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (retrievability?: number) => {
    if (retrievability === undefined) return 0;
    return Math.max(0, Math.min(100, retrievability * 100));
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <Brain size={18} className="mr-2 text-purple-500" />
          Spaced Repetition (FSRS)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Puzzle Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Puzzle Status</h4>
            <p className="text-xs text-muted-foreground">{getPuzzleStatusText()}</p>
            
            {attemptHistory[currentPuzzleId] && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-slate-800 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground">Difficulty</div>
                  <div className="text-sm font-medium">
                    {attemptHistory[currentPuzzleId]?.difficulty !== undefined 
                      ? attemptHistory[currentPuzzleId].difficulty.toFixed(1) 
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getDifficultyLevelText(attemptHistory[currentPuzzleId]?.difficulty)}
                  </div>
                </div>
                
                <div className="bg-slate-800 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground">Stability</div>
                  <div className="text-sm font-medium">
                    {attemptHistory[currentPuzzleId]?.stability !== undefined 
                      ? attemptHistory[currentPuzzleId].stability.toFixed(1) + 'd'
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Memory strength
                  </div>
                </div>
                
                <div className="bg-slate-800 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground">Recall</div>
                  <div className="text-sm font-medium">
                    {attemptHistory[currentPuzzleId]?.retrievability !== undefined 
                      ? (attemptHistory[currentPuzzleId].retrievability * 100).toFixed(0) + '%'
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Probability
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* FSRS Progress Bar */}
          {attemptHistory[currentPuzzleId] && attemptHistory[currentPuzzleId]?.retrievability !== undefined && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Memory Strength</span>
                <span>{(attemptHistory[currentPuzzleId].retrievability * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${getProgressPercentage(attemptHistory[currentPuzzleId].retrievability)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 rounded p-2">
              <div className="text-xs text-muted-foreground">Total Reviews</div>
              <div className="text-lg font-medium">{totalReviews}</div>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <div className="text-xs text-muted-foreground">Due Puzzles</div>
              <div className="text-lg font-medium">{duePuzzles.length}</div>
            </div>
          </div>
          
          {/* Due Puzzles Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Due for Review</h4>
              <Button 
                onClick={fetchDuePuzzles} 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </Button>
            </div>
            
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : duePuzzles.length > 0 ? (
              <div className="space-y-2">
                {duePuzzles.slice(0, 3).map((puzzle) => (
                  <div 
                    key={puzzle.puzzle_id}
                    className="bg-slate-800 rounded p-2 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => onSelectPuzzle(puzzle.puzzle_id)}
                  >
                    <div className="flex justify-between">
                      <div className="text-xs truncate max-w-[70%]">
                        #{puzzle.puzzle_id.substring(0, 8)}...
                      </div>
                      <div className="text-xs">
                        Rating: {puzzle.rating}
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center">
                          <Calendar size={10} className="mr-1" />
                          {formatDate(puzzle.fsrs_status?.next_review_date)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        R: {puzzle.fsrs_status?.retrievability !== undefined 
                          ? (puzzle.fsrs_status.retrievability * 100).toFixed(0) 
                          : 'N/A'}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {duePuzzles.length > 3 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{duePuzzles.length - 3} more puzzles due for review
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading due puzzles..." : "No puzzles currently due for review"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}