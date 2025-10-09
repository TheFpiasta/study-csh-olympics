import Link from "next/link";
import OlympicRings from "@/components/OlympicRings";

export default function Home() {
    return (
        <div className="relative min-h-screen overflow-hidden olympic-bg">
            {/* Floating decorative rings */}
            <div className="absolute top-20 left-10 opacity-20 dark:opacity-10">
                <OlympicRings size="w-16 h-16"/>
            </div>
            <div className="absolute bottom-20 right-10 opacity-20 dark:opacity-10">
                <OlympicRings size="w-12 h-12"/>
            </div>
            <div className="absolute top-1/3 right-20 opacity-15 dark:opacity-10">
                <OlympicRings size="w-20 h-20"/>
            </div>
            <div className="absolute bottom-32 left-20 opacity-15 dark:opacity-8">
                <OlympicRings size="w-14 h-14"/>
            </div>
            <div className="absolute top-1/2 left-8 opacity-12 dark:opacity-6">
                <OlympicRings size="w-16 h-16"/>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
                <div className="max-w-6xl mx-auto text-center">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <div className="flex justify-center md:mb-8">
                            <OlympicRings size="w-28 h-28 md:w-40 md:h-40"/>
                        </div>

                        <h1 className="mb-6 text-4xl font-bold text-transparent md:text-6xl lg:text-7xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-500 bg-clip-text">
                            Olympic Venues
                        </h1>
                        <h2 className="mb-8 text-2xl font-semibold text-gray-900 md:text-3xl lg:text-4xl dark:text-gray-200">
                            Interactive Web Experience
                        </h2>
                        <p className="max-w-4xl mx-auto mb-12 text-lg leading-relaxed text-gray-900 md:text-xl lg:text-2xl dark:text-gray-300">
                            Explore the rich history of Olympic venues through stunning interactive maps and
                            comprehensive data visualizations.
                            Discover where the games were held and dive deep into the venues that hosted Olympic
                            competitions across the globe.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center gap-6 mb-16 sm:flex-row">
                        <Link
                            href="/map"
                            className="text-white btn-olympic bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 group"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span className="text-2xl">🗺️</span>
                                <span className="text-lg font-semibold">Interactive Map</span>
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none"
                                     stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                </svg>
                            </span>
                        </Link>
                        <Link
                            href="/graphs"
                            className="text-white btn-olympic bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 group"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span className="text-2xl">📊</span>
                                <span className="text-lg font-semibold">Data Analytics</span>
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none"
                                     stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                </svg>
                            </span>
                        </Link>
                    </div>

                    {/*Data quality warning*/}
                    <div
                        className="max-w-3xl p-4 mx-auto mb-12 text-yellow-700 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-md dark:bg-yellow-900/50 dark:border-yellow-400 dark:text-yellow-300">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-yellow-500 dark:text-yellow-400" fill="currentColor"
                                     viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 00-.993.883L9
    10v3a1 1 0 001.993.117L11 13v-3a1 1 0 00-1-1z"
                                          clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm">
                                    <strong className="font-bold">Data Quality Notice:</strong> While we strive for
                                    accuracy, some venue data may be incomplete or approximate due to the underlying
                                    prove of concept dataset creation, historical record limitations and the base
                                    datasets.
                                    Please interpret visualizations with this in mind.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid gap-8 mb-16 md:grid-cols-2 lg:grid-cols-4">
                        <div
                            className="p-8 transition-all duration-300 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/60 dark:border-gray-600/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl">🌍</div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-200">Global Coverage</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-400">
                                Explore Olympic venues from every continent with comprehensive geographical data
                                spanning over a century of Olympic history.
                            </p>
                        </div>

                        <div
                            className="p-8 transition-all duration-300 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/60 dark:border-gray-600/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl">📈</div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-200">Rich Analytics</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-400">
                                Dive into detailed statistics, trends, and insights about Olympic venues, capacities,
                                and historical significance.
                            </p>
                        </div>

                        <div
                            className="p-8 transition-all duration-300 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/60 dark:border-gray-600/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl">🎨</div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-200">Interactive
                                Design</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-400">
                                Experience a modern, responsive interface with smooth animations and intuitive
                                navigation across all devices.
                            </p>
                        </div>

                        <div
                            className="p-8 transition-all duration-300 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/60 dark:border-gray-600/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl">🏛️</div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-200">Historical
                                Context</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-400">
                                Discover the stories behind iconic Olympic venues and their role in shaping Olympic
                                history and legacy.
                            </p>
                        </div>
                    </div>

                    {/* Technology Stack */}
                    <div
                        className="max-w-4xl p-8 mx-auto mb-12 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/60 dark:border-gray-600/50">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-200">Built with Modern
                            Technology</h2>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <span
                                className="px-4 py-2 font-medium text-gray-800 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Next.js
                                15</span>
                            <span
                                className="px-4 py-2 font-medium text-gray-800 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">React
                                19</span>
                            <span
                                className="px-4 py-2 font-medium text-gray-800 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">MapLibre
                                GL</span>
                            <span
                                className="px-4 py-2 font-medium text-gray-800 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Tailwind
                                CSS</span>
                            <span
                                className="px-4 py-2 font-medium text-gray-800 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">React
                                Map GL</span>
                        </div>
                    </div>

                    {/* GitHub Link */}
                    <div className="mb-8">
                        <Link
                            href="https://github.com/TheFpiasta/study-csh-olympics"
                            target="_blank"
                            className="inline-flex items-center gap-3 text-lg font-medium text-blue-600 transition-colors dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 group"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span>View Project on GitHub</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none"
                                 stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="max-w-4xl pt-12 mx-auto mt-auto text-center">
                    <div
                        className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/60 dark:border-gray-600/50">
                        <p className="mb-2 text-lg text-gray-800 dark:text-gray-400">
                            A Project for the University Leipzig
                        </p>
                        <p className="text-base text-gray-700 dark:text-gray-500">
                            Computational Spatial Humanities Module
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
