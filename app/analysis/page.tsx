"use client";

import { useState, useEffect } from "react";
import { ChessPuzzle } from "@/components/ui/ChessPuzzle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Award, BookOpen, ExternalLink } from "lucide-react";
// Import with type assertion
import puzzlesData from "@/data/puzzles.json";
import { ChessPuzzleData, PuzzlesData } from "@/data/types";

export default function AnalysisPage() {
  const [puzzles, setPuzzles] = useState<ChessPuzzleData[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<Set<string>>(new Set<string>());
  const [loading, setLoading] = useState(true);
  
  const currentPuzzle = puzzles[currentPuzzleIndex];
  
  // Load puzzles from the JSON file
  useEffect(() => {
    const fetchPuzzles = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from an API
        // For now, we're using the imported puzzles data
        // Use type assertion for the JSON import
        const typedPuzzlesData = puzzlesData as PuzzlesData;
        setPuzzles(typedPuzzlesData.puzzles);
        
        // Load solved puzzles from localStorage
        const savedSolved = localStorage.getItem('solvedPuzzles');
        if (savedSolved) {
          try {
            const solvedIds = new Set<string>(JSON.parse(savedSolved));
            setSolvedPuzzleIds(solvedIds);
            setPuzzlesSolved(solvedIds.size);
          } catch (e) {
            console.error("Error parsing saved puzzles:", e);
          }
        }
      } catch (error) {
        console.error("Error loading puzzles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPuzzles();
  }, []);
  
  const handlePuzzleSolved = () => {
    if (currentPuzzle && !solvedPuzzleIds.has(currentPuzzle.id)) {
      // Only count puzzles solved for the first time
      const updatedSolved = new Set<string>([...solvedPuzzleIds, currentPuzzle.id]);
      setSolvedPuzzleIds(updatedSolved);
      setPuzzlesSolved(updatedSolved.size);
      
      // Save to localStorage
      localStorage.setItem('solvedPuzzles', JSON.stringify(Array.from(updatedSolved)));
    }
  };
  
  const handleNextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    } else {
      setCurrentPuzzleIndex(0); // Wrap around to the first puzzle
    }
  };
  
  const handlePrevPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(currentPuzzleIndex - 1);
    } else {
      setCurrentPuzzleIndex(puzzles.length - 1); // Wrap around to the last puzzle
    }
  };
  
  if (loading || puzzles.length === 0 || !currentPuzzle) {
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
  
  return (
    <div className="container mx-auto py-6 px-4">
      <h2 className="text-xl font-bold mb-4">Chess Puzzles</h2>
      <p className="text-gray-500 mb-4">
        Improve your skills by solving puzzles from your games
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Puzzle #{currentPuzzle.id}</CardTitle>
                  <CardDescription className="mt-1">
                    Rating: <span className="font-medium">{currentPuzzle.rating}</span>
                  </CardDescription>
                  <div className="flex items-center mt-1 space-x-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-500 bg-opacity-20 text-blue-500 rounded-full">
                      Playing as {currentPuzzle.playerColor}
                    </span>
                    {currentPuzzle.themes.map(theme => (
                      <span 
                        key={theme} 
                        className="text-xs px-2 py-0.5 bg-purple-500 bg-opacity-20 text-purple-500 rounded-full"
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
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button 
                    onClick={handleNextPuzzle} 
                    variant="outline" 
                    size="sm"
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-4 py-4">
              <ChessPuzzle 
                puzzle={currentPuzzle} 
                onSolve={handlePuzzleSolved}
              />
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
                View original game <ExternalLink size={14} className="ml-1" />
              </a>
            </CardFooter>
          </Card>
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
                  <span className="font-medium">{puzzlesSolved} of {puzzles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Rating:</span>
                  <span className="font-medium">{currentPuzzle.rating}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${(puzzlesSolved / puzzles.length) * 100}%` }}
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
                  <span className="inline-block bg-blue-500 bg-opacity-20 text-blue-500 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                  Watch the opponent's move
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-blue-500 bg-opacity-20 text-blue-500 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                  Find the best response
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-blue-500 bg-opacity-20 text-blue-500 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                  Drag and drop pieces to make your move
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-blue-500 bg-opacity-20 text-blue-500 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">4</span>
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
                {currentPuzzle.themes.map(theme => (
                  <div 
                    key={theme}
                    className="px-3 py-1 bg-purple-500 bg-opacity-10 text-purple-500 rounded-full text-sm"
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