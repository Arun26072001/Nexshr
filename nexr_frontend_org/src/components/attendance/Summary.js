import React, { useEffect, useState } from 'react';
import './Attendence.css';
import Popup from './Popup';
import Chart from 'react-apexcharts';
import './Summary.css';
import { gettingClockinsData } from '../ReuseableAPI';
import { toast } from 'react-toastify';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';

const Summary = () => {
    const empId = localStorage.getItem("_id");
    const [clockinsData, setClockinsData] = useState({});
    const [chartOptions, setChartOptions] = useState({
        chart: {
            type: 'donut',
        },
        labels: ['Early', 'Late', 'Regular'],
        colors: ['#FF4560', '#008FFB', '#775DD0'],
    });
    const [chartSeries, setChartSeries] = useState([]);

    useEffect(() => {
        const getClockinsData = async () => {
            if (empId) {
                const data = await gettingClockinsData(empId);
                if (data) {
                    setClockinsData(data);

                    // Now update chart series
                    setChartSeries([
                        data?.totalEarlyLogins || 0,
                        data?.totalLateLogins || 0,
                        data?.totalRegularLogins || 0
                    ]);
                } else {
                    toast.error("Error in getting clockins data!");
                }
            }
        };
        getClockinsData();
    }, [empId]); // Add empId as dependency to useEffect

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
                <div className='col-lg-6 d-flex align-items-center justify-content-center'>
                    <div className="chart" style={{ width: '300px' }}>
                        <Chart options={chartOptions} series={chartSeries} type="donut" />
                    </div>
                </div>

                <div className='col-lg-6 d-block align-content-center'>
                    <div className='row summary-card'>
                        <div className='col-lg-5'>
                            <div>
                                <p className='numvalue'>{clockinsData?.companyTotalWorkingHour}</p>
                                <p>Total schedule hour</p>
                            </div>
                        </div>
                        <div className='col-lg-2'><div className="summary-divider"></div></div>
                        <div className='col-lg-5'>
                            <div>
                                <p className='numvalue'>{Number(clockinsData?.totalLeaveDays) * 9} hr</p>
                                <p>Leave hour</p>
                            </div>
                        </div>
                    </div>
                    <div className='row summary-card mt-2'>
                        <div className='col-lg-5'>
                            <div>
                                <p className='numvalue'>{clockinsData?.totalEmpWorkingHours} hr</p>
                                <p>Total work</p>
                            </div>
                        </div>
                        <div className='col-lg-2'><div className="summary-divider"></div></div>
                        <div className='col-lg-5'>
                            <div>
                                <p className='numvalue'>{(Number(clockinsData?.totalEmpWorkingHours) / 9).toFixed(2)} days</p>
                                <p>Total active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            

            {
                clockinsData?.clockIns?.length > 0 ? (
                    <LeaveTable data={clockinsData.clockIns} />
                ) : clockinsData?.clockIns?.length === 0 ? (
                    <NoDataFound message={"Attendance data not found"} />
                ) : <Loading />
            }
        </div>
    );
};

export default Summary;
