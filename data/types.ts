// Types for chess puzzles

export type PlayerColor = "white" | "black";

export interface PuzzleMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface ChessPuzzleData {
  id: string;
  playerColor: PlayerColor;
  startFEN: string;
  opponentMove: PuzzleMove;
  solution: PuzzleMove[];
  rating: string;
  themes: string[];
  gameUrl: string;
}

export interface PuzzlesData {
  puzzles: ChessPuzzleData[];
}