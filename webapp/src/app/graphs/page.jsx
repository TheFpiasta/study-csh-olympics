import Link from "next/link";
import OlympicRings from "@/components/OlympicRings";

export default function GraphsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 olympic-bg">
            {/* Header */}
            <div className="relative z-10">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm mx-4 my-4 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <OlympicRings size="w-12 h-12" />
                            <div>
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200">
                                    Olympic Data Analytics
                                </h1>
                                <p className="text-gray-700 dark:text-gray-400 mt-2 text-sm md:text-base">
                                    Comprehensive data visualizations and statistical insights about Olympic venues
                                </p>
                            </div>
                        </div>
                        
                        <Link 
                            href="/" 
                            className="btn-olympic bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white group flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Coming Soon Content */}
            <div className="mx-4 mb-4">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-6xl mb-6">📊</div>
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-200">
                            Analytics Dashboard
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-400 mb-8">
                            Advanced data visualizations and statistical analysis of Olympic venues are currently in development. 
                            This section will feature comprehensive charts, graphs, and insights about Olympic history.
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 bg-white dark:bg-gray-700/50 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
                                <div className="text-3xl mb-3">📈</div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">Venue Statistics</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Detailed statistics about venue capacities, usage, and geographical distribution across Olympic history.
                                </p>
                            </div>
                            
                            <div className="p-6 bg-white dark:bg-gray-700/50 border border-green-200 dark:border-green-700 rounded-xl shadow-sm">
                                <div className="text-3xl mb-3">🌍</div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">Global Trends</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Analyze trends in Olympic venue development and usage patterns across different continents and time periods.
                                </p>
                            </div>
                            
                            <div className="p-6 bg-white dark:bg-gray-700/50 border border-purple-200 dark:border-purple-700 rounded-xl shadow-sm">
                                <div className="text-3xl mb-3">🏆</div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">Historical Analysis</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Explore the evolution of Olympic venues from the early modern Olympics to contemporary games.
                                </p>
                            </div>
                            
                            <div className="p-6 bg-white dark:bg-gray-700/50 border border-amber-200 dark:border-amber-700 rounded-xl shadow-sm">
                                <div className="text-3xl mb-3">🎯</div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">Interactive Charts</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Dynamic and interactive visualizations allowing for deep exploration of Olympic venue data.
                                </p>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-blue-800 dark:text-blue-300 text-sm">
                                <strong>Coming Soon:</strong> This section is under active development and will include comprehensive data visualizations, 
                                interactive charts, and statistical analysis tools for exploring Olympic venue data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Preview */}
            <div className="mx-4 mb-4">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200">
                        🚀 Planned Features
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Venue capacity analysis</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Geographic distribution charts</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Timeline visualizations</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Sport-specific analytics</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Comparative studies</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Export capabilities</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}