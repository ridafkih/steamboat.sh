type RuntimeConfig = {
  API_URL: string;
};

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

const getRuntimeConfig = (): RuntimeConfig => {
  if (window.__RUNTIME_CONFIG__) {
    return window.__RUNTIME_CONFIG__;
  }

  return {
    API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  };
};

export const config = getRuntimeConfig();
