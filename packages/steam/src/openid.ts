import SteamAuth from "node-steam-openid";

type SteamAuthOptions = {
  realm: string;
  returnUrl: string;
  apiKey: string;
};

export type SteamUser = {
  steamid: string;
  username: string;
  name: string;
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
    authenticate: async (request: Request): Promise<SteamUser> => {
      const result = await steamAuth.authenticate({
        method: request.method,
        url: request.url,
      });
      const profile = result._json.profileurl;
      return {
        steamid: result.steamid,
        username: result.username,
        name: result.name,
        profile: {
          url: typeof profile === "string" ? profile : "",
        },
        avatar: result.avatar,
      };
    },
  };
};
