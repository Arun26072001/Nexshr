import React, { useState, useEffect, useContext } from 'react';
import Loading from '../Loader';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { DateRangePicker } from 'rsuite';
import { LeaveStates } from '../payslip/HRMDashboard';

export default function Status() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests, daterangeValue, setDaterangeValue } = useContext(LeaveStates);

    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue])

    return (
        leaveRequests?.leaveData?.length > 0 ?
            <div >
                {/* top date input and leave label */}
                <div className="leaveDateParent">
                    <div className="payslipTitle">
                        Leave Status
                    </div>
                    <div>
                        <DateRangePicker size="md" showOneCalendar placement="bottomEnd" value={daterangeValue} placeholder="Select Date" onChange={setDaterangeValue} />
                    </div>
                </div>

                <div className="leaveContainer d-block">
                    <div className="w-100 d-flex justify-content-center">
                        <div className="leaveBoard">
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.approvedLeave?.length} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        total Leaves hour
                                    </div>
                                </div>
                            </div>
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.leaveInHours} hrs
                                    </div>
                                    <div className="leaveDaysDesc">
                                        On leave
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: "30%", margin: "10px" }} >
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.pendingLeave?.length} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Pending request
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='px-3 my-3'>
                        <div className="row">
                            <div className="col-lg-12 searchInputIcon">
                                <input type="text" className='payrunInput' value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder='Search' />
                            </div>
                        </div>
                    </div>

                </div>
                <LeaveTable data={leaveRequests.leaveData} />
            </div>
            : leaveRequests?.leaveData?.length == 0 ?
                <NoDataFound message={"No Leave request for this employee Name"} />
                : <Loading />
    )
}
