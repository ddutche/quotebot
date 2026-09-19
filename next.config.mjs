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
  // No home page yet: send visitors to the demo. Temporary (307) so a real home page can replace it.
  async redirects() {
    return [{ source: "/", destination: "/demo/example-drywall", permanent: false }];
  },
};

export default nextConfig;
