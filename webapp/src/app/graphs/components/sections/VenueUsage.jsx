'use client';

import React, {useEffect, useState} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import NumberVenues from "@/app/graphs/components/graphs/NumberVenues";
import BuildStateTime from "@/app/graphs/components/graphs/BuildStateTime";
import LongTermSankeyPlot from "@/app/graphs/components/graphs/LongTermSankeyPlot";
import CapacityBoxPlot from "@/app/graphs/components/graphs/CapacityBoxPlot";

const VenueUsage = ({geojsonData}) => {
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
            <SectionHeader headline={"📈 Venue Usage"}
                           description={"Analysis of Olympic venue development patterns over time, infrastructure evolution, and historical trends"}
            />

            <NumberVenues data={data}/>

            <CapacityBoxPlot data={data}/>
        </div>
    );
};

export default VenueUsage;
