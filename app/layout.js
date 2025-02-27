import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  // You can add other options like weight, style, etc.
  // weight: ['400', '700'],
  // display: 'swap',
});

export const metadata = {
  title: "Loan Payoff Calculator",
  description: "Calculate how quickly you can pay off your loan with additional payments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
