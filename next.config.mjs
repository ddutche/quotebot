/** @type {import('next').NextConfig} */
const nextConfig = {
  // Routes read client files from disk at runtime. Make sure Vercel ships them.
  outputFileTracingIncludes: {
    "/api/chat": ["./clients/**/*", "./bot/**/*", "./design/**/*"],
    "/api/client/[clientId]": ["./clients/**/*", "./design/**/*"],
    "/api/lead": ["./clients/**/*"],
    "/demo/[clientId]": ["./clients/**/*", "./design/**/*"],
    "/dev": ["./clients/**/*", "./design/**/*"],
  },
};

export default nextConfig;
