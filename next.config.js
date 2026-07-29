// Static export: the frontend is a plain static site deployed on Cloudflare
// Pages. All backend work (fetching + parsing remote sites) happens in a
// separate Cloudflare Pages Function (see /functions/api/style-extract.ts),
// which Cloudflare deploys as a Worker automatically alongside this static
// build — no Node.js server, no Next.js API routes.
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
