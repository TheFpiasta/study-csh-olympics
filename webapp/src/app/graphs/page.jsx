'use client';

import Link from "next/link";
import OlympicRings from "@/components/OlympicRings";
import OlympicLineChart from "@/app/graphs/components/olympicMetrics/OlympicLineChart";
import CapacityBoxPlot from "@/app/graphs/components/capacityDistribution/CapacityBoxPlot";
import CostAnalysis from "@/app/graphs/components/CostAnalysis";
import LongTermSankeyPlot from "@/app/graphs/components/capacityDistribution/LongTermSankeyPlot";
import ScatterPlot from "@/app/graphs/components/ScatterPlot";
import CityGeoAnalysis from "@/app/graphs/components/geographicalAnalysis/CityGeoAnalysis";
import TemporalAnalysis from "@/app/graphs/components/datasetStats/TemporalAnalysis";
import WorldGeographicAnalysis from "@/app/graphs/components/geographicalAnalysis/WorldGeographicAnalysis";
import InteractiveFeatures from "@/app/graphs/components/InteractiveFeatures";
import TemporalDevelopmentAnalyses from "@/app/graphs/components/temporalDevelopmnent/TemporalDevelopmentAnalyses";
import {useEffect, useState} from "react";
import CostAndProfitabilityAnalyses from "@/app/graphs/components/costAndProfit/CostAndProfitabilityAnalyses";
import logger from "@/components/logger";
import ChartSectionPlaceholder from "@/app/graphs/components/templates/ChartSectionPlaceholder";
import CapacityDistributionAnalysis from "@/app/graphs/components/capacityDistribution/CapacityDistributionAnalysis";
import GeographicalAnalysis from "@/app/graphs/components/geographicalAnalysis/GeographicalAnalysis";
import PageInfoSection from "@/app/graphs/components/PageInfoSection";
import OlympicMetric from "@/app/graphs/components/olympicMetrics/OlympicMetric";

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

      {/*/!* TODO add Analytics Header *!/*/}

      {/* Temporal Analysis Dashboard */}
      <div className="mx-4 mb-8">
        <TemporalAnalysis geojsonData={geojsonData}/>
      </div>

      <div className="mx-4 mb-8">
        <OlympicMetric geojsonData={geojsonData}/>
      </div>

      <div className="mx-4 mb-8">
        <GeographicalAnalysis geojsonData={geojsonData}/>
      </div>

      <div className="mx-4 mb-8">
        <CapacityDistributionAnalysis geojsonData={geojsonData}/>
      </div>


      {/* Temporal Development Analyses */}
      <div className="mx-4 mb-8">
        <TemporalDevelopmentAnalyses geojsonData={geojsonData}/>
      </div>

      <div className="mx-4 mb-8">
        <CostAndProfitabilityAnalyses geojsonData={geojsonData}/>
      </div>

      <PageInfoSection
        headline={"Explore Nivo Graphs"}
        subline={"Discover a variety of interactive charts and graphs powered by the Nivo graph engine."}
        href={"https://nivo.rocks/components/"}
        linkText={"Explore Nivo"}
        icon={
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1 rotate-180" fill="none"
               stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
          </svg>
        }
      />

      {/* Future Sections Placeholder */}
      <div className="mx-4 mb-4">
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
                className="text-sm text-gray-800 dark:text-gray-300">Outlier detection & analysis</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span
                className="text-sm text-gray-800 dark:text-gray-300">Sustainability scoring system</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-800 dark:text-gray-300">Comparative studies</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-sm text-gray-800 dark:text-gray-300">Sport-specific analytics</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span className="text-sm text-gray-800 dark:text-gray-300">Export capabilities</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span className="text-sm text-gray-800 dark:text-gray-300">Advanced filtering systems</span>
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
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1 rotate-180" fill="none"
               stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
          </svg>
        }
      />


    </div>
  )
}
