"use client";

import { TrendingUp, TrendingDown, Search, UserPlus, X } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Interface for the API response
interface GameData {
  game_id: string;
  rating: number;
  date: string;
  result: string;
  // ... other fields
}

interface RatingHistoryResponse {
  username: string;
  total_games: number;
  min_rating: number;
  max_rating: number;
  games: GameData[];
  available_time_classes: string[];
  available_years: { year: string; games: number }[];
}

// Interface for processed chart data
interface ChartDataPoint {
  gameNumber: string;
  date: string;
  [key: string]: string | number; // Allow dynamic player rating fields
}

// Interface for player data
interface PlayerData {
  username: string;
  color: string;
  totalGames: number;
  minRating: number;
  maxRating: number;
  initialRating: number;
  finalRating: number;
  change: number;
}

// Chart colors for different players
const PLAYER_COLORS = [
  "hsl(221.2 83.2% 53.3%)", // Blue
  "hsl(346.8 77.2% 49.8%)", // Red
  "hsl(142.1 76.2% 36.3%)", // Green
  "hsl(35.5 91.7% 54.3%)",  // Orange
  "hsl(262.1 83.3% 57.8%)", // Purple
  "hsl(191, 91%, 36.5%)",   // Cyan
];

const createChartConfig = (players: PlayerData[]) => {
  const config: ChartConfig = {};
  
  players.forEach((player, index) => {
    config[player.username] = {
      label: player.username,
      color: player.color,
    };
  });
  
  return config as ChartConfig;
};

// Function to calculate custom Y-axis ticks based on player rating range
const getCustomTicks = (min: number, max: number) => {
  // Define our standard tick values
  const standardTicks = [500, 800, 1000, 1200, 1500, 2000];

  // Find ticks that are relevant to this player's rating range
  // Include ticks that are below min (for visual context) and up to slightly above max
  return standardTicks.filter(
    (tick) =>
      tick >= Math.min(min, 500) && // Always include at least the 500 tick if player is that low
      tick <= Math.min(max + 200, max < 1500 ? 1500 : 2000) // Show next major milestone above max
  );
};

// Format game number for display based on screen size
const formatGameNumber = (gameNumber: string, screenIsMobile: boolean) => {
  if (!screenIsMobile) return gameNumber; // Keep "Game X" format for desktop

  // Extract just the number for mobile
  const match = gameNumber.match(/\d+/);
  return match ? match[0] : gameNumber;
};

// Generate appropriate tick values for x-axis based on total games and screen size
const getXAxisTicks = (totalGames: number, screenIsMobile: boolean) => {
  if (totalGames <= 10) {
    // For few games, show all
    return Array.from({ length: totalGames }, (_, i) => `Game ${i + 1}`);
  }

  // For mobile with many games, use nice round numbers
  if (screenIsMobile) {
    const increments: string[] = [];

    // Determine appropriate step size based on total games
    let stepSize = 0;
    if (totalGames <= 100) stepSize = 10;
    else if (totalGames <= 500) stepSize = 50;
    else if (totalGames <= 1000) stepSize = 100;
    else if (totalGames <= 2000) stepSize = 250;
    else stepSize = 500;

    // Start from 1 (first game)
    increments.push("Game 1");

    // Then add nice round numbers
    for (let i = stepSize; i <= totalGames; i += stepSize) {
      increments.push(`Game ${i}`);
    }

    // Always include the last game if it's not already included
    if (totalGames % stepSize !== 0 && totalGames > stepSize) {
      increments.push(`Game ${totalGames}`);
    }

    return increments;
  }

  // For desktop with many games, use more ticks but still limited
  const desktopStepSize = Math.max(1, Math.floor(totalGames / 10));
  const ticks: string[] = [];
  for (let i = 1; i <= totalGames; i += desktopStepSize) {
    ticks.push(`Game ${i}`);
  }
  // Always include the last game
  if (ticks[ticks.length - 1] !== `Game ${totalGames}`) {
    ticks.push(`Game ${totalGames}`);
  }
  return ticks;
};

export function Component() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [fetchStatus, setFetchStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Players data array to hold multiple players
  const [players, setPlayers] = useState<PlayerData[]>([]);
  
  // Form states for adding players
  const [username, setUsername] = useState("kalel1130");
  const [timeClass, setTimeClass] = useState("rapid");
  const [fetched, setFetched] = useState(false);
  
  // Current player being searched
  const [currentPlayer, setCurrentPlayer] = useState<string>("");
  
  // Chart configuration
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

  // Modified fetchRatingHistory function
  const fetchRatingHistory = async (username: string, timeClass: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setFetchStatus("Checking database...");

      // Step 1: First check if we can get the rating history directly
      // (this will work if the user exists in our database)
      const ratingResponse = await fetch(
        `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/rating-history/?time_class=${timeClass}`
      );

      // If player exists in the database
      if (ratingResponse.ok) {
        const data = await ratingResponse.json();

        // Step 2: Check if there are any new games to fetch for existing player
        setFetchStatus("Checking for new games...");
        const scrapeResponse = await fetch(
          `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/scrape-games/?only_new=true`
        );

        if (scrapeResponse.ok) {
          // If new games were found, refresh the data
          setFetchStatus("New games found, updating...");
          const refreshResponse = await fetch(
            `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/rating-history/?time_class=${timeClass}`
          );

          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            processApiResponse(refreshedData);
          } else {
            // Use the original data if refresh fails
            processApiResponse(data);
          }
        } else {
          // No new games or error fetching new games, use existing data
          processApiResponse(data);
        }
      } else {
        // Player not found in our database, try to scrape all games
        setFetchStatus(
          "Player not found in database. Fetching from Chess.com... Get a coffee 😊 it might take 2 mins."
        );

        const scrapeAllResponse = await fetch(
          `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/scrape-games/`
        );

        if (!scrapeAllResponse.ok) {
          // If scraping fails, the username probably doesn't exist on Chess.com
          const errorText = await scrapeAllResponse.text();
          throw new Error(
            `Username "${username}" not found on Chess.com. Please check the spelling.`
          );
        }

        // Successfully scraped data, now get the rating history
        setFetchStatus("Data obtained! Generating rating history...");
        const newDataResponse = await fetch(
          `https://chess-elo-api-kalel1130.pythonanywhere.com/api/player/${username}/rating-history/?time_class=${timeClass}`
        );

        if (!newDataResponse.ok) {
          throw new Error(
            `Failed to generate rating history after importing data.`
          );
        }

        const newData = await newDataResponse.json();
        processApiResponse(newData);
      }
    } catch (err) {
      setError(`${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setFetchStatus("");
    }
  };

  // Process API response data
  const processApiResponse = (data: RatingHistoryResponse) => {
    // Calculate stats for this player
    const validRatings = data.games.map((game) => game.rating);
    const initialRating = validRatings.length > 0 ? validRatings[0] : 0;
    const finalRating = validRatings.length > 0 ? validRatings[validRatings.length - 1] : 0;
    
    // Get a color for this player
    const playerIndex = players.findIndex(p => p.username === data.username);
    const colorIndex = playerIndex >= 0 ? playerIndex : players.length;
    const playerColor = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

    // Create player stats object
    const playerStats: PlayerData = {
      username: data.username,
      color: playerColor,
      totalGames: data.total_games,
      minRating: data.min_rating,
      maxRating: data.max_rating,
      initialRating,
      finalRating,
      change: finalRating - initialRating,
    };

    // Update or add the player to the players array
    if (playerIndex >= 0) {
      // Update existing player
      const updatedPlayers = [...players];
      updatedPlayers[playerIndex] = playerStats;
      setPlayers(updatedPlayers);
    } else {
      // Add new player
      setPlayers([...players, playerStats]);
    }
    
    // Set current player being viewed
    setCurrentPlayer(data.username);

    // Update chart data with the new player's data
    const newPlayerData = data.games.map((game, index) => {
      return {
        gameNumber: `Game ${index + 1}`,
        date: formatDateString(game.date),
        [data.username]: game.rating
      };
    });
    
    if (players.length === 0 && playerIndex === -1) {
      // First player, set the chart data directly
      setChartData(newPlayerData);
    } else {
      // Merge with existing chart data 
      // (this is a simplified approach - a more complex algorithm would align game numbers)
      const maxGames = Math.max(
        chartData.length,
        newPlayerData.length
      );
      
      const mergedData: ChartDataPoint[] = [];
      
      for (let i = 0; i < maxGames; i++) {
        const existingPoint = i < chartData.length ? chartData[i] : { 
          gameNumber: `Game ${i + 1}`, 
          date: i < newPlayerData.length ? newPlayerData[i].date : "" 
        };
        
        const newPoint = i < newPlayerData.length ? newPlayerData[i] : null;
        
        if (newPoint) {
          mergedData.push({
            ...existingPoint,
            [data.username]: newPoint[data.username]
          });
        } else {
          mergedData.push(existingPoint);
        }
      }
      
      setChartData(mergedData);
    }
    
    // Update chart config with all players
    const updatedPlayers = playerIndex >= 0 
      ? players.map((p, i) => i === playerIndex ? playerStats : p)
      : [...players, playerStats];
      
    setChartConfig(createChartConfig(updatedPlayers));
    
    setFetched(true);
  };

  useEffect(() => {
    if (username) {
      fetchRatingHistory(username, timeClass);
    }
  }, []);

  // Add a new player to the comparison
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      setError(null);
      fetchRatingHistory(username, timeClass);
    }
  };
  
  // Submit the first player (or replacing the only player)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      // Clear existing players and chart data
      setPlayers([]);
      setChartData([]);
      setError(null);
      fetchRatingHistory(username, timeClass);
    }
  };
  
  // Remove a player from the comparison
  const handleRemovePlayer = (playerToRemove: string) => {
    // Filter out the player to remove
    const updatedPlayers = players.filter(p => p.username !== playerToRemove);
    setPlayers(updatedPlayers);
    
    // Update chart data by removing this player's data
    const updatedChartData = chartData.map(point => {
      const newPoint = { ...point };
      delete newPoint[playerToRemove];
      return newPoint;
    });
    
    setChartData(updatedChartData);
    setChartConfig(createChartConfig(updatedPlayers));
    
    // If all players are removed, reset the chart
    if (updatedPlayers.length === 0) {
      setFetched(false);
    }
  };

  // Format date for display
  const formatDateString = (dateString: string) => {
    try {
      // Try to parse as ISO date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, "MMM dd");
      }

      // Return as is if we can't parse it
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  // Get custom ticks for the Y axis based on all players' rating ranges
  const customTicks = getCustomTicks(
    players.length > 0 ? Math.min(...players.map(p => p.minRating)) : 0,
    players.length > 0 ? Math.max(...players.map(p => p.maxRating)) : 0
  );
  
  // Get the min and max values for more precise domain control
  const minRating = players.length > 0 ? Math.min(...players.map(p => p.minRating)) : 0;
  const maxRating = players.length > 0 ? Math.max(...players.map(p => p.maxRating)) : 0;
  
  // Calculate chart domain with some padding
  const chartDomain = players.length > 0 
    ? [Math.max(0, minRating - 50), maxRating + 50]
    : [0, 0];

  // Check if we're on a mobile screen (width < 768px)
  const [screenIsMobile, setScreenIsMobile] = useState(false);

  useEffect(() => {
    // Set initial value
    setScreenIsMobile(window.innerWidth < 768);

    // Add resize listener
    const handleResize = () => {
      setScreenIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-2">
      {/* User selection form */}
      <Card className="overflow-hidden">
        <CardHeader className="py-0 px-4">
          <CardTitle className="text-base">Player Selection</CardTitle>
          <CardDescription className="text-xs mt-0">
            Enter a Chess.com username to view rating history
          </CardDescription>
        </CardHeader>
        <CardContent className="py-1 px-4">
          <div className="space-y-2">
            {/* Main player search form */}
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="text-xs font-medium">
                  Chess.com Username
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full mt-1 px-2 py-1 text-sm border rounded-md bg-background border-input"
                    placeholder="Enter Chess.com username"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-medium">
                  Time Class
                  <select
                    value={timeClass}
                    onChange={(e) => setTimeClass(e.target.value)}
                    className="block w-full mt-1 px-2 py-1 text-sm border rounded-md bg-background border-input"
                  >
                    <option value="rapid">Rapid</option>
                    <option value="blitz">Blitz</option>
                    <option value="bullet">Bullet</option>
                    <option value="daily">Daily</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md flex items-center space-x-1 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Search'}
                {!isLoading && <Search className="h-3 w-3 ml-1" />}
              </button>
              
              {players.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md flex items-center space-x-1 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-1 transition-colors"
                  disabled={isLoading}
                >
                  Add Player
                  <UserPlus className="h-3 w-3 ml-1" />
                </button>
              )}
            </form>
            
            {/* Player chips for active comparisons */}
            {players.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {players.map((player) => (
                  <div 
                    key={player.username}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: `${player.color}20`, 
                      borderColor: player.color,
                      borderWidth: '1px',
                      color: player.color 
                    }}
                  >
                    <span className="font-medium">{player.username}</span>
                    <button
                      onClick={() => handleRemovePlayer(player.username)}
                      className="p-0.5 rounded-full hover:bg-black/10"
                      aria-label={`Remove ${player.username}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rating chart */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 pb-1">
          <CardTitle className="text-base">
            Chess Rating History
            {players.length === 1 && ` - ${players[0].username}`}
            {players.length > 1 && ` - Multiple Players Comparison`}
          </CardTitle>
          <CardDescription className="text-xs mt-0">
            {timeClass.charAt(0).toUpperCase() + timeClass.slice(1)} games
            rating progression
            {players.length > 1 && ` - ${players.length} players`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 px-3">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-[250px]">
              <div className="text-muted-foreground text-sm mb-2">
                {fetchStatus || 'Loading rating data...'}
              </div>
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[250px] text-red-500 text-sm">
              {error}
            </div>
          ) : chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="min-h-[200px] w-full max-h-[600px]"
            >
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 15,
                    left: 15,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    // Only show horizontal lines at our specific y-values
                    horizontalCoordinatesGenerator={(props) => {
                      const { yAxis, width } = props;
                      return customTicks.map((tick) => yAxis.scale(tick));
                    }}
                    stroke="var(--color-grid)"
                  />
                  <XAxis
                    dataKey="gameNumber"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    // Use custom formatting and ticks for mobile
                    tickFormatter={(value) =>
                      formatGameNumber(value, screenIsMobile)
                    }
                    ticks={getXAxisTicks(chartData.length, screenIsMobile)}
                    angle={screenIsMobile ? -45 : 0}
                    textAnchor={screenIsMobile ? "end" : "middle"}
                    height={screenIsMobile ? 60 : 30}
                    tick={{ fill: "var(--color-text)" }}
                  />
                  <YAxis
                    width={40}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    // Use custom ticks for specific values
                    ticks={customTicks}
                    // Set domain to include a better range for all players
                    domain={chartDomain}
                    tick={{ fill: "var(--color-text)" }}
                  />
                  {/* Custom tooltip to show all players' ratings */}
                  <ChartTooltip
                    cursor={{
                      stroke: 'rgba(255, 255, 255, 0.5)',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
                    content={(props) => {
                      if (!props.active || !props.payload || props.payload.length === 0) {
                        return null;
                      }
                      
                      // Get the date from the first series
                      const gameLabel = props.payload[0].payload.gameNumber;
                      const dateLabel = props.payload[0].payload.date;
                      
                      return (
                        <div className="p-2 rounded-md border shadow-md bg-background text-foreground text-sm">
                          <div className="font-medium pb-1 mb-1 border-b">
                            {gameLabel} - {dateLabel}
                          </div>
                          <div className="space-y-1">
                            {players.map((player) => {
                              // Find this player's rating for the current point
                              const value = props.payload.find(
                                (p) => p.dataKey === player.username
                              )?.value;
                              
                              return (
                                <div 
                                  key={player.username} 
                                  className="flex items-center gap-1.5"
                                >
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: player.color }}
                                  />
                                  <span className="font-medium" style={{ color: player.color }}>
                                    {player.username}
                                  </span>
                                  <span className="ml-auto">
                                    {value !== undefined ? value : 'n/a'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  
                  {/* Render an area for each player */}
                  {players.map((player) => (
                    <Area
                      key={player.username}
                      dataKey={player.username}
                      type="monotone"
                      name={player.username}
                      fill={player.color}
                      fillOpacity={0.3}
                      stroke={player.color}
                      strokeWidth={1.5}
                      activeDot={{ 
                        stroke: player.color, 
                        strokeWidth: 1, 
                        r: 4, 
                        fill: player.color 
                      }}
                      connectNulls={true}
                    />
                  ))}
                  
                  {/* Custom Legend for multiple players */}
                  {players.length > 1 && (
                    <Legend 
                      verticalAlign="top"
                      height={30}
                      iconType="line"
                      iconSize={14}
                      wrapperStyle={{ 
                        fontSize: '12px',
                        paddingTop: '8px' 
                      }}
                      formatter={(value, entry) => {
                        const player = players.find(p => p.username === value);
                        if (!player) return value;
                        
                        return (
                          <span style={{ color: player.color, marginRight: '8px' }}>
                            {value}
                          </span>
                        );
                      }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex justify-center items-center h-[250px] text-muted-foreground text-sm">
              No rating data available
            </div>
          )}
        </CardContent>
        {fetched && !isLoading && !error && chartData.length > 0 && (
          <CardFooter className="pt-1 pb-3 px-4 mt-0">
            <div className="flex flex-col w-full gap-2 text-xs text-foreground">
              {players.map((player) => (
                <div key={player.username} className="flex w-full items-start gap-1">
                  <div className="grid gap-0.5 w-full">
                    <div className="flex items-center gap-1 font-medium leading-none">
                      <span style={{ color: player.color }}>{player.username}:</span> 
                      {player.change >= 0 ? (
                        <span>
                          Rating increase since first game: <span className="text-green-500 font-medium">+{player.change} points</span> <TrendingUp className="h-3 w-3 inline text-green-500" />
                        </span>
                      ) : (
                        <span>
                          Rating decrease since first game: <span className="text-red-500 font-medium">{player.change} points</span> <TrendingDown className="h-3 w-3 inline text-red-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 leading-none text-muted-foreground">
                      Range: <span style={{ color: player.color }}>{player.minRating} - {player.maxRating}</span> •
                      Total games: {player.totalGames}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
