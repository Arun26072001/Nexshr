import React, { useContext, useEffect, useState } from 'react';
import Popup from './Popup';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchEmployees, gettingClockinsData } from '../ReuseableAPI';
import { toast } from 'react-toastify';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import "./Summary.css";
import { EssentialValues } from '../../App';

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Summary = () => {
    const { data } = useContext(EssentialValues);
    const { _id, Name } = data || {}; // Ensure safe access to `_id` & `Name`

    const [employees, setEmployees] = useState([]);
    const [clockinsData, setClockinsData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState({
        labels: ['Early', 'Late', 'Regular'],
        datasets: [{
            label: 'Time Spent',
            backgroundColor: ['#FF4560', '#008FFB', '#775DD0'],
            data: [0, 0, 0], // Initialize with default values
        }],
    });

    const options = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rectRounded'
                }
            }
        }
    };

    // Fetch clockins data
    const selectEmpClockins = async (id) => {
        setIsLoading(true);
        try {
            if (id) {
                const data = await gettingClockinsData(id);
                if (data) {
                    setClockinsData(data);
                    updateChartData(data);
                } else {
                    toast.error("Error in getting clockins data!");
                }
            } else {
                setClockinsData({});
                resetChartData();
            }
        } catch (error) {
            toast.error("An error occurred while fetching clockins data.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch employee data
    const getEmpData = async () => {
        try {
            const emps = await fetchEmployees();
            console.log(emps);

            if (emps) setEmployees(emps);
        } catch (error) {
            toast.error("Error fetching employees.");
        }
    };

    // Update chart data safely
    const updateChartData = (data) => {
        setChartData((prevChartData) => ({
            ...prevChartData,
            datasets: [{
                ...prevChartData.datasets[0],
                data: [
                    data?.totalEarlyLogins || 0,
                    data?.totalLateLogins || 0,
                    data?.totalRegularLogins || 0
                ],
            }],
        }));
    };

    // Reset chart data
    const resetChartData = () => {
        setChartData((prevChartData) => ({
            ...prevChartData,
            datasets: [{
                ...prevChartData.datasets[0],
                data: [0, 0, 0],
            }],
        }));
    };

    useEffect(() => {
        const getClockinsData = async () => {
            if (_id) {
                try {
                    const data = await gettingClockinsData(_id);
                    if (data) {
                        setClockinsData(data);
                        updateChartData(data);
                    } else {
                        toast.error("Error in getting clockins data!");
                    }
                } catch (error) {
                    toast.error("An error occurred while fetching data.");
                }
            }
        };
        getClockinsData();
        getEmpData();
    }, [_id]);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className='dashboard-parent pt-4'>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h5 className='text-daily'>Summary</h5>
                <div className='d-flex'>
                    <Popup />
                    <button className="btn attends btn-light ms-2" type="button">
                        <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 1.5V9.77273M7.5 1.5L10.0606 3.86364M7.5 1.5L4.93939 3.86364M14 10.9545V12.9242C14 13.7945 13.2945 14.5 12.4242 14.5H2.57576C1.70549 14.5 1 13.7945 1 12.9242V10.9545" stroke="#0A0A0A" strokeWidth="1.20741" strokeLinecap="round" strokeLinejoin="round" />
                        </svg> Export
                    </button>
                </div>
            </div>

            <div className='row container-fluid attendanceFile m-0'>
                <div className="row d-flex justify-content-end">
                    <div className="col-12 col-md-4">
                        <select className="form-select mt-2" onChange={(e) => selectEmpClockins(e.target.value)}>
                            <option value={_id}>{Name || "Select Employee"}</option>

                            {employees.length &&
                                employees?.map((employee) => (
                                    <option key={employee._id} value={employee._id}>
                                        {`${employee.FirstName} ${employee.LastName}`}
                                    </option>
                                ))} 
                        </select>
                    </div>
                </div>
                <div className='col-lg-6 d-flex align-items-center justify-content-center'>
                    <div className="d-flex justify-content-center" style={{ width: '300px', height: '200px' }}>
                        <Doughnut data={chartData} options={options} />
                    </div>
                </div>
                <div className='col-lg-6'>
                    <div className='row summary-card'>
                        <div className='col-lg-5'>
                            <p className='numvalue'>{clockinsData?.companyTotalWorkingHour || 0}</p>
                            <p>Total schedule hour</p>
                        </div>
                        <div className='col-lg-2'><div className="summary-divider"></div></div>
                        <div className='col-lg-5'>
                            <p className='numvalue'>{(Number(clockinsData?.totalLeaveDays || 0) * 9)} hr</p>
                            <p>Leave hour</p>
                        </div>
                    </div>
                </div>
            </div>

            {clockinsData?.clockIns?.length > 0 ? (
                <LeaveTable data={clockinsData.clockIns} />
            ) : (
                <NoDataFound message={"No Attendance data for this month!"} />
            )}
        </div>
    );
};

export default Summary;
