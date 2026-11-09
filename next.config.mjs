/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ["postgres", "sharp"], serverActions: { bodySizeLimit: "12mb" } },
};
export default nextConfig;
