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
                hostname: "mizuki-clinic.online",
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
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
