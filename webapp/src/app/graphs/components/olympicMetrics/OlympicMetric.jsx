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
import OlympicLineChart from "@/app/graphs/components/olympicMetrics/OlympicLineChart";
import OlympicGrowth from "@/app/graphs/components/olympicMetrics/OlympicGrowth";

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
      <SectionHeader headline={"Olympic Metrics Over Time"}
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
