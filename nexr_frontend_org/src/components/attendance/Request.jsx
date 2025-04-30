import React from 'react';
import './Attendence.css';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { Skeleton } from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { exportAttendanceToExcel } from '../ReuseableAPI';

const Request = ({ attendanceData, isLoading }) => {
    return (
        <div className='dashboard-parent'>
            <div className="d-flex justify-content-between align-items-center px-3">
                <div>
                    <h5 className='text-daily'>Request</h5>
                </div>
                <button className='button' onClick={() => exportAttendanceToExcel(attendanceData)}><FileDownloadRoundedIcon /> Export</button>
            </div>
            {
                isLoading ? <Skeleton
                    sx={{ bgcolor: 'grey.500' }}
                    variant="rectangular"
                    width={"100%"}
                    height={"50vh"}
                /> :
                    attendanceData.length > 0 ?
                        <LeaveTable data={attendanceData} />
                        : <NoDataFound message={"Attendence data not found"} />

            }
        </div>
    );
};

export default Request;