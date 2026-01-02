import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth";
import DiscordLogo from "@/assets/discord.svg?react";

export const LoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const handleDiscordLogin = async () => {
    await signIn.social({
      provider: "discord",
      callbackURL: window.location.origin,
    });
  };

  return (
    <div
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    >
      <h1 className="text-xl font-normal">Welcome to Steamboat</h1>
      <p className="text-center text-sm text-muted-foreground tracking-wide leading-6 font-light">
        Share your game library with users on Discord without having to share
        your account or leave Discord.
      </p>
      <Button
        variant="outline"
        type="button"
        className="mt-2 w-full"
        onClick={handleDiscordLogin}
      >
        <DiscordLogo className="size-5" />
        Continue with Discord
      </Button>
      <Separator className="my-2" />
      <p className="text-center text-xs text-muted-foreground font-light tracking-tight leading-loose">
        By continuing you agree to our{" "}
        <Button variant="link" asChild className="h-auto p-0 text-xs">
          <a href="/privacy">privacy policy</a>
        </Button>{" "}
        and{" "}
        <Button variant="link" asChild className="h-auto p-0 text-xs inline">
          <span>
            <a href="/terms">terms &amp; conditions</a>.
          </span>
        </Button>
      </p>
    </div>
  );
};
