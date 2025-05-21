// chess-elo-frontend/data/types.ts

export type PlayerColor = "white" | "black";

export interface PuzzleMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface ChessPuzzleData {
  id: string;
  player_username: string;
  opponent_username: string;
  game_date: string;
  playerColor: PlayerColor;
  startFEN: string;
  opponentMove: PuzzleMove;
  solution: PuzzleMove[];
  rating: string;
  themes: string[];
  gameUrl: string;
  is_new?: boolean; // Added for daily puzzles
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
  is_new?: boolean; // Added for daily puzzles
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

export interface FSRSStatus {
  difficulty: number;
  stability: number;
  retrievability: number;
  next_review_date: string;
  last_attempted?: string;
  attempts_count?: number;
}

export interface DailyProgress {
  new_puzzles_seen: number;
  reviews_done: number;
  total_done: number;
  new_remaining: number;
  reviews_remaining: number;
  total_remaining: number;
  new_limit: number;
  total_limit: number;
}

export interface DailyPuzzlesResponse {
  username: string;
  progress: DailyProgress;
  puzzles_count: number;
  puzzles: ApiPuzzle[];
}