'use client';

import React, {useEffect, useState} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import WorldGeographicAnalysis from "@/app/graphs/components/graphs/WorldGeographicAnalysis";
import CityGeoAnalysis from "@/app/graphs/components/graphs/CityGeoAnalysis";
import VenueSpread from "@/app/graphs/components/graphs/VenueSpread";
import CityGeoAnalysisOld from "@/app/graphs/components/graphs/CityGeoAnalysisOld";

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
            <div className="mx-4 mb-8 grid lg:grid-cols-[2fr_1fr] gap-8">
                {/* Venue Spread Chart */}
                <VenueSpread geojsonData={geojsonData}/>

                {/* Venue Pie Chart Dashboard */}
                <CityGeoAnalysis geojsonData={geojsonData}/>
            </div>
        </div>
    );
};

export default CapacityDistributionAnalysis;
