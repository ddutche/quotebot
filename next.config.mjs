/** @type {import('next').NextConfig} */
const nextConfig = {
  // Routes read client files from disk at runtime. Make sure Vercel ships them.
  outputFileTracingIncludes: {
    "/api/chat": ["./clients/**/*", "./bot/**/*", "./design/**/*"],
  },
};

export default nextConfig;
