/**
 * next-sitemap 設定ファイル
 * @see https://github.com/iamvishnusankar/next-sitemap
 *
 * Google向け最適化:
 * - changefreq と priority は Google が無視するため使用しない
 * - lastmod のみを設定
 */

module.exports = {
  siteUrl: "https://mizuki-clinic.jp",
  generateRobotsTxt: true,
  sitemapSize: 5000,

  // サイトマップから除外するパス
  exclude: [
    "/portal-admin*",
    "/portal-login*",
    "/api/*",
  ],

  // robots.txt 設定
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/portal-admin",
          "/portal-login",
          "/api/",
        ],
      },
    ],
  },

  // URLのトランスフォーム（lastmodのみ設定）
  transform: async (_config, path) => ({
    loc: path,
    lastmod: new Date().toISOString(),
  }),
};
