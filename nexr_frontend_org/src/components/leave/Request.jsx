import React, { useContext, useEffect } from 'react'
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates } from '../payslip/HRMDashboard';

export default function LeaveRequest() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests } = useContext(LeaveStates);
    console.log(leaveRequests)
    useEffect(() => {
        filterLeaveRequests();
    }, [empName])

    return (
        leaveRequests?.leaveData?.length > 0 ?
            <div>
                <div className="row">
                    <div className="col-lg-6"></div>
                    <div className="col-lg-6 searchInputIcon">
                        <input type="text" className='payrunInput' value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder='Search' />
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
                                        Leave taken
                                    </div>
                                </div>
                            </div>
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.upComingLeave?.length} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Upcoming leave
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
                    <LeaveTable data={leaveRequests.leaveData} />
                </div>
            </div> : leaveRequests?.leaveData?.length == 0 ?
                <NoDataFound message={"No Leave request for this employee Name"} />
                : <Loading />
    )
}
