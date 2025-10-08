'use client';

import DatasetStatistics from "@/app/graphs/components/sections/DatasetStatistics";
import VenueUsage from "@/app/graphs/components/sections/VenueUsage";
import React, {useEffect, useState} from "react";
import CostAndProfitabilityAnalyses from "@/app/graphs/components/sections/CostAndProfitabilityAnalyses";
import logger from "@/components/logger";
import VenueBuilding from "@/app/graphs/components/sections/VenueBuilding";
import GeographicalAnalysis from "@/app/graphs/components/sections/GeographicalAnalysis";
import PageInfoSection from "@/app/graphs/components/templates/PageInfoSection";
import OlympicMetric from "@/app/graphs/components/sections/OlympicMetric";
import SectionNavigation from "@/app/graphs/components/SectionNavigation";
import LongTermSankeyPlot from "@/app/graphs/components/graphs/LongTermSankeyPlot";

export default function GraphsPage() {
    const [geojsonData, setGeojsonData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/olympics/all', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    return {data: [], error: `Failed to fetch Olympic data: ${response.status} ${errorText}`};
                }

                return {data: await response.json(), error: null};
            } catch (err) {
                logger.error('Error fetching data:', err);
                return {data: [], error: 'Error fetching data: ' + err.message};
            }
        }

        fetchData().then(res => setGeojsonData(res));
    }, []);

    return (
        <div className="min-h-screen pt-1 pb-4 bg-gray-50 dark:bg-slate-900 olympic-bg">
            {/* Header */}
            <PageInfoSection
                headline={"Olympic Data Analytics"}
                subline={"Comprehensive data visualizations and statistical insights about Olympic venues"}
                href={"/"}
                linkText={"Back to Home"}
                icon={
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                    </svg>
                }/>

            {/* Section Navigation */}
            <div className="pt-4 pb-8 mx-4 mb-8">
                <SectionNavigation/>
            </div>

            {/* Temporal Analysis Dashboard */}
            <div id="dataset-statistics" className="mx-4 mb-8">
                <DatasetStatistics geojsonData={geojsonData}/>
            </div>

            <div id="olympic-metrics" className="mx-4 mb-8">
                <OlympicMetric geojsonData={geojsonData}/>
            </div>

            <div id="geographical-analysis" className="mx-4 mb-8">
                <GeographicalAnalysis geojsonData={geojsonData}/>
            </div>

            <div id="venue-building" className="mx-4 mb-8">
                <VenueBuilding geojsonData={geojsonData}/>
            </div>

            {/* Temporal Development Analyses */}
            <div id="venue-usage" className="mx-4 mb-8">
                <VenueUsage geojsonData={geojsonData}/>
            </div>

            <div id="cost-profitability" className="mx-4 mb-8">
                <CostAndProfitabilityAnalyses geojsonData={geojsonData}/>
            </div>

            <PageInfoSection
                headline={"Explore Nivo Graphs"}
                subline={"Discover a variety of interactive charts and graphs powered by the Nivo graph engine."}
                href={"https://nivo.rocks/components/"}
                linkText={"Explore Nivo"}
                icon={
                    <svg className="w-5 h-5 transition-transform rotate-180 group-hover:-translate-x-1" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                    </svg>
                }
            />

            {/* Future Sections Placeholder */}
            <div className="mx-4 mb-6">
                <div
                    className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
                    <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-200">
                        🚀 Upcoming Ideas and Features
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span
                                className="text-sm text-gray-800 dark:text-gray-300">Robust cities to countries mapping
                                on the data generation</span>
                        </div>
                        <div
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Bulk Request for AI JSON
                                extraction</span>
                        </div>
                        <div
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Comparative studies</span>
                        </div>
                        <div
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Low-code dataset generation
                                workflow</span>
                        </div>
                        <div
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Export capabilities</span>
                        </div>
                        <div
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            <span className="text-sm text-gray-800 dark:text-gray-300">Advanced dataset mapping</span>
                        </div>
                    </div>
                </div>
            </div>

            <PageInfoSection
                headline={"Test graphs"}
                subline={"Discover our test graphs that we have created to explore the capabilities of the Nivo graph engine."}
                href={"/graphs/tests"}
                linkText={"Explore the Tests"}
                icon={
                    <svg className="w-5 h-5 transition-transform rotate-180 group-hover:-translate-x-1" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                    </svg>
                }
            />


        </div>
    )
}
