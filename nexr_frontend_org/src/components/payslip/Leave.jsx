import React, { useContext, useEffect, useState } from "react";
import "./dashboard.css";
import LeaveTable from "../LeaveTable";
import { DateRangePicker } from "rsuite";
// import 'rsuite/dist/rsuite.min.css';
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
            setLeaveRequests((pre) => ({
                ...pre,
                "leaveData": fullLeaveRequests
            }));
        } else {
            const filterRequests = fullLeaveRequests.filter((leave) => leave.leaveType.toLowerCase().includes(empName.toLowerCase()))
            setLeaveRequests((pre) => ({
                ...pre,
                "leaveData": filterRequests
            }));
        }
    }


    async function deleteLeave(leaveId) {
        try {
            const res = await axios.delete(`${url}/api/leave-application/${_id}/${leaveId}`, {
                headers: {
                    Authorization: token || ""
                }
            })
            toast.success(res.data.message);
            getLeaveData();
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    const getLeaveData = async () => {
        setIsLoading(true);
        try {
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
        } catch (err) {
            toast.error(err?.response?.data?.message)
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        getLeaveData();
    }, [daterangeValue, _id])

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
                    <button className="button mx-1" onClick={() => navigate(`/${whoIs}/leave-request`)}>
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
                                    {leaveRequests?.upComingLeave?.length || 0} Days
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
                            <input type="text" className='payrunInput' value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder='Search by Leave type' />
                        </div>
                    </div>
                </div>
                {
                    isLoading ? <Loading height="80vh" /> :
                        leaveRequests?.leaveData?.length > 0 ?
                            <LeaveTable data={leaveRequests.leaveData} fetchData={deleteLeave} />
                            : <NoDataFound message={"Leave data not for this month!"} />
                }
            </div>
        </div>
    )
};

export default Leave;
