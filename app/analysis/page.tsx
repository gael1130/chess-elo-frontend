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

  // Initial fetch
  useEffect(() => {
    fetchPuzzles(1);
  }, []);

  const handlePuzzleSolved = () => {
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
                  onSolve={handlePuzzleSolved}
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