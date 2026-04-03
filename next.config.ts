import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for stripe webhook raw body
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Seguridad en headers de producción
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js inline scripts + Stripe JS
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              // Stripe iframes
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // Stripe API calls + our own API
              "connect-src 'self' https://api.stripe.com",
              // Styles: self + inline (Next.js/Tailwind injects inline styles)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + data URIs + our CDN patterns
              "img-src 'self' data: https://images.unsplash.com",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // No indexar rutas de API
      {
        source: "/api/(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
