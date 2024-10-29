import React from "react";
import Chart, { plugins } from "chart.js/auto";
import { Pie } from "react-chartjs-2";

const ApexChart = ({ activitiesData }) => {
  const data = {
    labels: activitiesData?.map((data) => data?.activity).map(label => `${label} (min)`),
    datasets: [
      {
        label: "Time Spent",
        backgroundColor: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948"],
        data: activitiesData?.map((data) => data?.timeCalMins),
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins:{
      legend:{
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded'
        }
      }
    }
  };

  return (
    <div className="d-flex justify-content-center" style={{ width: '400px', height: '300px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default ApexChart;
