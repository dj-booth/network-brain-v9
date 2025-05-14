import type { NextConfig } from "next";

const config: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['i.postimg.cc', 'postimg.cc'],
  },
};

export default config;
