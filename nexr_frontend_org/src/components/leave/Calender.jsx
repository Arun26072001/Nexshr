import React, { useContext, useEffect } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates, TimerStates } from '../payslip/HRMDashboard';
import { DateRangePicker } from 'rsuite';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import "../payslip/payslip.css";
import { Skeleton } from '@mui/material';

export default function LeaveCalender() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests, isLoading } = useContext(LeaveStates);
    const { daterangeValue, setDaterangeValue } = useContext(TimerStates)

    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue]); // Added daterangeValue to trigger filtering when the date range changes.

    return (
        <div>
            {/* Top date input and leave label */}
            <div className="leaveDateParent">
                <p className="payslipTitle">
                    Calendar
                </p>
            </div>

            {
                <div className="leaveContainer d-block">
                    {/* Search Input */}
                    <div className='px-3 my-3'>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="searchInputIcon">
                                <input
                                    type="text"
                                    className='payrunInput'
                                    value={empName}
                                    onChange={(e) => setEmpName(e.target.value)}
                                    placeholder='Search Employee'
                                />
                            </div>
                            <DateRangePicker
                                size="lg"
                                showOneCalendar
                                placement="bottomEnd"
                                value={daterangeValue}
                                placeholder="Select Date"
                                onChange={setDaterangeValue}
                            />
                        </div>
                    </div>
                    <div className="w-100 d-flex justify-content-center">
                        <div className="leaveBoard">
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.approvedLeave?.length} <PersonRoundedIcon />
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Leave Employees
                                    </div>
                                </div>
                            </div>
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.leaveInHours} hr
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Total Leave Hours
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: "30%", margin: "10px" }}>
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.peoplesOnLeave?.length} <PersonRoundedIcon />
                                    </div>
                                    <div className="leaveDaysDesc">
                                        On Leave
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Leave Table */}
                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            leaveRequests?.leaveData?.length > 0 ? <LeaveTable data={leaveRequests.leaveData} />
                                : <NoDataFound message={"No Leave request for this employee Name"} />}
                </div>
            }

        </div>
    );
}
