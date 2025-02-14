import React, { useContext, useEffect } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates } from '../payslip/HRMDashboard';
import axios from "axios";
import "../payslip/payslip.css";
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { DateRangePicker } from 'rsuite';
import { jwtDecode } from 'jwt-decode';

export default function LeaveRequest() {
    const url = process.env.REACT_APP_API_URL;
    const { empName, setEmpName, filterLeaveRequests, isLoading, leaveRequests, changeRequests, daterangeValue, setDaterangeValue } = useContext(LeaveStates);
    const { data } = useContext(EssentialValues);
    const { token } = data;
    const { isTeamHead, isTeamLead } = jwtDecode(token);

    async function replyToLeave(leave, response) {
        try {
            let updatedLeaveRequest;
            if (isTeamHead) {
                updatedLeaveRequest = {
                    ...leave,
                    TeamHead: response
                }
            } else if (isTeamLead) {
                updatedLeaveRequest = {
                    ...leave,
                    TeamLead: response
                }
            } else if (String(data.Account) === "2") {
                updatedLeaveRequest = {
                    ...leave,
                    Hr: response
                }
            }

            const res = await axios.put(`${url}/api/leave-application/${leave._id}`, updatedLeaveRequest, {
                headers: {
                    Authorization: token || ""
                }
            })
            toast.success(res.data.message);
            changeRequests();

        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue]);

    return (
        isLoading ? (
            <Loading />
        ) : (
            <div>
                <p className="payslipTitle">
                    Leave Request
                </p>

                <div className="leaveContainer d-block">
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
                            size="md"
                            showOneCalendar
                            placement="bottomEnd"
                            value={daterangeValue}
                            placeholder="Select Date"
                            onChange={setDaterangeValue}
                        />
                    </div>
                    <div className="w-100 d-flex justify-content-center">
                        <div className="leaveBoard">
                            {/* Leave taken */}
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.takenLeave?.length || 0} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Leave taken
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming leave */}
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.upComingLeave?.length || 0} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Upcoming leave
                                    </div>
                                </div>
                            </div>

                            {/* Pending request */}
                            <div style={{ width: "30%", margin: "10px" }}>
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.pendingLeave?.length || 0} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Pending request
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leave Table */}
                    {
                        leaveRequests?.leaveData?.length > 0 ?
                            <LeaveTable Account={data.Account} data={leaveRequests.leaveData} replyToLeave={replyToLeave} isTeamHead={isTeamHead} isTeamLead={isTeamLead} /> :
                            <NoDataFound message={"No Leave request in this month"} />

                    }
                </div>
            </div>
        )
    );
}
