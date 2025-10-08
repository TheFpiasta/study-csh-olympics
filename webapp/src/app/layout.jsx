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
                        className="w-full py-4 text-sm text-center text-gray-500 bg-white border-t border-gray-200 dark:text-gray-400 dark:border-gray-700 dark:bg-slate-900 backdrop-blur-sm">
                        {/*    three columns*/}
                        <div className="grid items-center grid-cols-1 gap-4 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 md:grid-cols-3">
                            <div className="text-center md:text-left">
                                <a href="https://github.com/TheFpiasta/study-csh-olympics"
                                className="hover:underline">
                                    Open Source on GitHub
                                </a>
                            </div>
                            <div className="space-x-4 text-center">
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
