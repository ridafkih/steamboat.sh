import { useState } from "react";
import { Gamepad, Lock, Loader2 } from "lucide-react";
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
import { useLinkedAccounts } from "@/lib/hooks/use-linked-accounts";

const apiBaseUrl = import.meta.env.VITE_API_URL;

export const LinkSteamAccountCard = () => {
  const { data: steamAccounts, isLoading, mutate } = useLinkedAccounts();
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<number | null>(
    null,
  );
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkSteam = () => {
    setIsLinking(true);
    const linkUrl = new URL("/api/steam/link", config.API_URL);
    window.location.href = linkUrl.toString();
  };

  const handleUnlinkSteam = async (steamAccountId: number) => {
    setUnlinkingAccountId(steamAccountId);
    try {
      const result = await apiClient.steam.unlink({ steamAccountId });
      if (result.success) {
        await mutate();
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

  if (steamAccounts && steamAccounts.length > 0) {
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
          <div className="flex items-center gap-2">
            <div className="relative w-fit">
              <div className="flex size-12 p-2 items-center justify-center rounded-full bg-white/10">
                <SteamIcon className="fill-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Link Steam</CardTitle>
          </div>
          <CardDescription>
            Linking your Steam account is required to inventory and keep track
            of your library.
          </CardDescription>
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
        <Button className="w-full" onClick={handleLinkSteam} disabled={isLinking}>
          {isLinking ? <Loader2 className="size-5 animate-spin" /> : "Authenticate"}
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
