import { useState } from "react";
import { useGames } from "@/lib/hooks/use-games";
import { useLibraryValue } from "@/lib/hooks/use-library-value";

type Game = {
  appId: number;
  name: string;
  headerImageUrl: string | null;
};

const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
};

const getVerticalCapsuleUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;

const getHeaderUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;

export const GamesLibrary = () => {
  const { data: games, isLoading, error } = useGames();
  const { data: libraryValue } = useLibraryValue();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium">Failed to load games</p>
        <p className="text-muted-foreground">
          There was an error loading your library.
        </p>
      </div>
    );
  }

  if (!games || games.length === 0) {
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
      {libraryValue && libraryValue.gamesWithPrice > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Library Value</p>
          <p className="text-3xl font-semibold tracking-tight">
            {formatPrice(libraryValue.totalInitial)}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-light tracking-tight">Games</h1>
        <p className="text-muted-foreground">
          Your Steam library with {games.length} games ready to share with
          friends.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {games.map((ownedGame) => (
          <GameCard key={ownedGame.appId} game={ownedGame.game} />
        ))}
      </div>
    </div>
  );
};

const getSteamStoreUrl = (appId: number) =>
  `https://store.steampowered.com/app/${appId}`;

const GameCard = ({ game }: { game: Game }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <a
      href={getSteamStoreUrl(game.appId)}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden"
    >
      <div className="aspect-2/3 overflow-hidden bg-card border rounded-sm">
        <img
          src={
            imageError
              ? getHeaderUrl(game.appId)
              : getVerticalCapsuleUrl(game.appId)
          }
          alt={game.name}
          className="size-full object-cover group-hover:scale-102 transition-transform duration-150"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-sm font-medium text-white">{game.name}</p>
      </div>
    </a>
  );
};
