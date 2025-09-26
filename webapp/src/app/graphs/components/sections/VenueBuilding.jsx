'use client';

import React, {useEffect, useState} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import BuildStateTime from "@/app/graphs/components/graphs/BuildStateTime";
import LongTermSankeyPlot from "@/app/graphs/components/graphs/LongTermSankeyPlot";

const VenueBuilding = ({geojsonData}) => {
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
            <SectionHeader
                headline="🏟️ Venue Building"
                description="Comprehensive analysis of Olympic venue characteristics including capacity distribution and lifecycle flows from construction classification to current operational status."
            />
            <BuildStateTime data={data}/>

            <LongTermSankeyPlot data={data}/>
        </div>
    );
};

export default VenueBuilding;
