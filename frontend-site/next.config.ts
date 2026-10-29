import type { NextConfig } from "next";
import path from "node:path";

// `output: "standalone"` is required for the Docker image (see Dockerfile) but
// breaks Vercel deployments on Next.js 16.3.x: the Vercel build adapter triggers
// an ENOENT on `.next/next-server.js.nft.json` during `onBuildComplete`.
// See https://github.com/vercel/next.js/issues/96646
// Disable standalone output when building on Vercel (VERCEL env is set by the platform).
const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  output: isVercel ? undefined : "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
