// app/daily/page.tsx - New page for daily spaced repetition practice
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
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { 
  ChessPuzzleData, 
  ApiPuzzle, 
  FSRSStatus,
  DailyProgress,
  DailyPuzzlesResponse
} from "@/data/types";



export default function DailyPage() {
  const [puzzles, setPuzzles] = useState<ChessPuzzleData[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(
    null
  );
  const [resetInProgress, setResetInProgress] = useState(false);
  const [puzzleAttemptHistory, setPuzzleAttemptHistory] = useState<
    Record<string, FSRSStatus>
  >({});
  const [noMorePuzzles, setNoMorePuzzles] = useState(false);

  const currentPuzzle = puzzles[currentPuzzleIndex];
  const username = "kalel1130"; // Replace with dynamic username when available

  const handleSelectPuzzle = (puzzleId: string) => {
    console.log("Puzzle selection not implemented in daily mode");
    // No implementation needed for daily mode
  };

  // Function to convert API puzzle format to app format
  const convertApiPuzzle = (apiPuzzle: ApiPuzzle): ChessPuzzleData => {
    return {
      id: apiPuzzle.id,
      player_username: apiPuzzle.player_username,
      opponent_username: apiPuzzle.opponent_username,
      game_date: apiPuzzle.game_date,
      playerColor: apiPuzzle.player_color as "white" | "black",
      startFEN: apiPuzzle.start_fen,
      opponentMove: {
        from: apiPuzzle.opponent_move_from,
        to: apiPuzzle.opponent_move_to,
      },
      solution: apiPuzzle.solution,
      rating: String(apiPuzzle.rating),
      themes: apiPuzzle.themes,
      gameUrl: apiPuzzle.game_url,
      is_new: apiPuzzle.is_new, // Add this field to track new vs review puzzles
    };
  };

  // Fetch daily puzzles
  const fetchDailyPuzzles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/daily-puzzles/`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data: DailyPuzzlesResponse = await response.json();

      // Check if there are any puzzles available
      if (data.puzzles.length === 0) {
        setNoMorePuzzles(true);
        setLoading(false);
        return;
      }

      // Convert API puzzle format to app format
      const convertedPuzzles = data.puzzles.map(convertApiPuzzle);

      setPuzzles(convertedPuzzles);
      setDailyProgress(data.progress);
      setCurrentPuzzleIndex(0);
      setNoMorePuzzles(false);
    } catch (error) {
      console.error("Error loading daily puzzles:", error);
      setError("Failed to load daily puzzles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch FSRS attempt history
  const fetchFSRSAttemptHistory = async () => {
    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/puzzles/attempts/?player_username=${username}`
      );

      if (!response.ok) {
        console.error("FSRS history fetch failed:", response.status);
        return;
      }

      const data = await response.json();

      // Convert the array of attempts to a record keyed by puzzle_id
      const attemptsByPuzzle: Record<string, FSRSStatus> = {};

      data.attempts.forEach((attempt: any) => {
        attemptsByPuzzle[attempt.puzzle_id] = {
          ...attempt.fsrs_status,
          last_attempted: attempt.created_at,
          attempts_count:
            (attemptsByPuzzle[attempt.puzzle_id]?.attempts_count || 0) + 1,
        };
      });

      setPuzzleAttemptHistory(attemptsByPuzzle);
    } catch (error) {
      console.error("Error fetching FSRS history:", error);
    }
  };

  // Submit FSRS attempt
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puzzle_id: puzzleId,
          player_username: username,
          tries_count: triesCount,
          hint_used: hintUsed,
          solved: solved,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `FSRS attempt submission failed with status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("FSRS response data:", data); // Add logging to see the exact response

    // Update FSRS history with the new status
    setPuzzleAttemptHistory((prev) => ({
      ...prev,
      [puzzleId]: {
        ...data.fsrs_status,
        last_attempted: new Date().toISOString(),
        attempts_count: (prev[puzzleId]?.attempts_count || 0) + 1,
      },
    }));

    // Create a safe version of the daily progress with defaults
    if (data.daily_progress) {
      const safeProgress = {
        new_puzzles_seen: data.daily_progress.new_puzzles_seen || 0,
        reviews_done: data.daily_progress.reviews_done || 0,
        total_done: data.daily_progress.total_done || 0,
        new_remaining: data.daily_progress.new_remaining || 0,
        reviews_remaining: data.daily_progress.reviews_remaining || 0,
        total_remaining: data.daily_progress.total_remaining || 0,
        new_limit: data.daily_progress.new_limit || 25,
        total_limit: data.daily_progress.total_limit || 50
      };
      
      // Update daily progress with safe values
      setDailyProgress(safeProgress);
    }

    return data;
  } catch (error) {
    console.error("Error submitting FSRS attempt:", error);
    return null;
  }
};

  // Reset daily progress
  // REMOVE FOR PRODUCTION: Reset daily progress function
  // This function is only for development/testing and should be removed before production
  const resetDailyProgress = async () => {
    setResetInProgress(true);

    try {
      const response = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/reset-daily-progress/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Reset daily progress failed with status: ${response.status}`
        );
      }

      // Refresh puzzles and progress
      await fetchDailyPuzzles();
    } catch (error) {
      console.error("Error resetting daily progress:", error);
      setError("Failed to reset daily progress. Please try again later.");
    } finally {
      setResetInProgress(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDailyPuzzles();
    fetchFSRSAttemptHistory();
  }, []);

  // Handle puzzle solved
  const handlePuzzleSolved = (triesCount = 0, hintUsed = false) => {
    if (currentPuzzle) {
      submitFSRSAttempt(currentPuzzle.id, triesCount, hintUsed, true);
    }
  };

  // Go to next puzzle
  const handleNextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      // Go to next puzzle in current set
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    } else {
      // Fetch more puzzles if available
      fetchDailyPuzzles();
    }
  };

  // Go to previous puzzle
  const handlePrevPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(currentPuzzleIndex - 1);
    }
  };

  // Show loading state
  if (loading && puzzles.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Daily Puzzles</h2>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-500">Loading puzzles...</span>
        </div>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Daily Puzzles</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p>{error}</p>
          <Button
            onClick={fetchDailyPuzzles}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No more puzzles available
  if (noMorePuzzles || (!loading && (!puzzles.length || !currentPuzzle))) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Daily Puzzles</h2>
        <Card>
          <CardHeader>
            <CardTitle>No More Puzzles Available</CardTitle>
            <CardDescription>
              You've completed your daily puzzle quota or there are no puzzles
              available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyProgress && (
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Today's Progress</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">New Puzzles</p>
                      <p className="text-lg font-medium">
                        {dailyProgress.new_puzzles_seen} /{" "}
                        {dailyProgress.new_limit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Reviews</p>
                      <p className="text-lg font-medium">
                        {dailyProgress.reviews_done} /{" "}
                        {dailyProgress.total_limit - dailyProgress.new_limit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Puzzles</p>
                      <p className="text-lg font-medium">
                        {dailyProgress.total_done} / {dailyProgress.total_limit}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={resetDailyProgress}
                    disabled={resetInProgress}
                    className="flex items-center"
                  >
                    {resetInProgress ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Reset Daily Progress
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if the current puzzle is new or review
  const isNewPuzzle = currentPuzzle?.is_new;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base flex items-center">
                    {isNewPuzzle ? (
                      <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full mr-2">
                        New
                      </span>
                    ) : (
                      <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-0.5 rounded-full mr-2">
                        Review
                      </span>
                    )}
                    Puzzle #{currentPuzzle.id.substring(0, 8)}...
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Rating:{" "}
                    <span className="font-medium">{currentPuzzle.rating}</span>
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

                  <div className="flex flex-wrap items-center mt-2 gap-1">
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
                    disabled={loading || currentPuzzleIndex === 0}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ChevronLeft size={16} />
                    )}
                  </Button>
                  <Button
                    onClick={handleNextPuzzle}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 py-4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-500">Loading puzzle...</span>
                </div>
              ) : (
                <ChessPuzzle
                  puzzle={currentPuzzle}
                  onSolve={(triesCount, hintUsed) =>
                    handlePuzzleSolved(triesCount, hintUsed)
                  }
                  attemptHistory={puzzleAttemptHistory[currentPuzzle.id]}
                />
              )}
            </CardContent>

            <CardFooter className="px-4 py-3 bg-black bg-opacity-5 flex justify-between">
              <span className="text-sm text-muted-foreground">
                Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
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
        </div>

        <div>
          {/* Daily Progress Card */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Award size={18} className="mr-2 text-yellow-500" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyProgress && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 rounded p-2">
                      <p className="text-xs text-gray-400">New Puzzles</p>
                      <p className="text-lg font-medium">
                        {dailyProgress.new_puzzles_seen} /{" "}
                        {dailyProgress.new_limit}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (dailyProgress.new_puzzles_seen /
                                dailyProgress.new_limit) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded p-2">
                      <p className="text-xs text-gray-400">Reviews</p>
                      <p className="text-lg font-medium">
                        {dailyProgress.reviews_done} /{" "}
                        {dailyProgress.total_limit - dailyProgress.new_limit}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (dailyProgress.reviews_done /
                                (dailyProgress.total_limit -
                                  dailyProgress.new_limit)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Progress</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        {dailyProgress.total_done} / {dailyProgress.total_limit}{" "}
                        puzzles
                      </span>
                      <span>
                        {Math.round(
                          (dailyProgress.total_done /
                            dailyProgress.total_limit) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-purple-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            (dailyProgress.total_done /
                              dailyProgress.total_limit) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <Button
                    onClick={resetDailyProgress}
                    variant="outline"
                    size="sm"
                    disabled={resetInProgress}
                    className="w-full mt-2"
                  >
                    {resetInProgress ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Reset Daily Progress
                  </Button>
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
}
