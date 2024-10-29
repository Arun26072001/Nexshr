import React, { useEffect, useState } from 'react';
import Popup from './Popup';
import { Doughnut } from 'react-chartjs-2';
import { fetchEmployees, gettingClockinsData } from '../ReuseableAPI';
import { toast } from 'react-toastify';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import "./Summary.css";

const Summary = () => {
    const empId = localStorage.getItem("_id");
    const [clockinsData, setClockinsData] = useState({});
    const [employees, setEmployees] = useState([]);
    const [chartData, setChartData] = useState({
        labels: ['Early', 'Late', 'Regular'],
        datasets: [{
            label: 'Time Spent',
            backgroundColor: ['#FF4560', '#008FFB', '#775DD0'],
            data: [],
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

    async function selectEmpClockins(id) {
        if (id) {
            const data = await gettingClockinsData(id);
            if (data) {
                setClockinsData(data);
                updateChartData(data);
            } else {
                toast.error("Error in getting clockins data!");
            }
        }
    }

    const getEmpData = async () => {
        const emps = await fetchEmployees();
        setEmployees(emps);
    };

    const updateChartData = (data) => {
        setChartData({
            ...chartData,
            datasets: [{
                ...chartData.datasets[0],
                data: [
                    data?.totalEarlyLogins || 0,
                    data?.totalLateLogins || 0,
                    data?.totalRegularLogins || 0
                ],
            }],
        });
    };

    useEffect(() => {
        const getClockinsData = async () => {
            if (empId) {
                const data = await gettingClockinsData(empId);
                if (data) {
                    setClockinsData(data);
                    updateChartData(data);
                } else {
                    toast.error("Error in getting clockins data!");
                }
            }
        };
        getClockinsData();
        getEmpData();
    }, [empId]);

    return (
        <div className='dashboard-parent pt-4'>
            <div className="d-flex justify-content-between align-items-center">
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

            {clockinsData?.clockIns?.length > 0 ? (
                <>
                    <div className='row container-fluid attendanceFile'>
                        <div className="row d-flex justify-content-end">
                            <div className="col-12 col-md-4">
                                <select className="form-select" onChange={(e) => selectEmpClockins(e.target.value)}>
                                    <option value="">Select Profile</option>
                                    {employees?.map((employee) => (
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
                                    <p className='numvalue'>{clockinsData?.companyTotalWorkingHour}</p>
                                    <p>Total schedule hour</p>
                                </div>
                                <div className='col-lg-2'><div className="summary-divider"></div></div>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{Number(clockinsData?.totalLeaveDays) * 9} hr</p>
                                    <p>Leave hour</p>
                                </div>
                            </div>
                            <div className='row summary-card mt-2'>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{clockinsData?.totalEmpWorkingHours} hr</p>
                                    <p>Total work</p>
                                </div>
                                <div className='col-lg-2'><div className="summary-divider"></div></div>
                                <div className='col-lg-5'>
                                    <p className='numvalue'>{(Number(clockinsData?.totalEmpWorkingHours) / 9).toFixed(2)} days</p>
                                    <p>Total active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <LeaveTable data={clockinsData.clockIns} />
                </>
            ) : clockinsData?.clockIns?.length === 0 ? (
                <NoDataFound message={"Attendance data not found"} />
            ) : (
                <Loading />
            )}
        </div>
    );
};

export default Summary;
