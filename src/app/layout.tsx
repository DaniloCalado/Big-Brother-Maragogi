import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

const metadataBase = siteUrl
  ? new URL(siteUrl)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: "Big Brother Maragogi",
  description:
    "Big Brother Maragogi: experiência na Semana Santa (2 a 5 de abril) em uma casa de praia em Maragogi - AL. Inscreva-se.",
  openGraph: {
    title: "Big Brother Maragogi",
    description:
      "Big Brother Maragogi: experiência na Semana Santa (2 a 5 de abril) em uma casa de praia em Maragogi - AL. Inscreva-se.",
    url: "/",
    siteName: "Big Brother Maragogi",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Big Brother Maragogi",
    description:
      "Big Brother Maragogi: experiência na Semana Santa (2 a 5 de abril) em uma casa de praia em Maragogi - AL. Inscreva-se.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55" />
          <img
            src="/BG-1.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <img
            src="/BG-2.png"
            alt=""
            className="absolute right-[-8%] top-[-6%] h-[48vh] w-auto rotate-3 opacity-25 blur-[1.6px]"
          />
          <img
            src="/BG-3.png"
            alt=""
            className="absolute bottom-[-6%] left-[-10%] h-[44vh] w-auto -rotate-2 opacity-25 blur-[1.2px]"
          />
          <img
            src="/BG-4.png"
            alt=""
            className="absolute bottom-[8%] right-[-6%] h-[38vh] w-auto rotate-2 opacity-25 blur-[1.2px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(249,115,22,0.28),transparent_48%),radial-gradient(circle_at_78%_18%,rgba(236,72,153,0.25),transparent_52%),radial-gradient(circle_at_70%_78%,rgba(34,211,238,0.22),transparent_55%)]" />
        </div>
        {children}
      </body>
    </html>
  );
}
