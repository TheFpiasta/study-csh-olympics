import Image from "next/image";
import Link from "next/link";
import OlympicRings from "@/components/OlympicRings";

export default function Home() {
    return (
        <div className="min-h-screen olympic-bg relative overflow-hidden">
            {/* Floating decorative rings */}
            <div className="absolute top-20 left-10 opacity-20 dark:opacity-10">
                <OlympicRings size="w-16 h-16" />
            </div>
            <div className="absolute bottom-20 right-10 opacity-20 dark:opacity-10">
                <OlympicRings size="w-12 h-12" />
            </div>
            <div className="absolute top-1/3 right-20 opacity-15 dark:opacity-10">
                <OlympicRings size="w-20 h-20" />
            </div>
            <div className="absolute bottom-32 left-20 opacity-15 dark:opacity-8">
                <OlympicRings size="w-14 h-14" />
            </div>
            <div className="absolute top-1/2 left-8 opacity-12 dark:opacity-6">
                <OlympicRings size="w-16 h-16" />
            </div>

            <div className="relative z-10 p-6 flex flex-col items-center justify-center min-h-screen">
                <div className="max-w-6xl mx-auto text-center">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <div className="flex justify-center mb-8">
                            <OlympicRings size="w-32 h-32 md:w-40 md:h-40" />
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
                            Olympic Venues
                        </h1>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-gray-900 dark:text-gray-200">
                            Interactive Web Experience
                        </h2>
                        <p className="text-lg md:text-xl lg:text-2xl mb-12 text-gray-900 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                            Explore the rich history of Olympic venues through stunning interactive maps and comprehensive data visualizations. 
                            Discover where the games were held and dive deep into the venues that hosted Olympic competitions across the globe.
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                        <Link 
                            href="/map" 
                            className="btn-olympic bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white group"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span className="text-2xl">🗺️</span>
                                <span className="text-lg font-semibold">Interactive Map</span>
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </Link>
                        <Link 
                            href="/graphs" 
                            className="btn-olympic bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white group"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span className="text-2xl">📊</span>
                                <span className="text-lg font-semibold">Data Analytics</span>
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </Link>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/60 dark:border-gray-600/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <div className="text-4xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-200">Global Coverage</h3>
                            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                                Explore Olympic venues from every continent with comprehensive geographical data spanning over a century of Olympic history.
                            </p>
                        </div>
                        
                        <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/60 dark:border-gray-600/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <div className="text-4xl mb-4">📈</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-200">Rich Analytics</h3>
                            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                                Dive into detailed statistics, trends, and insights about Olympic venues, capacities, and historical significance.
                            </p>
                        </div>
                        
                        <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/60 dark:border-gray-600/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-200">Interactive Design</h3>
                            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                                Experience a modern, responsive interface with smooth animations and intuitive navigation across all devices.
                            </p>
                        </div>
                        
                        <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/60 dark:border-gray-600/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <div className="text-4xl mb-4">🏛️</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-200">Historical Context</h3>
                            <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                                Discover the stories behind iconic Olympic venues and their role in shaping Olympic history and legacy.
                            </p>
                        </div>
                    </div>

                    {/* Technology Stack */}
                    <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-4xl mx-auto border border-gray-200/60 dark:border-gray-600/50 shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-200">Built with Modern Technology</h2>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium border border-gray-300 dark:border-gray-600">Next.js 15</span>
                            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium border border-gray-300 dark:border-gray-600">React 19</span>
                            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium border border-gray-300 dark:border-gray-600">MapLibre GL</span>
                            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium border border-gray-300 dark:border-gray-600">Tailwind CSS</span>
                            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium border border-gray-300 dark:border-gray-600">React Map GL</span>
                        </div>
                    </div>

                    {/* GitHub Link */}
                    <div className="mb-8">
                        <Link 
                            href="https://github.com/TheFpiasta/study-csh-olympics" 
                            target="_blank" 
                            className="inline-flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-lg transition-colors group"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span>View Project on GitHub</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto pt-12 text-center max-w-4xl mx-auto">
                    <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 dark:border-gray-600/50 shadow-lg">
                        <p className="text-gray-800 dark:text-gray-400 text-lg mb-2">
                            A Project for the University Leipzig
                        </p>
                        <p className="text-gray-700 dark:text-gray-500 text-base">
                            Computational Spatial Humanities Module
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
