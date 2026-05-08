import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    distDir: ".next",
    experimental: {
        serverActions: { bodySizeLimit: "2mb" },
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "mizuki-clinic.jp",
            },
            {
                protocol: "https",
                hostname: "static.wixstatic.com",
            },
        ],
    },
    async redirects() {
        return [
            {
                source: "/discription",
                destination: "/description",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
