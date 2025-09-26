import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
// import { ThemeProvider } from "@/contexts/ThemeContext";
import {ThemeProvider} from "@/components/ThemeProvider"; // Der NEUE Provider

const geist = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Olympic Venues Web App",
    description: "Explore the rich history of Olympic venues through interactive maps and data visualizations",
    keywords: "Olympics, venues, history, interactive maps, data visualization",
    authors: [{name: "Olympic Venues Team"}],
    openGraph: {
        title: "Olympic Venues Web App",
        description: "Explore the rich history of Olympic venues through interactive maps and data visualizations",
        type: "website",
    },
};

export default function RootLayout({children}) {
    return (
        <html lang="en" className={`dark ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>

        <body className="min-h-screen antialiased bg-white dark:bg-slate-900">
        <ThemeProvider>
            <div className="text-gray-900 bg-white dark:bg-slate-900 dark:text-gray-100">
                {/* <ThemeToggle /> */}
                {/* <Navigation /> */}
                {children}
            </div>
        </ThemeProvider>
        </body>
        </html>
    );
}
