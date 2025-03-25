"use client";

import { TrendingUp, TrendingDown, Search } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
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
  rating: number;
}

const chartConfig = {
  rating: {
    label: "Rating",
    color: "hsl(221.2 83.2% 53.3%)",
  },
} satisfies ChartConfig;

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
  // Add this to your component state
  const [fetchStatus, setFetchStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState({
    username: "",
    totalGames: 0,
    minRating: 0,
    maxRating: 0,
    initialRating: 0,
    finalRating: 0,
    change: 0,
  });
  const [username, setUsername] = useState("kalel1130");
  const [timeClass, setTimeClass] = useState("rapid");
  const [fetched, setFetched] = useState(false);

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
    // Transform games array to chart data points
    const processedData = data.games.map((game, index) => ({
      gameNumber: `Game ${index + 1}`,
      date: formatDateString(game.date),
      rating: game.rating,
    }));

    setChartData(processedData);

    // Calculate stats
    const validRatings = data.games.map((game) => game.rating);
    const initialRating = validRatings.length > 0 ? validRatings[0] : 0;
    const finalRating =
      validRatings.length > 0 ? validRatings[validRatings.length - 1] : 0;

    setPlayerStats({
      username: data.username,
      totalGames: data.total_games,
      minRating: data.min_rating,
      maxRating: data.max_rating,
      initialRating,
      finalRating,
      change: finalRating - initialRating,
    });

    setFetched(true);
  };

  useEffect(() => {
    if (username) {
      fetchRatingHistory(username, timeClass);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      setError(null);
      fetchRatingHistory(username, timeClass);
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

  const isPositiveChange = playerStats.change >= 0;

  // Get custom ticks for the Y axis based on player's rating range
  const customTicks = getCustomTicks(
    playerStats.minRating,
    playerStats.maxRating
  );

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
          </form>
        </CardContent>
      </Card>

      {/* Rating chart */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 pb-1">
          <CardTitle className="text-base">
            Chess Rating History
            {playerStats.username && ` - ${playerStats.username}`}
          </CardTitle>
          <CardDescription className="text-xs mt-0">
            {timeClass.charAt(0).toUpperCase() + timeClass.slice(1)} games
            rating progression
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
                    // Set domain to include a small buffer above and below
                    domain={[
                      customTicks[0] - 50,
                      customTicks[customTicks.length - 1] + 50,
                    ]}
                    tick={{ fill: "var(--color-text)" }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(label) => {
                          const dataPoint = chartData.find(
                            (item) => item.gameNumber === label
                          );
                          return dataPoint
                            ? `${label} - ${dataPoint.date}`
                            : label;
                        }}
                      />
                    }
                  />
                  <Area
                    dataKey="rating"
                    type="monotone"
                    fill="hsl(221.2 83.2% 53.3%)"
                    fillOpacity={0.4}
                    stroke="hsl(221.2 83.2% 53.3%)"
                    strokeWidth={2}
                  />
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
            <div className="flex w-full items-start gap-1 text-xs">
              <div className="grid gap-1">
                <div className="flex items-center gap-1 font-medium leading-none">
                  {isPositiveChange ? (
                    <>
                      Rating increase since first game: +{playerStats.change}{" "}
                      points <TrendingUp className="h-3 w-3 text-green-500" />
                    </>
                  ) : (
                    <>
                      Rating decrease since first game: {playerStats.change}{" "}
                      points <TrendingDown className="h-3 w-3 text-red-500" />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 leading-none text-muted-foreground">
                  Range: {playerStats.minRating} - {playerStats.maxRating} •
                  Total games: {playerStats.totalGames}
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
