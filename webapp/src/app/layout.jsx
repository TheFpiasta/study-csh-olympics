import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
// import { ThemeProvider } from "@/contexts/ThemeContext";
import {ThemeProvider} from "@/components/ThemeProvider";
import Link from "next/link"; // Der NEUE Provider

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
        <footer>
            <div
                className="w-full text-center py-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 backdrop-blur-sm">
                {/*    three columns*/}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1
  md:grid-cols-3 gap-4 items-center">
                    <div className="text-center md:text-left">
                        <a href="https://github.com/TheFpiasta/study-csh-olympics"
                           className="hover:underline">
                            Open Source on GitHub
                        </a>
                    </div>
                    <div className="text-center space-x-4">
                        <a href="/privacy" className="hover:underline">Privacy Policy</a>
                        <a href="/terms" className="hover:underline">Terms of Service</a>
                    </div>
                    <div className="text-center md:text-right">
                        <Link href={"https://github.com/TheFpiasta/study-csh-olympics/issues"}
                              className={"hover:underline"}>Issues & Questions</Link>
                    </div>
                </div>
            </div>
        </footer>
        </body>
        </html>
    );
}
