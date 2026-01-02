import { useEffect, useState } from "react";
import { Gamepad, Lock } from "lucide-react";
import SteamIcon from "@/assets/steam.svg?react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";

type SteamAccount = {
  id: number;
  steamId: string;
  steamUsername: string;
  steamAvatar: string | null;
  profileUrl: string | null;
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const LinkSteamAccountCard = () => {
  const [steamAccounts, setSteamAccounts] = useState<SteamAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<number | null>(
    null,
  );

  const fetchSteamAccounts = async () => {
    try {
      const accounts = await apiClient.steam.linkedAccounts();
      setSteamAccounts(accounts);
    } catch (error) {
      console.error("Failed to fetch Steam accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSteamAccounts();
  }, []);

  const handleLinkSteam = () => {
    const linkUrl = new URL("/api/steam/link", apiBaseUrl);
    window.location.href = linkUrl.toString();
  };

  const handleUnlinkSteam = async (steamAccountId: number) => {
    setUnlinkingAccountId(steamAccountId);
    try {
      const result = await apiClient.steam.unlink({ steamAccountId });
      if (result.success) {
        setSteamAccounts((previous) =>
          previous.filter((account) => account.id !== steamAccountId),
        );
      }
    } catch (error) {
      console.error("Failed to unlink Steam account:", error);
    } finally {
      setUnlinkingAccountId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <CardDescription>Loading...</CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (steamAccounts.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>Your connected Steam accounts</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {steamAccounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                {account.steamAvatar && (
                  <img
                    src={account.steamAvatar}
                    alt={account.steamUsername}
                    className="size-10 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {account.steamUsername}
                  </CardTitle>
                  <CardDescription>{account.steamId}</CardDescription>
                </div>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkSteam(account.id)}
                    disabled={unlinkingAccountId === account.id}
                  >
                    {unlinkingAccountId === account.id ? "..." : "Unlink"}
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLinkSteam}
          >
            Link Another Account
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="gap-8">
      <CardContent className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="relative w-fit">
            <div className="flex size-12 p-2 items-center justify-center rounded-full bg-white/10">
              <SteamIcon className="fill-white" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl">Link your Steam Account</CardTitle>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="h-fit aspect-square bg-white/10 p-1.5 rounded-sm">
              <Gamepad className="text-white/50" size={16} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-light">Source games</p>
              <p className="text-sm text-muted-foreground">
                We use the official Steam API to source your games, and Steam
                profile information.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-fit aspect-square bg-white/10 p-1.5 rounded-sm">
              <Lock className="text-white/50" size={16} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-light">Your data is yours</p>
              <p className="text-sm text-muted-foreground">
                We only store data for necessary functionality, and remove it
                with your account.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full" onClick={handleLinkSteam}>
          Authenticate
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          By selecting "Authenticate" you agree to our{" "}
          <a href="/terms" className="underline">
            terms of service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline">
            privacy policy
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
};
