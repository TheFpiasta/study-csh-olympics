import Link from "next/link";
import OlympicRings from "@/components/OlympicRings";
import TemporalAnalysis from "@/components/TemporalAnalysis";
import GeographicAnalysis from "@/components/GeographicAnalysis";

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

            {/* Analytics Header */}
            <div className="mx-4 mb-6">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center justify-center gap-2">
                            📊 Analytics Dashboard
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Comprehensive temporal analysis of Olympic venue development and usage patterns
                        </p>
                    </div>
                </div>
            </div>

            {/* Temporal Analysis Dashboard */}
            <div className="mx-4 mb-8">
                <TemporalAnalysis />
            </div>

            {/* Geographic Analysis Dashboard */}
            <div className="mx-4 mb-8">
                <GeographicAnalysis />
            </div>

            {/* Future Sections Placeholder */}
            <div className="mx-4 mb-4">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200">
                        🚀 Coming Next
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Outlier detection & analysis</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Sustainability scoring system</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Comparative studies</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Interactive filtering</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Sport-specific analytics</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Export capabilities</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}