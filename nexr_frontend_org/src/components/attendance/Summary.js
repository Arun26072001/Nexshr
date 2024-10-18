

import React, { useEffect, useState } from 'react';
import './Attendence.css';
import Popup from './Popup';
import { fetchEmployees, gettingClockinsData } from '../ReuseableAPI';
import { toast } from 'react-toastify';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { Doughnut } from 'react-chartjs-2';
import "./Summary.css";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

const Summary = () => {
    const empId = localStorage.getItem("_id");
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [clockinsData, setClockinsData] = useState(null);

    const [chartData, setChartData] = useState({
        labels: ['Early', 'Late', 'Regular'],
        datasets: [
            {
                data: [0, 0, 0], // Initial dummy data
                backgroundColor: ['#FF4560', '#008FFB', '#775DD0'],
            },
        ],
    });

    // Fetch clockins data
    async function selectEmpClockins(id) {
        setSelectedEmployeeId(id); // Update selected employee ID
        if (id) {
            try {
                const data = await gettingClockinsData(id) || {};
                console.log("Selected Employee Clockins Data:", data);

                if (data) {
                    setClockinsData(data);
                    setChartData({
                        ...chartData,
                        datasets: [{
                            ...chartData.datasets[0],
                            data: [
                                data.totalEarlyLogins || 0,
                                data.totalLateLogins || 0,
                                data.totalRegularLogins || 0,
                            ],
                        }],
                    });
                } else {
                    toast.error("Error in getting clockins data!");
                }
            } catch (error) {
                console.error("Error fetching clockins data:", error);
                toast.error("An error occurred while fetching clockins data!");
            }
        } else {
            setClockinsData(null); // Reset data if no employee is selected
            setChartData({
                ...chartData,
                datasets: [{
                    ...chartData.datasets[0],
                    data: [0, 0, 0], // Reset chart data
                }],
            });
        }
    }

    const getEmpData = async () => {
        try {
            const emps = await fetchEmployees();
            setEmployees(emps);
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("An error occurred while fetching employees!");
        }
    };

    useEffect(() => {
        const getClockinsData = async () => {
            if (empId) {
                try {
                    const data = await gettingClockinsData(empId) || {};

                    if (data) {
                        setClockinsData(data);
                        setChartData({
                            ...chartData,
                            datasets: [{
                                ...chartData?.datasets[0],
                                data: [
                                    data?.totalEarlyLogins || 0,
                                    data?.totalLateLogins || 0,
                                    data?.totalRegularLogins || 0,
                                ],
                            }],
                        });
                    } else {
                        toast.error("Error in getting clockins data!");
                    }
                } catch (error) {
                    console.error("Error fetching clockins data:", error);
                    toast.error("An error occurred while fetching clockins data!");
                }
            }
        };

        getClockinsData(); // Fetch data on mount
        getEmpData(); // Fetch other employee data
    }, [empId]);

    return (
        <div className='dashboard-parent pt-4'>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h5 className='text-daily'>Summary</h5>
                </div>
                <div className='d-flex'>
                    <Popup />
                    <div className='ms-2'>
                        <button className="btn attends btn-light w-100" type="button" id="dropdownMenuButton1">
                            <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 1.5V9.77273M7.5 1.5L10.0606 3.86364M7.5 1.5L4.93939 3.86364M14 10.9545V12.9242C14 13.7945 13.2945 14.5 12.4242 14.5H2.57576C1.70549 14.5 1 13.7945 1 12.9242V10.9545" stroke="#0A0A0A" strokeWidth="1.20741" strokeLinecap="round" strokeLinejoin="round" />
                            </svg> Export
                        </button>
                    </div>
                </div>
            </div>

            <div className='row container-fluid attendanceFile'>
                <div className="row d-flex justify-content-end">
                    <div className="col-12 col-md-4">
                        <select className="form-select" onChange={(e) => selectEmpClockins(e.target.value)}>
                            <option value="0">Select Profile</option>
                            {employees?.length > 0 && employees?.map((data) => (
                                <option key={data?._id} value={data?._id}>
                                    {data?.FirstName} {data?.LastName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedEmployeeId && ( // Render chart and summary only when an employee is selected
                    <>
                        <div className='col-lg-6 d-flex align-items-center justify-content-center'>
                            <div className="chart" style={{ width: '200px' }}>
                                {chartData?.datasets[0]?.data?.some(value => value > 0) ? (
                                    <Doughnut data={chartData} />
                                ) : (
                                    <p>No data available for the chart</p>
                                )}
                            </div>
                        </div>

                        <div className='col-lg-6 d-block align-content-center'>
                            <div className='row summary-card'>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{clockinsData?.companyTotalWorkingHour || 0}</p>
                                    <p>Total schedule hour</p>
                                </div>
                                <div className='col-lg-2'><div className="summary-divider"></div></div>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{(Number(clockinsData?.totalLeaveDays) * 9) || 0} hr</p>
                                    <p>Leave hour</p>
                                </div>
                            </div>
                            <div className='row summary-card mt-2'>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{clockinsData?.totalEmpWorkingHours || 0} hr</p>
                                    <p>Total work</p>
                                </div>
                                <div className='col-lg-2'><div className="summary-divider"></div></div>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{((Number(clockinsData?.totalEmpWorkingHours) || 0) / 9).toFixed(2) || 0} days</p>
                                    <p>Total active</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>

            {clockinsData?.clockIns?.length > 0 ? (
                <LeaveTable data={clockinsData.clockIns} />
            ) : clockinsData?.clockIns?.length === 0 ? (
                <NoDataFound message={"Attendance data not found"} />
            ) : (
                <Loading />
            )}
        </div>
    );
};

export default Summary;


// import React, { useEffect, useState } from 'react';
// import './Attendence.css';
// import Popup from './Popup';
// import Chart from 'react-apexcharts';
// import './Summary.css';
// import { fetchEmployees, gettingClockinsData } from '../ReuseableAPI';
// import { toast } from 'react-toastify';
// import LeaveTable from '../LeaveTable';
// import NoDataFound from '../payslip/NoDataFound';
// import Loading from '../Loader';

// const Summary = () => {
//     const empId = localStorage.getItem("_id");
//     const [clockinsData, setClockinsData] = useState({});
//     const [employees, setEmployees] = useState([]);
//     const [chartOptions, setChartOptions] = useState({
//         chart: {
//             type: 'donut',
//         },
//         labels: ['Early', 'Late', 'Regular'],
//         colors: ['#FF4560', '#008FFB', '#775DD0'],
//     });
//     const [chartSeries, setChartSeries] = useState([]);

//     async function selectEmpClockins(id) {
//         if (empId) {
//             const data = await gettingClockinsData(id);
//             if (data) {
//                 setClockinsData(data);

//                 // Now update chart series
//                 setChartSeries([
//                     data?.totalEarlyLogins || 0,
//                     data?.totalLateLogins || 0,
//                     data?.totalRegularLogins || 0
//                 ]);
//             } else {
//                 toast.error("Error in getting clockins data!");
//             }
//         }
//     }

//     const getEmpData = async () => {
//         const emps = await fetchEmployees();
//         setEmployees(emps);
//     }

//     useEffect(() => {
//         const getClockinsData = async () => {
//             if (empId) {
//                 const data = await gettingClockinsData(empId);
//                 if (data) {
//                     setClockinsData(data);

//                     // Now update chart series
//                     setChartSeries([
//                         data?.totalEarlyLogins || 0,
//                         data?.totalLateLogins || 0,
//                         data?.totalRegularLogins || 0
//                     ]);
//                 } else {
//                     toast.error("Error in getting clockins data!");
//                 }
//             }
//         };
//         getClockinsData();
//         getEmpData();
//     }, [empId]); // Add empId as dependency to useEffect

//     return (
//         <div className='dashboard-parent pt-4'>
//             <div className="d-flex justify-content-between align-items-center">
//                 <div>
//                     <h5 className='text-daily'>Summary</h5>
//                 </div>
//                 <div className='d-flex'>
//                     <Popup />
//                     <div className='ms-2'>
//                         <button className="btn attends btn-light w-100" type="button" id="dropdownMenuButton1">
//                             <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <path d="M7.5 1.5V9.77273M7.5 1.5L10.0606 3.86364M7.5 1.5L4.93939 3.86364M14 10.9545V12.9242C14 13.7945 13.2945 14.5 12.4242 14.5H2.57576C1.70549 14.5 1 13.7945 1 12.9242V10.9545" stroke="#0A0A0A" strokeWidth="1.20741" strokeLinecap="round" strokeLinejoin="round" />
//                             </svg> Export
//                         </button>
//                     </div>
//                 </div>
//             </div>


//             <div className='row container-fluid attendanceFile'>
//                 <div className="row d-flex justify-content-end">
//                     <div className="col-12 col-md-4">
//                         {/* Profile selection dropdown */}
//                         <select className="form-select" onChange={(e) => selectEmpClockins(e.target.value)}>
//                             <option value="">Select Profile</option>
//                             {
//                                 employees?.length > 0 &&
//                                 employees.map((data) => {
//                                     return <option value={data._id}>{data.FirstName + data.LastName}</option>
//                                 })
//                             }
//                         </select>
//                     </div>
//                 </div>
//                 <div className='col-lg-6 d-flex align-items-center justify-content-center'>
//                     <div className="chart" style={{ width: '300px' }}>
//                         <Chart options={chartOptions} series={chartSeries} type="donut" />
//                     </div>
//                 </div>

//                 <div className='col-lg-6 d-block align-content-center'>
//                     <div className='row summary-card'>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{clockinsData?.companyTotalWorkingHour}</p>
//                                 <p>Total schedule hour</p>
//                             </div>
//                         </div>
//                         <div className='col-lg-2'><div className="summary-divider"></div></div>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{Number(clockinsData?.totalLeaveDays) * 9} hr</p>
//                                 <p>Leave hour</p>
//                             </div>
//                         </div>
//                     </div>
//                     <div className='row summary-card mt-2'>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{clockinsData?.totalEmpWorkingHours} hr</p>
//                                 <p>Total work</p>
//                             </div>
//                         </div>
//                         <div className='col-lg-2'><div className="summary-divider"></div></div>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{(Number(clockinsData?.totalEmpWorkingHours) / 9).toFixed(2)} days</p>
//                                 <p>Total active</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>



//             {
//                 clockinsData?.clockIns?.length > 0 ? (
//                     <LeaveTable data={clockinsData.clockIns} />
//                 ) : clockinsData?.clockIns?.length === 0 ? (
//                     <NoDataFound message={"Attendance data not found"} />
//                 ) : <Loading />
//             }
//         </div>
//     );
// };

// export default Summary;



// import React, { useEffect, useState } from 'react';
// import './Attendence.css';
// import Popup from './Popup';
// import Chart from 'react-apexcharts';
// import './Summary.css';
// import { fetchEmployees, gettingClockinsData } from '../ReuseableAPI';
// import { toast } from 'react-toastify';
// import LeaveTable from '../LeaveTable';
// import NoDataFound from '../payslip/NoDataFound';
// import Loading from '../Loader';

// const Summary = () => {
//     const empId = localStorage.getItem("_id");
//     const [employees, setEmployees] = useState([]);
//     const [chartOptions, setChartOptions] = useState({
//         chart: {
//             type: 'donut',
//         },
//         labels: ['Early', 'Late', 'Regular'],
//         colors: ['#FF4560', '#008FFB', '#775DD0'],
//     });
//     const [chartSeries, setChartSeries] = useState([0, 0, 0]); // Start with default values
//     const [clockinsData, setClockinsData] = useState(null); // State for clockins data

//     // Fetch clockins data
//     async function selectEmpClockins(id) {
//         if (id) {
//             try {
//                 const data = await gettingClockinsData(id) || {}; // Fetch the data and ensure it's an object
//                 console.log("Selected Employee Clockins Data:", data); // Log the fetched data

//                 if (data) {
//                     setClockinsData(data);

//                     // Update chart series with values or default to 0
//                     setChartSeries([
//                         data.totalEarlyLogins || 0,
//                         data.totalLateLogins || 0,
//                         data.totalRegularLogins || 0
//                     ]);
//                 } else {
//                     toast.error("Error in getting clockins data!");
//                 }
//             } catch (error) {
//                 console.error("Error fetching clockins data:", error);
//                 toast.error("An error occurred while fetching clockins data!");
//             }
//         }
//     }

//     const getEmpData = async () => {
//         try {
//             const emps = await fetchEmployees();
//             setEmployees(emps);
//         } catch (error) {
//             console.error("Error fetching employees:", error);
//             toast.error("An error occurred while fetching employees!");
//         }
//     };

//     useEffect(() => {
//         const getClockinsData = async () => {
//             if (empId) {
//                 try {
//                     const data = await gettingClockinsData(empId) || {}; // Ensure data is an object
//                     console.log("Clockins Data:", data); // Log the data for inspection

//                     if (data) {
//                         setClockinsData(data);

//                         // Ensure that the values exist or default to 0
//                         setChartSeries([
//                             data.totalEarlyLogins || 0,
//                             data.totalLateLogins || 0,
//                             data.totalRegularLogins || 0
//                         ]);
//                     } else {
//                         toast.error("Error in getting clockins data!");
//                     }
//                 } catch (error) {
//                     console.error("Error fetching clockins data:", error);
//                     toast.error("An error occurred while fetching clockins data!");
//                 }
//             }
//         };

//         getClockinsData(); // Fetch data on mount
//         getEmpData(); // Fetch other employee data

//     }, [empId]); // Add empId as dependency to useEffect

//     return (
//         <div className='dashboard-parent pt-4'>
//             <div className="d-flex justify-content-between align-items-center">
//                 <div>
//                     <h5 className='text-daily'>Summary</h5>
//                 </div>
//                 <div className='d-flex'>
//                     <Popup />
//                     <div className='ms-2'>
//                         <button className="btn attends btn-light w-100" type="button" id="dropdownMenuButton1">
//                             <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <path d="M7.5 1.5V9.77273M7.5 1.5L10.0606 3.86364M7.5 1.5L4.93939 3.86364M14 10.9545V12.9242C14 13.7945 13.2945 14.5 12.4242 14.5H2.57576C1.70549 14.5 1 13.7945 1 12.9242V10.9545" stroke="#0A0A0A" strokeWidth="1.20741" strokeLinecap="round" strokeLinejoin="round" />
//                             </svg> Export
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <div className='row container-fluid attendanceFile'>
//                 <div className="row d-flex justify-content-end">
//                     <div className="col-12 col-md-4">
//                         {/* Profile selection dropdown */}
//                         <select className="form-select" onChange={(e) => selectEmpClockins(e.target.value)}>
//                             <option value="">Select Profile</option>
//                             {employees.length > 0 && employees.map((data) => (
//                                 <option key={data._id} value={data._id}>
//                                     {data.FirstName + " " + data.LastName}
//                                 </option>
//                             ))}
//                         </select>
//                     </div>
//                 </div>
//                 <div className='col-lg-6 d-flex align-items-center justify-content-center'>
//                     <div className="chart" style={{ width: '300px' }}>
//                         {/* Render chart only if there are valid series data */}
//                         {chartSeries.some(value => value > 0) ? (
//                             <Chart options={chartOptions} series={chartSeries} type="donut" />
//                         ) : (
//                             <p>No data available for the chart</p>
//                         )}
//                     </div>
//                 </div>

//                 <div className='col-lg-6 d-block align-content-center'>
//                     <div className='row summary-card'>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{clockinsData?.companyTotalWorkingHour || 0}</p>
//                                 <p>Total schedule hour</p>
//                             </div>
//                         </div>
//                         <div className='col-lg-2'><div className="summary-divider"></div></div>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{(Number(clockinsData?.totalLeaveDays) * 9) || 0} hr</p>
//                                 <p>Leave hour</p>
//                             </div>
//                         </div>
//                     </div>
//                     <div className='row summary-card mt-2'>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{clockinsData?.totalEmpWorkingHours || 0} hr</p>
//                                 <p>Total work</p>
//                             </div>
//                         </div>
//                         <div className='col-lg-2'><div className="summary-divider"></div></div>
//                         <div className='col-lg-5'>
//                             <div>
//                                 <p className='numvalue'>{((Number(clockinsData?.totalEmpWorkingHours) || 0) / 9).toFixed(2) || 0} days</p>
//                                 <p>Total active</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {clockinsData?.clockIns?.length > 0 ? (
//                 <LeaveTable data={clockinsData.clockIns} />
//             ) : clockinsData?.clockIns?.length === 0 ? (
//                 <NoDataFound message={"Attendance data not found"} />
//             ) : (
//                 <Loading />
//             )}
//         </div>
//     );
// };

// export default Summary;












// import React, { useEffect, useState } from 'react';
// import './Attendence.css';
// import Popup from './Popup';
// import { fetchEmployees, gettingClockinsData } from '../ReuseableAPI';
// import { toast } from 'react-toastify';
// import LeaveTable from '../LeaveTable';
// import NoDataFound from '../payslip/NoDataFound';
// import Loading from '../Loader';
// import { Doughnut } from 'react-chartjs-2';
// import "./Summary.css";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// // Register necessary components
// ChartJS.register(ArcElement, Tooltip, Legend);

// const Summary = () => {
//     const empId = localStorage.getItem("_id");
//     const [employees, setEmployees] = useState([]);
//     console.log(employees, "employees")
//     const [clockinsData, setClockinsData] = useState(null);

//     const [chartData, setChartData] = useState({
//         labels: ['Early', 'Late', 'Regular'],
//         datasets: [
//             {
//                 data: [0, 0, 0], // Initial dummy data
//                 backgroundColor: ['#FF4560', '#008FFB', '#775DD0'],
//             },
//         ],
//     });

//     // Fetch clockins data
//     async function selectEmpClockins(id) {
//         if (id) {
//             try {
//                 const data = await gettingClockinsData(id) || {};
//                 console.log("Selected Employee Clockins Data:", data);

//                 if (data) {
//                     setClockinsData(data);
//                     setChartData({
//                         ...chartData,
//                         datasets: [{
//                             ...chartData.datasets[0],
//                             data: [
//                                 data.totalEarlyLogins || 0,
//                                 data.totalLateLogins || 0,
//                                 data.totalRegularLogins || 0,
//                             ],
//                         }],
//                     });
//                 } else {
//                     toast.error("Error in getting clockins data!");
//                 }
//             } catch (error) {
//                 console.error("Error fetching clockins data:", error);
//                 toast.error("An error occurred while fetching clockins data!");
//             }
//         }
//     }

//     const getEmpData = async () => {
//         try {
//             const emps = await fetchEmployees();
//             setEmployees(emps);
//         } catch (error) {
//             console.error("Error fetching employees:", error);
//             toast.error("An error occurred while fetching employees!");
//         }
//     };

//     useEffect(() => {
//         const getClockinsData = async () => {
//             if (empId) {
//                 try {
//                     const data = await gettingClockinsData(empId) || {};
//                     console.log("Clockins Data:", data);

//                     if (data) {
//                         setClockinsData(data);
//                         setChartData({
//                             ...chartData,
//                             datasets: [{
//                                 ...chartData.datasets[0],
//                                 data: [
//                                     data.totalEarlyLogins || 0,
//                                     data.totalLateLogins || 0,
//                                     data.totalRegularLogins || 0,
//                                 ],
//                             }],
//                         });
//                     } else {
//                         toast.error("Error in getting clockins data!");
//                     }
//                 } catch (error) {
//                     console.error("Error fetching clockins data:", error);
//                     toast.error("An error occurred while fetching clockins data!");
//                 }
//             }
//         };

//         getClockinsData(); // Fetch data on mount
//         getEmpData(); // Fetch other employee data

//     }, [empId]);

//     return (
//         <div className='dashboard-parent pt-4'>
//             <div className="d-flex justify-content-between align-items-center">
//                 <div>
//                     <h5 className='text-daily'>Summary</h5>
//                 </div>
//                 <div className='d-flex'>
//                     <Popup />
//                     <div className='ms-2'>
//                         <button className="btn attends btn-light w-100" type="button" id="dropdownMenuButton1">
//                             <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <path d="M7.5 1.5V9.77273M7.5 1.5L10.0606 3.86364M7.5 1.5L4.93939 3.86364M14 10.9545V12.9242C14 13.7945 13.2945 14.5 12.4242 14.5H2.57576C1.70549 14.5 1 13.7945 1 12.9242V10.9545" stroke="#0A0A0A" strokeWidth="1.20741" strokeLinecap="round" strokeLinejoin="round" />
//                             </svg> Export
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <div className='row container-fluid attendanceFile'>
//                 <div className="row d-flex justify-content-end">
//                     <div className="col-12 col-md-4">
//                         <select className="form-select" onChange={(e) => selectEmpClockins(e.target.value)}>
//                             <option value="0">Select Profile</option>
//                             {employees.length > 0 && employees.map((data) => (
//                                 <option key={data._id} value={data._id}>
//                                     {data.FirstName}
//                                 </option>
//                             ))}
//                         </select>
//                     </div>
//                 </div>

//                 <div className='col-lg-6 d-flex align-items-center justify-content-center'>
//                     <div className="chart" style={{ width: '200px' }}>
//                         {chartData.datasets[0].data.some(value => value > 0) ? (
//                             <Doughnut data={chartData} />
//                         ) : (
//                             <p>No data available for the chart</p>
//                         )}
//                     </div>
//                 </div>

//                 <div className='col-lg-6 d-block align-content-center'>
//                     <div className='row summary-card'>
//                         <div className='col-lg-5'>
//                             <p className='numvalue'>{clockinsData?.companyTotalWorkingHour || 0}</p>
//                             <p>Total schedule hour</p>
//                         </div>
//                         <div className='col-lg-2'><div className="summary-divider"></div></div>
//                         <div className='col-lg-5'>
//                             <p className='numvalue'>{(Number(clockinsData?.totalLeaveDays) * 9) || 0} hr</p>
//                             <p>Leave hour</p>
//                         </div>
//                     </div>
//                     <div className='row summary-card mt-2'>
//                         <div className='col-lg-5'>
//                             <p className='numvalue'>{clockinsData?.totalEmpWorkingHours || 0} hr</p>
//                             <p>Total work</p>
//                         </div>
//                         <div className='col-lg-2'><div className="summary-divider"></div></div>
//                         <div className='col-lg-5'>
//                             <p className='numvalue'>{((Number(clockinsData?.totalEmpWorkingHours) || 0) / 9).toFixed(2) || 0} days</p>
//                             <p>Total active</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {clockinsData?.clockIns?.length > 0 ? (
//                 <LeaveTable data={clockinsData.clockIns} />
//             ) : clockinsData?.clockIns?.length === 0 ? (
//                 <NoDataFound message={"Attendance data not found"} />
//             ) : (
//                 <Loading />
//             )}
//         </div>
//     );
// };

// export default Summary;
