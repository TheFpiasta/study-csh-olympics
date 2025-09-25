'use client';

import React, {useState, useEffect} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import ChartSectionPlaceholder from "../templates/ChartSectionPlaceholder";
import FinancialMetrics from "@/app/graphs/components/costAndProfit/FinancialMetrics";
import FinancialScatterPlot from "@/app/graphs/components/costAndProfit/FinancialScatterPlot";
import TemporalDevelopmentAnalyses from "@/app/graphs/components/temporalDevelopmnent/TemporalDevelopmentAnalyses";
import CostAndProfitabilityAnalyses from "@/app/graphs/components/costAndProfit/CostAndProfitabilityAnalyses";
import LongTermSankeyPlot from "@/app/graphs/components/capacityDistribution/LongTermSankeyPlot";
import CapacityBoxPlot from "@/app/graphs/components/capacityDistribution/CapacityBoxPlot";
import WorldGeographicAnalysis from "@/app/graphs/components/geographicalAnalysis/WorldGeographicAnalysis";
import CityGeoAnalysis from "@/app/graphs/components/geographicalAnalysis/CityGeoAnalysis";
import VenueSpread from "@/app/graphs/components/geographicalAnalysis/VenueSpread";

const CapacityDistributionAnalysis = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);

    }, [geojsonData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner/>
            </div>
        );
    }

    if (error) {
        return (
            <ShowError error={error}/>
        );
    }

    if (!data || !data.games || data.games.length === 0) {
        return (
            <ShowNoData/>
        );
    }

    return (
        <div className="space-y-8">
            <SectionHeader headline={"🌍 Geographic Analysis"}
                           description={"Analyze Olympic venue distribution across continents and countries."}
            />

            {/* Geographic Analysis Dashboard */}
            <div className="mx-4 mb-8">
                <WorldGeographicAnalysis geojsonData={geojsonData}/>
            </div>

          {/* Venue Spread and City Analysis - Side by Side */}
          <div className="mx-4 mb-8 grid lg:grid-cols-2 gap-8">
            {/* Venue Spread Chart */}
            <VenueSpread geojsonData={geojsonData}/>

            {/* Venue Pie Chart Dashboard */}
                <CityGeoAnalysis geojsonData={geojsonData}/>
            </div>
        </div>
    );
};

export default CapacityDistributionAnalysis;
