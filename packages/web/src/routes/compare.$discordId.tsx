import { useState, useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth";
import { useCompare } from "@/lib/hooks/use-compare";

export const Route = createFileRoute("/compare/$discordId")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data?.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: ComparePage,
});

function ComparePage() {
  const { discordId } = Route.useParams();
  const { data, isLoading, error } = useCompare(discordId);
  const navigate = useNavigate();

  useEffect(() => {
    if (data && "isSelf" in data && data.isSelf) {
      navigate({ to: "/dashboard" });
    }
  }, [data, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (data && "isSelf" in data && data.isSelf) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  if (error || !data || !("found" in data) || !data.found) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium">User not found</p>
        <p className="text-muted-foreground">
          This user either doesn't exist or hasn't linked their Steam account.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <p className="text-md font-medium tracking-tighter">Steamboat</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-light tracking-tight">
              Games in Common
            </h1>
            <p className="text-muted-foreground">
              You share {data.sharedCount} games with this user.
            </p>
          </div>

          {data.sharedGames.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2">
              <p className="text-lg font-medium">No games in common</p>
              <p className="text-muted-foreground">
                You don't share any games with this user.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.sharedGames.map((ownedGame) => (
                <GameCard key={ownedGame.appId} game={ownedGame.game} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

type Game = {
  appId: number;
  name: string;
  headerImageUrl: string | null;
};

const getVerticalCapsuleUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;

const getHeaderUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;

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
