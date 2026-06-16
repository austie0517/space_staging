/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverActions: {
    bodySizeLimit: "8mb",
  },
};

module.exports = nextConfig;
