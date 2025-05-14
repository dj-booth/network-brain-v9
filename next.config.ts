import type { NextConfig } from "next";

const config: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'network-brain-profile-photos.s3.ap-southeast-2.amazonaws.com',
      'i.postimg.cc', 'postimg.cc',
    ],
  },
};

export default config;
