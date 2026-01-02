import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkSteamAccountCard } from "@/components/link-steam-account-card";
import { GamesLibrary } from "@/components/games-library";
import { signOut } from "@/lib/auth";
import { apiClient } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type DashboardScreenProps = {
  user: User;
};

export const DashboardScreen = ({ user }: DashboardScreenProps) => {
  const [hasSteamAccount, setHasSteamAccount] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSteamAccount = async () => {
      try {
        const accounts = await apiClient.steam.linkedAccounts();
        setHasSteamAccount(accounts.length > 0);
      } catch (error) {
        console.error("Failed to check Steam accounts:", error);
        setHasSteamAccount(false);
      }
    };

    checkSteamAccount();
  }, []);

  const handleSignOut = () => {
    signOut();
  };

  if (hasSteamAccount === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasSteamAccount) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
        <div className="w-full max-w-sm">
          <LinkSteamAccountCard />
        </div>
        <div className="flex w-full max-w-sm items-center justify-between">
          <div className="flex items-center gap-2">
            {user.image && (
              <img
                src={user.image}
                alt={user.name}
                className="size-8 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-light">
                {user.name ? `Welcome, ${user.name}` : "Welcome"}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <p className="text-md font-medium tracking-tighter">Steamboat</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4">
        <GamesLibrary />
      </main>
    </div>
  );
};
