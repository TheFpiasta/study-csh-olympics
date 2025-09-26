'use client';

import React, {useEffect, useState} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import OlympicLineChart from "@/app/graphs/components/graphs/OlympicLineChart";
import OlympicGrowth from "@/app/graphs/components/graphs/OlympicGrowth";

const OlympicMetric = ({geojsonData}) => {
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
            <SectionHeader headline={"🏅 Olympic Metrics Over Time"}
                           description={"Explore the trends in the number of athletes, events, and countries participating in the Olympics over the years. Use the controls below to filter by Olympic season and data type."}
            />

            <div className="mx-4 mb-8">
                <OlympicLineChart geojsonData={geojsonData}/>
            </div>

            <div className="mx-4 mb-8">
                <OlympicGrowth data={data}/>
            </div>
        </div>
    );
};

export default OlympicMetric;
