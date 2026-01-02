import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

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
  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <div className="flex items-center gap-3">
        {user.image && (
          <img
            src={user.image}
            alt={user.name}
            className="size-12 rounded-full"
          />
        )}
        <div>
          <h1 className="text-xl font-medium">Welcome, {user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
};
