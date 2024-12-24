import React from 'react';
import './Attendence.css';
import Popup from './Popup';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';

const Dailylog = ({ attendanceData, isLoading }) => {

    return (
        isLoading ? <Loading /> :
            <div className='dashboard-parent pt-4'>

                <div className='col-lg-12 row'>
                    <div className='col-lg-3 text-start'>
                        <h5 className='text-daily'>Daily Log</h5>
                    </div>
                    <div className='col-lg-3 text-center'>
                        <Popup />
                    </div>
                    <div className='col-lg-2 text-center'>
                        <button className="btn attend btn-dark" type="button" id="dropdownMenuButton1">
                            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_259_62500)">
                                    <path d="M8.5 15.5V7.22727M8.5 15.5L5.93939 13.1364M8.5 15.5L11.0606 13.1364M2 6.04545V4.07576C2 3.20549 2.70549 2.5 3.57576 2.5H13.4242C14.2945 2.5 15 3.20549 15 4.07576V6.04545" stroke="white" stroke-width="1.20741" stroke-linecap="round" stroke-linejoin="round" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_259_62500">
                                        <rect width="16" height="16" fill="white" transform="matrix(-1 0 0 -1 16 16.5)" />
                                    </clipPath>
                                </defs>
                            </svg> Import
                        </button>
                    </div>
                    <div className='col-lg-2 text-center'>

                        <button className="btn attend btn-dark" type="button" id="dropdownMenuButton1">
                            <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 1.5V9.77273M7.5 1.5L10.0606 3.86364M7.5 1.5L4.93939 3.86364M14 10.9545V12.9242C14 13.7945 13.2945 14.5 12.4242 14.5H2.57576C1.70549 14.5 1 13.7945 1 12.9242V10.9545" stroke="white" stroke-width="1.20741" stroke-linecap="round" stroke-linejoin="round" />
                            </svg> Export
                        </button>
                    </div>
                    <div className='col-lg-2 text-center'>
                        <button className="btn attends btn-light" type="button" id="dropdownMenuButton1">
                            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_2250_1079)">
                                    <path d="M9.07576 2.68182C9.07576 2.02912 8.54664 1.5 7.89394 1.5H7.10606C6.45336 1.5 5.92424 2.02912 5.92424 2.68182V3.24474C5.92424 3.5957 5.49991 3.77147 5.25175 3.5233L4.85371 3.12526C4.39218 2.66373 3.6439 2.66373 3.18237 3.12526L2.62525 3.68238C2.16372 4.1439 2.16372 4.89219 2.62525 5.35372L3.02328 5.75175C3.27145 5.99991 3.09568 6.42424 2.74472 6.42424L2.18182 6.42424C1.52912 6.42424 1 6.95336 1 7.60606L1 8.39394C1 9.04664 1.52912 9.57576 2.18182 9.57576H2.7447C3.09566 9.57576 3.27142 10.0001 3.02326 10.2483L2.62525 10.6463C2.16372 11.1078 2.16372 11.8561 2.62525 12.3176L3.18236 12.8747C3.64389 13.3362 4.39218 13.3362 4.8537 12.8747L5.25175 12.4767C5.49991 12.2285 5.92424 12.4043 5.92424 12.7552V13.3182C5.92424 13.9709 6.45336 14.5 7.10606 14.5H7.89394C8.54664 14.5 9.07576 13.9709 9.07576 13.3182V12.7553C9.07576 12.4043 9.50009 12.2286 9.74825 12.4767L10.1463 12.8748C10.6078 13.3363 11.3561 13.3363 11.8176 12.8748L12.3748 12.3177C12.8363 11.8561 12.8363 11.1078 12.3748 10.6463L11.9767 10.2483C11.7285 10.0001 11.9043 9.57576 12.2553 9.57576H12.8182C13.4709 9.57576 14 9.04664 14 8.39394V7.60606C14 6.95336 13.4709 6.42424 12.8182 6.42424L12.2552 6.42424C11.9043 6.42424 11.7285 5.99991 11.9767 5.75175L12.3748 5.35367C12.8363 4.89214 12.8363 4.14386 12.3748 3.68233L11.8176 3.12522C11.3561 2.66369 10.6078 2.66369 10.1463 3.12522L9.74825 3.52325C9.50009 3.77142 9.07576 3.59566 9.07576 3.2447V2.68182Z" stroke="#0A0A0A" stroke-width="1.20741" stroke-linejoin="round" />
                                    <path d="M9.66667 8C9.66667 9.19662 8.69662 10.1667 7.5 10.1667C6.30338 10.1667 5.33333 9.19662 5.33333 8C5.33333 6.80338 6.30338 5.83333 7.5 5.83333C8.69662 5.83333 9.66667 6.80338 9.66667 8Z" stroke="#0A0A0A" stroke-width="1.20741" stroke-linejoin="round" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_2250_1079">
                                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                    </clipPath>
                                </defs>
                            </svg> Setting
                        </button>
                    </div>
                </div>

                {
                    attendanceData.length > 0 ?
                        <LeaveTable data={attendanceData} />
                        : <NoDataFound message={"Attendance data not found"} />
                }
            </div>
    );
};

export default Dailylog;