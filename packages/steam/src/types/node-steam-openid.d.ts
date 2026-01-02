declare module "node-steam-openid" {
  interface SteamAuthOptions {
    realm: string;
    returnUrl: string;
    apiKey: string;
  }

  interface UserObject {
    _json: Record<string, unknown>;
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
  }

  class SteamAuth {
    constructor(options: SteamAuthOptions);
    getRedirectUrl(): Promise<string>;
    authenticate(request: { method: string; url: string }): Promise<UserObject>;
  }

  export default SteamAuth;
}
