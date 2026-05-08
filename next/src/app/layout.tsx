import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LinkToContactPage from "@/components/LinkToContactPage";
import { SimpleBarWrapper } from "@/components/SimpleBarWrapper";
import theme from "@/theme/theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://mizuki-clinic.online";

export const metadata: Metadata = {
  title: {
    default: "みずきクリニック | 石川県金沢市の内科・消化器内科",
    template: "%s | みずきクリニック",
  },
  description:
    "みずきクリニックは、石川県金沢市にある内科・消化器内科クリニックです。内視鏡検査、在宅医療、オンライン診療など、地域の皆様の健康をサポートします。",
  keywords: [
    "みずきクリニック",
    "金沢市",
    "内科",
    "消化器内科",
    "内視鏡検査",
    "在宅医療",
    "オンライン診療",
  ],
  authors: [{ name: "みずきクリニック" }],
  creator: "みずきクリニック",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "みずきクリニック",
    title: "みずきクリニック | 石川県金沢市の内科・消化器内科",
    description:
      "石川県金沢市にある内科・消化器内科クリニック。内視鏡検査、在宅医療、オンライン診療など、地域の皆様の健康をサポートします。",
    images: [
      {
        url: `${siteUrl}/mizuki_logo_transparent.jpg`,
        width: 400,
        height: 400,
        alt: "みずきクリニック",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "みずきクリニック | 石川県金沢市の内科・消化器内科",
    description:
      "石川県金沢市にある内科・消化器内科クリニック。内視鏡検査、在宅医療、オンライン診療など。",
    images: [`${siteUrl}/mizuki_logo_transparent.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console の検証コードがある場合は追加
    // google: "your-verification-code",
  },
};

// 構造化データ（JSON-LD）
const structuredData = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "@id": siteUrl,
  name: "みずきクリニック",
  description:
    "石川県金沢市にある内科・消化器内科クリニック。内視鏡検査、在宅医療、オンライン診療など、地域の皆様の健康をサポートします。",
  url: siteUrl,
  telephone: "076-255-0337",
  address: {
    "@type": "PostalAddress",
    streetAddress: "みずき1丁目3-5",
    addressLocality: "金沢市",
    addressRegion: "石川県",
    postalCode: "920-3122",
    addressCountry: "JP",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 36.5944,
    longitude: 136.6256,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "12:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Friday"],
      opens: "14:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "12:00",
    },
  ],
  medicalSpecialty: ["内科", "消化器内科"],
  priceRange: "保険適用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SimpleBarWrapper>
              <Header />
              {children}
              <LinkToContactPage />
              <Footer />
            </SimpleBarWrapper>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
