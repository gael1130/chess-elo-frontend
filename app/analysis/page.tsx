// chess-elo-frontend/app/analysis/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ChessPuzzle } from "@/components/ui/ChessPuzzle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
  ExternalLink,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { 
  ChessPuzzleData,
  ApiPuzzle, 
  ApiResponse 
} from "@/data/types";
import { FSRSStatusCard } from "@/components/ui/FSRSStatusCard";

interface FSRSStatus {
  difficulty: number;
  stability: number;
  retrievability: number;
  next_review_date: string;
  last_attempted: string;
  attempts_count: number;
}

interface FSRSPuzzleAttempt {
  attempt_id: string;
  puzzle_id: string;
  player_username: string;
  timestamp: string;
  tries_count: number;
  hint_used: boolean;
  solved: boolean;
  fsrs_status: FSRSStatus;
}

export default function AnalysisPage() {
  const [puzzles, setPuzzles] = useState<ChessPuzzleData[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<Set<string>>(
    new Set<string>()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPuzzles, setTotalPuzzles] = useState(0);

  // FSRS state
  const [puzzleAttemptHistory, setPuzzleAttemptHistory] = useState<Record<string, FSRSStatus>>({});
  const [isLoadingFSRS, setIsLoadingFSRS] = useState(false);

  const currentPuzzle = puzzles[currentPuzzleIndex];

  // Function to convert API puzzle format to app format
  const convertApiPuzzle = (apiPuzzle: ApiPuzzle): ChessPuzzleData => {
    return {
      id: apiPuzzle.id,
      player_username: apiPuzzle.player_username,
      opponent_username: apiPuzzle.opponent_username,
      game_date: apiPuzzle.game_date,
      playerColor: apiPuzzle.player_color as "white" | "black", // Type assertion for PlayerColor
      startFEN: apiPuzzle.start_fen,
      opponentMove: {
        from: apiPuzzle.opponent_move_from,
        to: apiPuzzle.opponent_move_to,
      },
      solution: apiPuzzle.solution,
      rating: String(apiPuzzle.rating), // Convert to string to match existing format
      themes: apiPuzzle.themes,
      gameUrl: apiPuzzle.game_url,
    };
  };

  // Load puzzles from the API
  const fetchPuzzles = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/kalel1130/puzzles/?page=${page}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Convert API puzzle format to app format
      const convertedPuzzles = data.puzzles.map(convertApiPuzzle);
      
      setPuzzles(convertedPuzzles);
      setTotalPages(data.pagination.total_pages);
      setTotalPuzzles(data.total_puzzles);
      setCurrentPage(data.pagination.page);
      
      // Reset the current puzzle index when loading a new page
      setCurrentPuzzleIndex(0);
      
      // Load solved puzzles from localStorage (only on first load)
      if (page === 1) {
        const savedSolved = localStorage.getItem("solvedPuzzles");
        if (savedSolved) {
          try {
            const solvedIds = new Set<string>(JSON.parse(savedSolved));
            setSolvedPuzzleIds(solvedIds);
            setPuzzlesSolved(solvedIds.size);
          } catch (e) {
            console.error("Error parsing saved puzzles:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error loading puzzles:", error);
      setError("Failed to load puzzles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch FSRS attempt history for a user
  const fetchFSRSAttemptHistory = async (username: string) => {
    setIsLoadingFSRS(true);
    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/puzzles/attempts/?player_username=${username}`
      );
      
      if (!response.ok) {
        throw new Error(`FSRS history fetch failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert the array of attempts to a record keyed by puzzle_id
      const attemptsByPuzzle: Record<string, FSRSStatus> = {};
      
      data.attempts.forEach((attempt: FSRSPuzzleAttempt) => {
        attemptsByPuzzle[attempt.puzzle_id] = {
          ...attempt.fsrs_status,
          last_attempted: attempt.timestamp,
          attempts_count: (attemptsByPuzzle[attempt.puzzle_id]?.attempts_count || 0) + 1
        };
      });
      
      setPuzzleAttemptHistory(attemptsByPuzzle);
    } catch (error) {
      console.error("Error fetching FSRS history:", error);
    } finally {
      setIsLoadingFSRS(false);
    }
  };

  // Submit FSRS attempt when a puzzle is solved
  const submitFSRSAttempt = async (
    puzzleId: string, 
    triesCount: number, 
    hintUsed: boolean, 
    solved: boolean
  ) => {
    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/puzzles/attempts/fsrs/`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            puzzle_id: puzzleId,
            player_username: "kalel1130", // Replace with dynamic username when available
            tries_count: triesCount,
            hint_used: hintUsed,
            solved: solved,
            // rating is omitted so it's determined automatically
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`FSRS attempt submission failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update local state with the new FSRS status
      setPuzzleAttemptHistory(prev => ({
        ...prev,
        [puzzleId]: {
          ...data.fsrs_status,
          last_attempted: new Date().toISOString(),
          attempts_count: (prev[puzzleId]?.attempts_count || 0) + 1
        }
      }));
      
      return data;
    } catch (error) {
      console.error("Error submitting FSRS attempt:", error);
      return null;
    }
  };

  // Find a puzzle by ID
  const findPuzzleById = async (puzzleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to find the puzzle in the current page
      const puzzleInCurrentPage = puzzles.find(p => p.id === puzzleId);
      if (puzzleInCurrentPage) {
        setCurrentPuzzleIndex(puzzles.indexOf(puzzleInCurrentPage));
        setLoading(false);
        return;
      }
      
      // If not found, fetch the specific puzzle from the API
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/puzzles/${puzzleId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert the API puzzle to app format
      const convertedPuzzle = convertApiPuzzle(data.puzzle);
      
      // Add this puzzle to the current page
      setPuzzles([convertedPuzzle, ...puzzles.slice(0, puzzles.length - 1)]);
      setCurrentPuzzleIndex(0);
    } catch (error) {
      console.error("Error fetching puzzle by ID:", error);
      setError("Failed to load the requested puzzle. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a due puzzle
  const handleSelectDuePuzzle = (puzzleId: string) => {
    findPuzzleById(puzzleId);
  };

  // Initial fetch
  useEffect(() => {
    fetchPuzzles(1);
    // Fetch FSRS attempt history for the current user
    fetchFSRSAttemptHistory("kalel1130"); // Replace with dynamic username when available
  }, []);

  // Updated puzzle solved handler with FSRS support
  const handlePuzzleSolved = (triesCount = 0, hintUsed = false) => {
    if (currentPuzzle && !solvedPuzzleIds.has(currentPuzzle.id)) {
      // Only count puzzles solved for the first time
      const updatedSolved = new Set<string>([
        ...solvedPuzzleIds,
        currentPuzzle.id,
      ]);
      setSolvedPuzzleIds(updatedSolved);
      setPuzzlesSolved(updatedSolved.size);

      // Save to localStorage
      localStorage.setItem(
        "solvedPuzzles",
        JSON.stringify(Array.from(updatedSolved))
      );
    }
    
    // Submit FSRS attempt data
    if (currentPuzzle) {
      submitFSRSAttempt(currentPuzzle.id, triesCount, hintUsed, true);
    }
  };

  const handleNextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      // Go to next puzzle on current page
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    } else if (currentPage < totalPages) {
      // Load next page if available
      fetchPuzzles(currentPage + 1);
    } else {
      // Wrap around to the first puzzle on the first page
      setCurrentPuzzleIndex(0);
      fetchPuzzles(1);
    }
  };

  const handlePrevPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      // Go to previous puzzle on current page
      setCurrentPuzzleIndex(currentPuzzleIndex - 1);
    } else if (currentPage > 1) {
      // Load previous page if available
      fetchPuzzles(currentPage - 1).then(() => {
        // After loading previous page, go to the last puzzle on that page
        setCurrentPuzzleIndex(24); // Assuming 25 puzzles per page (0-indexed)
      });
    } else {
      // Wrap around to the last puzzle on the last page
      fetchPuzzles(totalPages).then(() => {
        // After loading the last page, go to the last puzzle
        // We don't know exactly how many puzzles are on the last page,
        // so we'll use the displayed_puzzles value or default to 24
        setCurrentPuzzleIndex(puzzles.length - 1);
      });
    }
  };

  // Function to handle page changes
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchPuzzles(page);
    }
  };

  if (loading && puzzles.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Chess Analysis</h2>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-500">Loading puzzles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Chess Analysis</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p>{error}</p>
          <Button 
            onClick={() => fetchPuzzles(1)} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (puzzles.length === 0 || !currentPuzzle) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Chess Analysis</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-600">
          <p>No puzzles available. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Calculate the overall puzzle number across all pages
  const currentPuzzleNumber = (currentPage - 1) * 25 + currentPuzzleIndex + 1;

  return (
    <div className="container mx-auto py-6 px-4">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">
                    Puzzle #{currentPuzzle.id.substring(0, 8)}... {/* Shortened ID for display */}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Rating: <span className="font-medium">{currentPuzzle.rating}</span>
                  </CardDescription>
                  
                  {/* Game date and opponent info */}
                  <div className="mt-1 text-xs text-muted-foreground space-y-1">
                    {currentPuzzle.game_date && (
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>Game Date: {currentPuzzle.game_date}</span>
                      </div>
                    )}
                    {currentPuzzle.opponent_username && (
                      <div className="flex items-center">
                        <User size={14} className="mr-1" />
                        <span>Opponent: {currentPuzzle.opponent_username}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-2 space-x-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-500 text-white font-medium rounded-full">
                      Playing as {currentPuzzle.playerColor}
                    </span>
                    {currentPuzzle.themes.map((theme) => (
                      <span
                        key={theme}
                        className="text-xs px-2 py-0.5 bg-purple-500 text-white font-medium rounded-full"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                  
                  {/* FSRS status indicators */}
                  {puzzleAttemptHistory[currentPuzzle.id] ? (
                    <div className="flex items-center mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded-full">
                        Reviewed {puzzleAttemptHistory[currentPuzzle.id].attempts_count} time{puzzleAttemptHistory[currentPuzzle.id].attempts_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center mt-1">
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                        New Puzzle
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handlePrevPuzzle}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronLeft size={16} />}
                  </Button>
                  <Button
                    onClick={handleNextPuzzle}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 py-4">
              {loading && puzzles.length > 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-500">Loading puzzle...</span>
                </div>
              ) : (
                <ChessPuzzle
                  puzzle={currentPuzzle}
                  onSolve={(triesCount, hintUsed) => handlePuzzleSolved(triesCount, hintUsed)}
                  attemptHistory={puzzleAttemptHistory[currentPuzzle.id]}
                />
              )}
            </CardContent>

            <CardFooter className="px-4 py-3 bg-black bg-opacity-5 flex justify-between">
              <span className="text-sm text-muted-foreground">
                Puzzle {currentPuzzleNumber} of {totalPuzzles} (Page {currentPage} of {totalPages})
              </span>
              <a
              
                href={currentPuzzle.gameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
              >
                Original game <ExternalLink size={14} className="ml-1" />
              </a>
            </CardFooter>
          </Card>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              <Button
                onClick={() => goToPage(1)}
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
              >
                First
              </Button>
              <Button
                onClick={() => goToPage(currentPage - 1)}
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <div className="px-3 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                onClick={() => goToPage(currentPage + 1)}
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
              <Button
                onClick={() => goToPage(totalPages)}
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || loading}
              >
                Last
              </Button>
            </div>
          )}
        </div>

        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Award size={18} className="mr-2 text-yellow-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Puzzles Solved:</span>
                  <span className="font-medium">
                    {puzzlesSolved} of {totalPuzzles}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Rating:</span>
                  <span className="font-medium">{currentPuzzle.rating}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{
                      width: `${(puzzlesSolved / totalPuzzles) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FSRS Status Card */}
          <FSRSStatusCard 
            username="kalel1130" // Replace with dynamic username when available
            currentPuzzleId={currentPuzzle.id}
            attemptHistory={puzzleAttemptHistory}
            onSelectPuzzle={handleSelectDuePuzzle}
          />

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <BookOpen size={18} className="mr-2 text-blue-500" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="inline-block font-medium rounded-full mr-1 ">
                    1.
                  </span>
                  Watch the opponent's move
                </li>
                <li className="flex items-start">
                  <span className="inline-block font-medium rounded-full mr-1 ">
                    2.
                  </span>
                  Drag and drop pieces to make your best move
                </li>
                <li className="flex items-start">
                  <span className="inline-block font-medium rounded-full mr-1 ">
                    3.
                  </span>
                  Use the hint button if you get stuck
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Themes in this Puzzle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentPuzzle.themes.map((theme) => (
                  <div
                    key={theme}
                    className="px-3 py-1 bg-purple-500 text-white font-medium rounded-full text-sm"
                  >
                    {theme}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}