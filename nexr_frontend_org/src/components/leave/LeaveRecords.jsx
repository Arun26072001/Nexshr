import React, { useContext, useEffect } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { TimerStates } from '../payslip/HRMDashboard';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import axios from "axios";
import "../payslip/payslip.css";
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { DateRangePicker, Dropdown, Input, Popover, Whisper } from 'rsuite';
import { jwtDecode } from 'jwt-decode';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import { useState } from 'react';

export default function LeaveRecords() {
    const { state } = useLocation();
    const url = process.env.REACT_APP_API_URL;
    const { data, whoIs } = useContext(EssentialValues);
    const [empName, setEmpName] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [filterLeaveRequests, setFilterLeaveRequests] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState({});
    const [isChangedRequests, setIsChangedRequests] = useState(false);
    const { dateRangeValue, setDateRangeValue } = useContext(TimerStates)
    const { token, Account, _id } = data;
    const [responsing, setResponsing] = useState("");
    const { isTeamHead, isTeamLead, isTeamManager } = jwtDecode(token);
    const navigate = useNavigate();

    async function replyToLeave(leave, response) {
        try {
            setResponsing(leave._id)
            let actionBy;
            let updatedLeaveRequest;
            if (isTeamHead) {
                actionBy = `${data?.Name} (Head)`
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        head: response
                    }
                }
            } else if (isTeamLead) {
                actionBy = `${data?.Name} (Lead)`
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        lead: response
                    }
                }
            } else if (isTeamManager) {
                actionBy = `${data?.Name} (Manager)`
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        manager: response
                    }
                }
            }
            else if (String(Account) === "2") {
                actionBy = `${data?.Name} (Hr)`
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        hr: response
                    }
                }
            } else if (String(Account) === "1") {
                actionBy = `${data?.Name} (Admin)`
                updatedLeaveRequest = {
                    ...leave,
                    status: response
                }
            } else {
                toast.error("You are not approver for this leave")
                return;
            }

            const res = await axios.put(`${url}/api/leave-application/${leave._id}`, updatedLeaveRequest, {
                params: {
                    actionBy
                },
                headers: {
                    Authorization: token || ""
                }
            })
            toast.success(res.data.message);
            changeRequests();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        } finally {
            setResponsing("")
        }
    }

    function changeRequests() {
        setIsChangedRequests(!isChangedRequests)
    }

    useEffect(() => {
        function filterLeave() {
            if (empName === "") {
                setLeaveRequests(filterLeaveRequests);
            } else {
                const filterRequests = filterLeaveRequests?.leaveData.filter((leave) => {
                    const emp = leave?.employee;
                    const fullName = `${emp.FirstName}${emp.LastName}`.toLowerCase();
                    return fullName.includes(empName.toLowerCase())
                });
                setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
            }
        }
        filterLeave()
    }, [empName, dateRangeValue]);

    useEffect(() => {
        const today = new Date();

        if (state) {
            if (state.type === "today") {
                const start = new Date(today.setHours(0, 0, 0, 0));
                const end = new Date(today.setHours(23, 59, 59, 999));
                setDateRangeValue([start, end]);
            }

            if (state.type === "tomorrow") {
                const tomorrow = new Date(state.date);
                const start = new Date(tomorrow.setHours(0, 0, 0, 0));
                const end = new Date(tomorrow.setHours(23, 59, 59, 999));
                setDateRangeValue([start, end]);
            }

            if (state.type === "yesterday") {
                const yesterday = new Date(state.date);
                const start = new Date(yesterday.setHours(0, 0, 0, 0));
                const end = new Date(yesterday.setHours(23, 59, 59, 999));
                setDateRangeValue([start, end]);
            }
        }
    }, [state]);

    const getFilteredLeaveData = () => {
        if (selectedFilter === "all") return filterLeaveRequests.leaveData;

        switch (selectedFilter) {
            case "approvedLeave":
                return filterLeaveRequests.leaveData?.filter(l => l.status === "approved");
            case "upcomingLeave":
                return filterLeaveRequests.leaveData?.filter(l => new Date(l.fromDate) > new Date());
            case "peopleOnLeave":
                return filterLeaveRequests.leaveData?.filter(l => {
                    const now = new Date();
                    return new Date(l.fromDate) <= now && new Date(l.toDate) >= now;
                });
            case "pendingRequests":
                return filterLeaveRequests.leaveData?.filter(l => l.status === "pending");
            case "approvedRequests":
                return filterLeaveRequests.leaveData?.filter(l => l.status === "approved");
            case "rejectedRequests":
                return filterLeaveRequests.leaveData?.filter(l => l.status === "rejected");
            default:
                return filterLeaveRequests.leaveData;
        }
    };

    useEffect(() => {
        const requests = getFilteredLeaveData();
        setLeaveRequests((pre) => ({
            ...pre,
            leaveData: requests
        }))
    }, [selectedFilter]);

    const getLeaveData = async () => {
        setIsLoading(true);
        try {
            const leaveData = await axios.get(`${url}/api/leave-application/date-range/management/${whoIs}`, {
                params: {
                    dateRangeValue
                },
                headers: {
                    authorization: token || ""
                }
            });
            setLeaveRequests(leaveData.data);
            setFilterLeaveRequests(leaveData.data);
        } catch (err) {
            toast.error(err?.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    }

    const getLeaveDataFromTeam = async () => {
        setIsLoading(true);
        try {
            const leaveData = await axios.get(`${url}/api/leave-application/team/${_id}`, {
                params: {
                    who: isTeamLead ? "lead" : isTeamHead ? "head" : "manager",
                    dateRangeValue
                },
                headers: {
                    authorization: token || ""
                }
            })
            setLeaveRequests(leaveData.data);
            setFilterLeaveRequests(leaveData.data);
        } catch (err) {
            toast.error(err?.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (whoIs && [isTeamHead, isTeamLead, isTeamManager].includes(true)) {
            getLeaveDataFromTeam()
        } else if (["admin", "hr"].includes(whoIs)) {
            getLeaveData();
        }
    }, [dateRangeValue, _id, whoIs, isChangedRequests]);


    // Handle file upload
    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('documents', file);

        try {
            const response = await axios.post(`${url}/api/google-sheet/upload/leave`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: token || ""
                },
            });
            toast.success(response.data.message);
            changeRequests();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error('File upload failed:', error);
            toast.error(error?.response?.data?.error);
        }
    };
    const renderMenu = ({ onClose, right, top, className }, ref) => {
        const handleSelect = (eventKey) => {
            if (eventKey === 1) {
                // Trigger the Uploader
                document.getElementById('fileUploader').click();
            } else if (eventKey === 2) {
                // Handle download logic
                alert('Download clicked');
            } else if (eventKey === 3) {
                // Handle add logic
                alert('Add clicked');
            }
            onClose();
        };

        return (
            <Popover ref={ref} className={className} style={{ right, top }}>
                <Dropdown.Menu onSelect={handleSelect}>
                    <Dropdown.Item eventKey={1}>
                        <b>
                            <FileUploadRoundedIcon /> Import
                        </b>
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={2}>
                        <b>
                            <FileDownloadRoundedIcon /> Download
                        </b>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Popover>
        );
    };
    return (
        <>
            <input
                type="file"
                id="fileUploader"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files[0])}
            />
            <div className='d-flex justify-content-between px-2 flex-wrap'>
                <p className="payslipTitle col-col-lg-6 col-12 col-md-6">
                    Leave Records
                </p>
                <div className='d-flex gap-2 col-lg-6 col-12 col-md-6 flex-wrap justify-content-end'>
                    <button className='button' onClick={() => navigate(`/${whoIs}/leave-request`)}>Apply Leave</button>
                    <button className='button' style={{ cursor: 'pointer' }}>
                        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu} >
                            Action <ArrowDropDownRoundedIcon />
                        </Whisper>
                    </button>
                </div>
            </div>

            <div className="leaveContainer d-block">
                    <div className="d-flex align-items-center justify-content-between my-2 flex-wrap">
                        <div className="col-12 col-lg-5 col-md-5 my-1">
                            <Input value={empName} size="lg" style={{ width: "100%" }} placeholder="Search Employee" onChange={(e) => setEmpName(e)} />
                        </div>
                    <div className="col-12 col-lg-5 col-md-5 my-1">
                            <DateRangePicker
                                size="lg"
                                showOneCalendar
                                style={{ width: "100%" }}
                                placement="bottomEnd"
                                value={dateRangeValue}
                                placeholder="Filter Range of Date"
                                onChange={setDateRangeValue}
                            />
                        </div>
                    </div>
                {/* <div className='px-3 my-3'>
                </div> */}
                <div className="w-100 d-flex justify-content-center">
                    <div className="leaveBoard">
                        <div
                            className="timeLogBox d-flex justify-content-center"
                            title="Leave taken"
                            onClick={() => setSelectedFilter("approvedLeave")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">{filterLeaveRequests?.approvedLeave || 0} Days</div>
                                <div className="leaveDaysDesc">Leave taken</div>
                            </div>
                        </div>

                        <div
                            className="timeLogBox d-flex justify-content-center"
                            title="Upcoming leave"
                            onClick={() => setSelectedFilter("upcomingLeave")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">{filterLeaveRequests?.upcomingLeave || 0} Days</div>
                                <div className="leaveDaysDesc">Upcoming leave</div>
                            </div>
                        </div>

                        <div
                            className="timeLogBox d-flex justify-content-center"
                            title="People currently on leave"
                            onClick={() => setSelectedFilter("peopleOnLeave")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {filterLeaveRequests?.peopleOnLeave?.length || 0} <PersonRoundedIcon />
                                </div>
                                <div className="leaveDaysDesc">On Leave</div>
                            </div>
                        </div>

                        <div
                            className="timeLogBox d-flex justify-content-center"
                            title="Pending leave requests"
                            onClick={() => setSelectedFilter("pendingRequests")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">{filterLeaveRequests?.pendingRequests?.length || 0}</div>
                                <div className="leaveDaysDesc">Pending request</div>
                            </div>
                        </div>

                        <div
                            className="timeLogBox d-flex justify-content-center"
                            title="Approved leave requests"
                            onClick={() => setSelectedFilter("approvedRequests")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">{filterLeaveRequests?.approvedRequests?.length || 0}</div>
                                <div className="leaveDaysDesc">Approved request</div>
                            </div>
                        </div>

                        <div
                            className="timeLogBox d-flex justify-content-center"
                            title="Rejected leave requests"
                            onClick={() => setSelectedFilter("rejectedRequests")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">{filterLeaveRequests?.rejectedRequests?.length || 0}</div>
                                <div className="leaveDaysDesc">Rejected request</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leave Table */}
                {
                    isLoading ? <Skeleton
                        sx={{ bgcolor: 'grey.500', margin: "10px 0px" }}
                        variant="rectangular"
                        width={"100%"}
                        height={"50vh"}
                    /> :
                        leaveRequests?.leaveData?.length > 0 ?
                            <LeaveTable Account={data?.Account} data={leaveRequests.leaveData} isLoading={responsing} replyToLeave={replyToLeave} isTeamHead={isTeamHead} isTeamLead={isTeamLead} isTeamManager={isTeamManager} /> :
                            <NoDataFound message={"No Leave request in this month"} />
                }
            </div>
        </>
    );
}
