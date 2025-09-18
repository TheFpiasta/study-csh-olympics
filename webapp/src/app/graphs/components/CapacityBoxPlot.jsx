'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveBoxPlot } from '@nivo/boxplot';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../components/LoadingSpinner';

const CapacityBoxPlot = ({ geojsonData }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!geojsonData) return;

    try {
      const perYear = {};

      geojsonData.data.games.forEach(game => {
        const year = game.year;

        if (!perYear[year]) perYear[year] = [];

        game.features.forEach(feature => {
          const capStr = feature.properties?.seating_capacity;

          if (!capStr) return; // überspringen, falls kein Wert

          // Kommas entfernen und in Zahl umwandeln
          const cap = parseInt(capStr.toString().replace(/,/g, ''), 10);

          if (!isNaN(cap)) {
            perYear[year].push(cap);
          }
        });
      });

      // Formatieren für BoxPlot
      const boxPlotData = Object.entries(perYear)
        .map(([year, capacities]) => ({
          group: year,
          data: capacities
        }))
        .filter(d => d.data.length > 0); // nur Jahre mit Daten

      setData(boxPlotData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [geojsonData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-300">Error loading data: {error}</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">
          No capacity data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        headline="Venue Capacity Distribution"
        description="Boxplot showing seating capacity distribution of Olympic venues per year."
      />

      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        <div className="h-96">
          <ResponsiveBoxPlot
            data={data}
            groupBy="group"
            margin={{ top: 50, right: 50, bottom: 80, left: 80 }}
            colors={{ scheme: 'category10' }}
            axisBottom={{
              legend: 'Year',
              legendPosition: 'middle',
              legendOffset: 50,
            }}
            axisLeft={{
              legend: 'Seating Capacity',
              legendPosition: 'middle',
              legendOffset: -60,
            }}
            boxWidth={30}
            minValue="auto"
            maxValue="auto"
          />
        </div>
      </div>
    </div>
  );
};

export default CapacityBoxPlot;
