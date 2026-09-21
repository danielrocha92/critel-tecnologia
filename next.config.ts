import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/:lang/all-tickets',
        destination: '/:lang/atendimento?filter=todos',
      },
      {
        source: '/:lang/my-tickets',
        destination: '/:lang/atendimento?meus=true&filter=todos',
      },
      {
        source: '/:lang/my-tickets/opened',
        destination: '/:lang/atendimento?meus=true&filter=abertos',
      },
      {
        source: '/:lang/my-tickets/closed',
        destination: '/:lang/atendimento?meus=true&filter=finalizados',
      },
    ];
  },
};

export default withPWA(nextConfig);
