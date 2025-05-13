This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## 
# Chess Puzzle Solver Implementation

This implementation adds a chess puzzle solving feature to the analysis page of your chess frontend app. Users can solve puzzles derived from their previous games to improve their tactical skills.

## Features

- Interactive chessboard for solving puzzles
- Multiple puzzles with different difficulty ratings
- Puzzle navigation system
- Hints and feedback on moves
- Progress tracking
- Theme tagging for puzzles
- Links to original games

## Installation Instructions

1. Install the required dependencies:

```bash
npm install react-chessboard chess.js
```

2. Add the `ChessPuzzle.tsx` component to your project:
   - Place it in `components/ui/ChessPuzzle.tsx`

3. Update your `app/analysis/page.tsx` with the new implementation

4. Ensure your project has the required UI components:
   - The implementation uses components from your existing UI library
   - All styling is compatible with your current Tailwind CSS setup

## API Integration

In a real application, you would want to:

1. Create an API endpoint to fetch puzzles based on the user's previous games
2. Implement puzzle generation from game analysis
3. Store and track user's puzzle solving progress

The current implementation uses sample puzzles, but the code is structured to easily support API integration:

```typescript
// Replace this function in the AnalysisPage component
const fetchPuzzles = async () => {
  setLoading(true);
  try {
    // Real API call to your backend
    const response = await fetch('/api/puzzles');
    const data = await response.json();
    setPuzzles(data);
  } catch (error) {
    console.error("Error fetching puzzles:", error);
  } finally {
    setLoading(false);
  }
};
```

## Puzzle Format

The implementation expects puzzles in the following format:

```javascript
{
  "PuzzleId": "custom001",
  "FEN": "r3k1r1/p1p2p1p/2p1q3/2P1P3/4n3/4P3/PP1N1PPP/R2Q1RK1 w q - 0 13",
  "Moves": "f3e4 d6e4",
  "Rating": "1100",
  "Themes": "capture tactical knight",
  "GameUrl": "https://www.chess.com/game/live/138299050862"
}
```

- `PuzzleId`: Unique identifier for the puzzle
- `FEN`: The chess position in Forsyth-Edwards Notation
- `Moves`: The sequence of moves that solve the puzzle (in algebraic notation)
- `Rating`: Difficulty rating of the puzzle
- `Themes`: Space-separated tags describing the puzzle
- `GameUrl`: Link to the original game

## Technical Details

The implementation uses:
- react-chessboard for the interactive chessboard
- chess.js for game logic and move validation
- Tailwind CSS for styling
- React hooks for state management
- Responsive design for both desktop and mobile

## Customization

You can customize:
- The appearance of the chessboard
- The puzzle difficulty and selection
- The feedback and hint system
- The integration with your backend APIs