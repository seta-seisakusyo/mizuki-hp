// siteUrlに環境変数を使うべきだが、本ファイルがjs指定で読み込まれるため、envConfigは使用不可。

const locs = [
  "/",
  "/contact",
  "/news",
];

module.exports = {
  siteUrl: "https://mizuki-clinic.jp", // サイトのベースURL
  generateRobotsTxt: true, // robots.txt を生成
  sitemapSize: 5000, // 1つのサイトマップに含めるURL数
  exclude: ["/portal-admin*", "/portal-login*"], // サイトマップから除外するパス、ニュース登録用portal-adminページと管理者用portal-loginページを作成すると想定
  additionalPaths: async () => [ // サイトマップに含める追加のパス（動的ページとして認識され、自動捕捉されないため）
    ...locs.map(loc => ({ loc, changefreq: "monthly", priority: 0.7, lastmod: new Date().toISOString() })),
  ],
  transform: async (config, path) => ({
    loc: `${config.siteUrl}${path}`, // ルート以外の全てのpathをサイトマップに含める
    changefreq: "monthly", // ページの更新頻度、当面は変更がないと想定し、デフォルトのdailyからmonthlyに設定
    priority: path === "/" ? 1.0 : 0.7, // デフォルトは全て0.7のため、トップページのみ1.0に設定
    lastmod: new Date().toISOString(),
  }),
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        disallow: ["/portal-admin", "/portal-login"], // 除外するページ
      },
    ],
  },
};
