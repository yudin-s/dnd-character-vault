import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  title: "5e Character Vault",
  description: "Browser-only DnD 5e character sheet with local autosave, history, import, and export.",
  manifest: `${basePath}/manifest.webmanifest`,
  applicationName: "5e Character Vault",
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
