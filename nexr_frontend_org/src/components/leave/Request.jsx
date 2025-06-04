import React, { useContext, useEffect } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { LeaveStates, TimerStates } from '../payslip/HRMDashboard';
import axios from "axios";
import "../payslip/payslip.css";
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { DateRangePicker, Dropdown, Input, Popover, Whisper } from 'rsuite';
import { jwtDecode } from 'jwt-decode';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';

export default function LeaveRequest() {
    const url = process.env.REACT_APP_API_URL;
    const { empName, setEmpName, filterLeaveRequests, isLoading, leaveRequests, changeRequests } = useContext(LeaveStates);
    const { daterangeValue, setDaterangeValue } = useContext(TimerStates)
    const { data, whoIs } = useContext(EssentialValues);
    const { token } = data;
    const { isTeamHead, isTeamLead, isTeamManager } = jwtDecode(token);
    const navigate = useNavigate()

    async function replyToLeave(leave, response) {
        try {
            let actionBy;
            let updatedLeaveRequest;
            if (isTeamHead) {
                actionBy = "Head"
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        head: response
                    }
                }
            } else if (isTeamLead) {
                actionBy = "Lead"
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        lead: response
                    }
                }
            } else if (isTeamManager) {
                actionBy = "Manager"
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        manager: response
                    }
                }
            }
            else if (String(data.Account) === "2") {
                actionBy = "Hr"
                updatedLeaveRequest = {
                    ...leave,
                    approvers: {
                        ...leave.approvers,
                        hr: response
                    }
                }
            } else if (String(data.Account) === "1") {
                actionBy = "Admin"
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
            toast.error(error?.response?.data?.error)
        }
    }

    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue]);

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
            <div className='d-flex justify-content-between px-2'>
                <p className="payslipTitle">
                    Leave Request
                </p>
                <div className='d-flex gap-2'>

                    <button className='button' onClick={() => navigate(`/${whoIs}/leave-request`)}>Apply Leave</button>
                    <button className='button' style={{ cursor: 'pointer' }}>
                        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
                            Action <ArrowDropDownRoundedIcon />
                        </Whisper>
                    </button>
                </div>
            </div>

            <div className="leaveContainer d-block">
                <div className='px-3 my-3'>
                    <div className="d-flex align-items-center justify-content-between my-2">
                        <Input value={empName} size="lg" style={{ width: "300px" }} placeholder="Search Employee" onChange={(e) => setEmpName(e)} />
                        <DateRangePicker
                            size="lg"
                            showOneCalendar
                            placement="bottomEnd"
                            value={daterangeValue}
                            placeholder="Filter Range of Date"
                            onChange={setDaterangeValue}
                        />
                    </div>
                </div>
                <div className="w-100 d-flex justify-content-center">
                    <div className="leaveBoard">
                        {/* Leave taken */}
                        <div className="leaveData leaveData col-12 col-lg-3">
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
                        <div className="leaveData leaveData col-12 col-lg-3">
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
                        <div style={{ width: "30%", margin: "10px" }} className='leaveData col-12 col-lg-3' >
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
                    isLoading ? <Skeleton
                        sx={{ bgcolor: 'grey.500' }}
                        variant="rectangular"
                        width={"100%"}
                        height={"50vh"}
                    /> :
                        leaveRequests?.leaveData?.length > 0 ?
                            <LeaveTable Account={data?.Account} data={leaveRequests.leaveData} replyToLeave={replyToLeave} isTeamHead={isTeamHead} isTeamLead={isTeamLead} isTeamManager={isTeamManager} /> :
                            <NoDataFound message={"No Leave request in this month"} />
                }
            </div>
        </>
    );
}
