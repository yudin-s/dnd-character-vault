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
    icon: `${basePath}/icons/icon.svg`,
    apple: `${basePath}/icons/icon.svg`
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
