// chess-elo-frontend/data/types.ts

export type PlayerColor = "white" | "black";

export interface PuzzleMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface ChessPuzzleData {
  id: string;
  player_username?: string; // Optional to maintain backward compatibility
  opponent_username?: string; // Optional for backward compatibility
  game_date?: string; // Optional for backward compatibility
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

// API response types
export interface ApiPuzzle {
  id: string;
  player_username: string;
  opponent_username: string;
  game_date: string;
  player_color: string; // "white" or "black"
  start_fen: string;
  opponent_move_from: string;
  opponent_move_to: string;
  solution: PuzzleMove[];
  rating: number;
  themes: string[];
  game_url: string;
}

export interface ApiPagination {
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse {
  username: string;
  total_puzzles: number;
  displayed_puzzles: number;
  puzzles: ApiPuzzle[];
  pagination: ApiPagination;
}