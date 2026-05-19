import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = "https://yudin-s.github.io/dnd-character-vault/";

export const metadata = {
  title: "5e Character Vault",
  description: "A browser-only DnD 5e character sheet for live sessions, local-first play, dice rolls, autosave history, and portable backups.",
  metadataBase: new URL(siteUrl),
  manifest: `${basePath}/manifest.webmanifest`,
  applicationName: "5e Character Vault",
  authors: [{ name: "Sergey Yudin", url: "https://github.com/yudin-s" }],
  creator: "Sergey Yudin",
  keywords: ["DnD", "Dungeons and Dragons", "5e", "character sheet", "TTRPG", "dice roller", "local-first"],
  openGraph: {
    title: "5e Character Vault",
    description: "A browser-only DnD 5e character sheet for live sessions, local-first play, dice rolls, autosave history, and portable backups.",
    url: siteUrl,
    siteName: "5e Character Vault",
    type: "website",
    images: [
      {
        url: `${basePath}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
        alt: "5e Character Vault shield icon"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "5e Character Vault",
    description: "A browser-only DnD 5e character sheet for live sessions, local-first play, dice rolls, autosave history, and portable backups.",
    images: [`${basePath}/icons/icon-512x512.png`]
  },
  appleWebApp: {
    capable: true,
    title: "5e Vault",
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
