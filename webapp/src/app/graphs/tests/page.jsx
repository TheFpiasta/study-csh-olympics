'use client';

import CostAnalysis from "@/app/graphs/tests/components/CostAnalysis";
import ScatterPlot from "@/app/graphs/tests/components/ScatterPlot";
import InteractiveFeatures from "@/app/graphs/tests/components/InteractiveFeatures";
import {useEffect, useState} from "react";
import logger from "@/components/logger";
import ChartSectionPlaceholder from "@/app/graphs/components/templates/ChartSectionPlaceholder";
import PageInfoSection from "@/app/graphs/components/templates/PageInfoSection";

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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 olympic-bg pt-1">
            {/* Header */}
            <PageInfoSection
                headline={"Test graphs"}
                subline={"Discover our test graphs that we have created to explore the capabilities of the Nivo graph engine."}
                href={"/graphs"}
                linkText={"Back to Graphs"}
                icon={
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                    </svg>
                }/>

            <hr className="border-t border-gray-300 dark:border-gray-700 my-8 mx-4"/>

            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-1 text-center w-2/3 mx-auto mb-20 mt-20">
                This page showcases various interactive charts and graphs built using the Nivo graph engine.<br/>
                It includes test graphs, examples, and templates that can be adapted for different data visualization
                needs.<br/>
                Attention: this graphs are not yet fully styled or adapted to the olympic theme and data. <br/>
                <br/>
                <span className={"text-olympic-red"}> The showed Data can be corrupted and wrong!</span>
            </h4>

            {/* Interactive Features Dashboard */}
            <div className="mx-4 mb-8">
                <InteractiveFeatures geojsonData={geojsonData}/>
            </div>

            {/*/!* Cost Analysis Dashboard *!/*/}
            <div className="mx-4 mb-8">
                <CostAnalysis geojsonData={geojsonData}/>
            </div>

            {/*/!*Scatter Plot Dashboard *!/*/}
            <div className="mx-4 mb-8">
                <ScatterPlot geojsonData={geojsonData}/>
            </div>

            <ChartSectionPlaceholder geojsonData={geojsonData}/>
        </div>
    )
}
