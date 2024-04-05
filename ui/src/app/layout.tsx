import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Minesweeper',
  description: 'Come play a fun game of Minesweeper',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="flex min-h-screen overflow-auto w-fit mx-auto items-start justify-between px-24 py-12 lg:py-16">
          <div className="max-w-5xl flex flex-col items-center justify-center font-mono text-sm space-y-5">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
