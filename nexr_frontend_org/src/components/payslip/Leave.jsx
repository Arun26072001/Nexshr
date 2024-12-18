import React, { useContext, useEffect, useState } from "react";
import "./dashboard.css";
import LeaveTable from "../LeaveTable";
import { DateRangePicker } from "rsuite";
import 'rsuite/dist/rsuite.min.css';
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Loader";
import NoDataFound from "./NoDataFound";
import { useNavigate } from "react-router-dom";
import { EssentialValues } from "../../App";

const Leave = () => {
    const navigate = useNavigate();
    const { whoIs, data } = useContext(EssentialValues);
    const { token, _id } = data;
    const [leaveRequests, setLeaveRequests] = useState({});
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [empName, setEmpName] = useState("");
    const url = process.env.REACT_APP_API_URL;
    const [daterangeValue, setDaterangeValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
                setIsLoading(true);
                const leaveData = await axios.get(`${url}/api/leave-application/date-range/${_id}`, {
                    params: {
                        daterangeValue
                    },
                    headers: {
                        authorization: token || ""
                    }
                })
                console.log(leaveData.data);

                setLeaveRequests(leaveData.data);
                setFullLeaveRequests(leaveData.data.leaveData);
                setIsLoading(false);
            } catch (err) {
                toast.error(err?.response?.data?.message)
            }
        }
        // 
        getLeaveData();
    }, [daterangeValue, _id])

    // useEffect(() => {
    //     const gettingEmpLeaveReqests = async () => {
    //         if (_id && Account == '2') {
    //             const leaveData = await fetchEmpLeaveRequests();
    //             setLeaveRequests(leaveData);
    //             setFullLeaveRequests(leaveData);
    //         } else {
    //             const leaveData = await fetchLeaveRequests(_id);
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
    // }, [_id])

    useEffect(() => {
        filterLeaveRequests();
    }, [empName])

    return (
        <div >
            {/* top date input and leave label */}
            <div className="leaveDateParent row">
                <p className="payslipTitle col-6">
                    Leave
                </p>
                <div className="col-6 d-flex justify-content-end">
                    <DateRangePicker size="md" className="ml-1" showOneCalendar placement="bottomEnd" value={daterangeValue} placeholder="Select Date" onChange={setDaterangeValue} />
                    <button className="button m-1" onClick={() => navigate(`/${whoIs}/leave-request`)}>
                        Add Leave
                    </button>
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
                    isLoading ? <Loading /> :
                        leaveRequests?.leaveData?.length > 0 ?
                            <LeaveTable data={leaveRequests.leaveData} />
                            : <NoDataFound message={"Leave data not for this month!"} />
                }
            </div>
        </div>
    )
};

export default Leave;
