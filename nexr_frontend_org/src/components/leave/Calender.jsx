import React, { useContext, useEffect } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates } from '../payslip/HRMDashboard';
import { DateRangePicker } from 'rsuite';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import "../payslip/payslip.css";

export default function LeaveCalender() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests, daterangeValue, isLoading, setDaterangeValue } = useContext(LeaveStates);

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
                <div>
                    <DateRangePicker
                        size="md"
                        showOneCalendar
                        placement="bottomEnd"
                        value={daterangeValue}
                        placeholder="Select Date"
                        onChange={setDaterangeValue}
                    />
                </div>
            </div>

            {
                isLoading ? <Loading height="80vh" /> :
                    <div className="leaveContainer d-block">
                        {/* Search Input */}
                        <div className='px-3 my-3'>
                            <div className="row">
                                <div className="col-lg-12 searchInputIcon">
                                    <input
                                        type="text"
                                        className='payrunInput'
                                        value={empName}
                                        onChange={(e) => setEmpName(e.target.value)}
                                        placeholder='Search Employee'
                                    />
                                </div>
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
                        {leaveRequests?.leaveData?.length > 0 ? <LeaveTable data={leaveRequests.leaveData} />
                            : <NoDataFound message={"No Leave request for this employee Name"} />}
                    </div>
            }

        </div>
    );
}
