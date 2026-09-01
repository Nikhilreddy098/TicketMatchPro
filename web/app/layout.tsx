import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import { OrganizationJsonLd } from '../components/JsonLd';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ticketmatchpro.com'),
  title: {
    default: 'TicketMatchPro — Buy, Sell & Exchange Tickets',
    template: '%s | TicketMatchPro',
  },
  description:
    'Discover, buy, sell and exchange event tickets with confidence on TicketMatchPro. India\'s premier verified ticket marketplace for concerts, IPL cricket, sports, theatre, and festivals.',
  keywords: [
    'ticket marketplace',
    'buy tickets',
    'sell tickets',
    'exchange tickets',
    'IPL tickets',
    'concert tickets Hyderabad',
    'music fest tickets Bengaluru',
    'sports tickets Mumbai',
    'ticket match pro',
  ],
  authors: [{ name: 'TicketMatchPro' }],
  creator: 'TicketMatchPro',
  publisher: 'TicketMatchPro Inc.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://ticketmatchpro.com',
    siteName: 'TicketMatchPro',
    title: 'TicketMatchPro — Buy, Sell & Exchange Tickets',
    description:
      'Discover, buy, sell and exchange event tickets with confidence on TicketMatchPro. 100% verified tickets, peer exchange & QR passes.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'TicketMatchPro Commercial Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TicketMatchPro — Buy, Sell & Exchange Tickets',
    description:
      'Discover, buy, sell and exchange event tickets with confidence on TicketMatchPro.',
    images: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={beVietnamPro.variable}>
      <head>
        <OrganizationJsonLd />
      </head>
      <body className="min-h-screen flex flex-col bg-background font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
