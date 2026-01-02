import { useSession } from "./lib/auth";
import { LoginScreen } from "./screens/login";
import { DashboardScreen } from "./screens/dashboard";

export const App = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return <LoginScreen />;
  }

  return <DashboardScreen user={session.user} />;
};
