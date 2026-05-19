import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = "https://yudin-s.github.io/dnd-character-vault/";

export const metadata = {
  title: "Quest Ledger",
  description: "A local-first DnD 5e character sheet you can install as a PWA, save locally, and use offline at the table.",
  metadataBase: new URL(siteUrl),
  manifest: `${basePath}/manifest.webmanifest`,
  applicationName: "Quest Ledger",
  authors: [{ name: "Sergey Yudin", url: "https://github.com/yudin-s" }],
  creator: "Sergey Yudin",
  keywords: ["DnD", "Dungeons and Dragons", "5e", "character sheet", "TTRPG", "dice roller", "local-first", "PWA", "offline"],
  openGraph: {
    title: "Quest Ledger",
    description: "A local-first DnD 5e character sheet you can install as a PWA, save locally, and use offline at the table.",
    url: siteUrl,
    siteName: "Quest Ledger",
    type: "website",
    images: [
      {
        url: `${basePath}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
        alt: "Quest Ledger shield icon"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Quest Ledger",
    description: "A local-first DnD 5e character sheet you can install as a PWA, save locally, and use offline at the table.",
    images: [`${basePath}/icons/icon-512x512.png`]
  },
  appleWebApp: {
    capable: true,
    title: "Quest Ledger",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: `${basePath}/icons/icon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${basePath}/icons/icon-192x192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icons/icon-512x512.png`, sizes: "512x512", type: "image/png" },
      { url: `${basePath}/icons/icon.svg`, sizes: "any", type: "image/svg+xml" }
    ],
    apple: `${basePath}/icons/icon-180x180.png`
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3e7ce"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
