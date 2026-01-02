import SteamAuth from "node-steam-openid";

type SteamAuthOptions = {
  realm: string;
  returnUrl: string;
  apiKey: string;
};

export type SteamUser = {
  steamid: string;
  username: string;
  name: string | undefined;
  profile: {
    url: string;
  };
  avatar: {
    small: string;
    medium: string;
    large: string;
  };
};

export type SteamAuthClient = {
  getRedirectUrl: () => Promise<string>;
  authenticate: (request: Request) => Promise<SteamUser>;
};

export const createSteamAuth = (options: SteamAuthOptions): SteamAuthClient => {
  const steamAuth = new SteamAuth(options);

  return {
    getRedirectUrl: () => steamAuth.getRedirectUrl(),
    authenticate: (request: Request) => steamAuth.authenticate(request),
  };
};
