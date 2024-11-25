import React from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ApexChart = ({ activitiesData }) => {
    const data = {
        labels: activitiesData?.map((data) => data?.activity).map((label) => `${label} (min)`),
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
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    pointStyle: "rectRounded",
                },
            },
        },
    };

    return (
        <div className="d-flex" style={{ width: "338px", height: "300px" }}>
            <Pie data={data} options={options} />
        </div>
    );
};

export default ApexChart;
