import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

type Game = {
  appId: number;
  name: string;
  headerImageUrl: string | null;
};

type OwnedGame = {
  steamAccountId: number;
  appId: number;
  playtimeForever: number | null;
  game: Game;
};

const getVerticalCapsuleUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;

const getHeaderUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;

export const GamesLibrary = () => {
  const [games, setGames] = useState<OwnedGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const result = await apiClient.library.myGames();
        setGames(result);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading your library...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium">No games found</p>
        <p className="text-muted-foreground">
          Your Steam library appears to be empty.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Games</h1>
        <p className="text-muted-foreground">
          Your Steam library with {games.length} games ready to share with friends.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {games.map((ownedGame) => (
          <GameCard key={ownedGame.appId} game={ownedGame.game} />
        ))}
      </div>
    </div>
  );
};

const GameCard = ({ game }: { game: Game }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card transition-transform hover:scale-105">
      <div className="aspect-[2/3]">
        <img
          src={imageError ? getHeaderUrl(game.appId) : getVerticalCapsuleUrl(game.appId)}
          alt={game.name}
          className="size-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-sm font-medium text-white">{game.name}</p>
      </div>
    </div>
  );
};
