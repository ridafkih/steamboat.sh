import { join } from "node:path";

const distDirectory = join(import.meta.dir, "dist");
const port = Number(process.env.PORT) || 3000;

const runtimeConfig = {
  API_URL: process.env.API_URL ?? "http://localhost:3001",
};

const configScript = `window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};`;

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/config.js") {
      return new Response(configScript, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    let filePath = join(distDirectory, url.pathname);

    let file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    const withIndex = join(filePath, "index.html");
    file = Bun.file(withIndex);
    if (await file.exists()) {
      return new Response(file);
    }

    const fallback = Bun.file(join(distDirectory, "index.html"));
    return new Response(fallback, {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Server running on port ${port}`);
