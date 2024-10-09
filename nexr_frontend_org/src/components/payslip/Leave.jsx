import React, { useEffect, useState } from "react";
import "./dashboard.css";
import LeaveTable from "../LeaveTable";
import { fetchEmpLeaveRequests, fetchLeaveRequests } from "../ReuseableAPI";
import { DateRangePicker } from "rsuite";
import 'rsuite/dist/rsuite.min.css';
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Loader";
import NoDataFound from "./NoDataFound";

const Leave = () => {
    const Account = localStorage.getItem("Account");
    const empId = localStorage.getItem("_id");
    const [leaveRequests, setLeaveRequests] = useState({});
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [empName, setEmpName] = useState("");
    const token = localStorage.getItem('token');
    const url = process.env.REACT_APP_API_URL;
    const [daterangeValue, setDaterangeValue] = useState("");

    function filterLeaveRequests() {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests.filter((leave) => leave.employee.FirstName.toLowerCase().includes(empName));
            setLeaveRequests(filterRequests);
        }
    }

    useEffect(() => {
        const getLeaveData = async () => {
            try {

                const leaveData = await axios.get(`${url}/api/leave-application/date-range/${empId}`, {
                    params: {
                        daterangeValue
                    },
                    headers: {
                        authorization: token || ""
                    }
                })
                setLeaveRequests(leaveData.data);
                setFullLeaveRequests(leaveData.data.leaveData);
            } catch (err) {
                toast.error(err?.response?.data?.message)
            }
        }
        // 
        getLeaveData();
    }, [daterangeValue, empId])

    // useEffect(() => {
    //     const gettingEmpLeaveReqests = async () => {
    //         if (empId && Account == '2') {
    //             const leaveData = await fetchEmpLeaveRequests();
    //             setLeaveRequests(leaveData);
    //             setFullLeaveRequests(leaveData);
    //         } else {
    //             const leaveData = await fetchLeaveRequests(empId);
    //             if (leaveData) {
    //                 // console.log(leaveData.requests.leaveApplication);
    //                 setLeaveRequests(leaveData.requests.leaveApplication);
    //                 setFullLeaveRequests(leaveData.requests.leaveApplication)
    //             } else {
    //                 return null
    //             }
    //         }
    //     }

    //     gettingEmpLeaveReqests();
    //     return () => {
    //         setLeaveRequests([])
    //     }
    // }, [empId])

    useEffect(() => {
        filterLeaveRequests();
    }, [empName])

    return (
        <div >
            {/* top date input and leave label */}
            <div className="leaveDateParent">
                <div className="payslipTitle">
                    Leave
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
                <div className='px-3 my-3'>
                    <div className="row">
                        <div className="col-lg-12 searchInputIcon">
                            <input type="text" className='payrunInput' value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder='Search' />
                        </div>
                    </div>
                </div>

                {
                    leaveRequests?.leaveData?.length > 0 ?
                        <LeaveTable data={leaveRequests.leaveData} />
                        : leaveRequests?.leaveData?.length === 0 ?
                            <NoDataFound message={"No Leave request for this employee Name"} />
                            : <Loading />
                }
            </div>
        </div>
    )
};

export default Leave;
