import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

const ApexChart = ({ activitiesData }) => {
  
  const chartData = {
    series: activitiesData.map((data) => data.timeCalMins),
    options: {
      chart: {
        width: 350,
        type: 'pie',
      },
      labels: activitiesData.map((data) => data.activity).map(label => `${label} (min)`),
      tooltip: {
        y: {
          formatter: function (val) {
            return `${val} min`;
          }
        }
      },
      legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        fontSize: "10px",
        fontWeight: '600'
      },
      responsive: [{
        breakpoint: 300,
        options: {
          chart: {
            width: 200,
          },
        },
      }],
    }
  };

  return (
    <div className='d-flex justify-content-center'>
      <div id="chart">
        <ReactApexChart options={chartData.options} series={chartData.series} type='pie' width={350} />
      </div>
      <div id="html-dist"></div>
    </div>
  );
};

export default ApexChart;
