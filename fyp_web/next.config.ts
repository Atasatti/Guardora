import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**", // This makes sure it only allows images from your uploads folder
      },
    ],
  },
};

export default nextConfig;
