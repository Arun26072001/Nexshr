import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { DateRangePicker, Input } from 'rsuite'
import { EssentialValues } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

export default function WFHRequests() {
    const url = process.env.REACT_APP_API_URL;
    const { data, whoIs } = useContext(EssentialValues);
    const { isTeamLead, isTeamHead, isTeamManager } = jwtDecode(data.token);
    const [dateRangeValue, setDaterangeValue] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [requests, setRequests] = useState({});
    const [empName, setEmpName] = useState("");
    const [isResponsing, setIsResponsing] = useState("");
    const navigate = useNavigate();

    async function fetchTeamWfhRequests() {
        setIsLoading(true)
        try {
            const res = await axios.get(`${url}/api/wfh-application/team/${data._id}`, {
                params: {
                    dateRangeValue,
                    who: isTeamLead ? "lead" : isTeamHead ? "head" : "manager",
                    empName
                },
                headers: {
                    Authorization: data.token || ""
                }
            })

            setRequests(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch wfhRequests", error);
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchAllWfhRequests() {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/wfh-application`, {
                params: {
                    dateRangeValue,
                    empName
                },
                headers: {
                    Authorization: data.token || ""
                }
            })
            setRequests(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("erorr in fetch wfh requests", error);
        } finally {
            setIsLoading(false)
        }
    }

    async function replyToRequest(request, response) {
        try {
            setIsResponsing(request._id)
            let updatedWFHRequest;
            let actionBy;
            if (isTeamHead) {
                actionBy = "Head"
                updatedWFHRequest = {
                    ...request,
                    approvers: {
                        ...request.approvers,
                        head: response
                    }
                }
            } else if (isTeamLead) {
                actionBy = "Lead"
                updatedWFHRequest = {
                    ...request,
                    approvers: {
                        ...request.approvers,
                        lead: response
                    }
                }
            } else if (isTeamManager) {
                actionBy = "Manager"
                updatedWFHRequest = {
                    ...request,
                    approvers: {
                        ...request.approvers,
                        manager: response
                    }
                }
            }
            else if (whoIs === "hr") {
                actionBy = "Hr"
                updatedWFHRequest = {
                    ...request,
                    approvers: {
                        ...request.approvers,
                        hr: response
                    }
                }
            } else if (String(data.Account) === "1") {
                actionBy = "Admin"
                updatedWFHRequest = {
                    ...request,
                    status: response
                }
            } else {
                toast.error("You are not approver for this requests")
                return;
            }

            const res = await axios.put(`${url}/api/wfh-application/${request._id}`, updatedWFHRequest, {
                params: { actionBy },
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            setDaterangeValue([]);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        } finally {
            setIsResponsing("")
        }
    }

    useEffect(() => {
        if (["admin", "hr"].includes(whoIs)) {
            fetchAllWfhRequests()
        } else if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
            fetchTeamWfhRequests();
        }
    }, [dateRangeValue, empName])
    return (
        <div >
            {/* top date input and requests label */}
            <div className="d-flex justify-content-between align-items-center flex-wrap">
                <p className="payslipTitle col-lg-6 col-md-6 col-12">
                    WFH Requests
                </p>
                <div className="col-lg-6 col-md-6 col-12 d-flex justify-content-end">
                    <button className="button mx-1" onClick={() => navigate(`/${whoIs}/wfh-request`)}>
                        Apply WFH
                    </button>
                </div>
            </div>

            <div className="leaveContainer d-block">
                <div className='px-3 my-3'>
                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                        <div className='col-lg-6 col-md-6 col-12 mb-1'>
                            <Input value={empName} size="lg" placeholder="Search Employee" onChange={(e) => setEmpName(e)} />
                        </div>
                        <div className='col-lg-6 col-md-6 col-12 d-flex justify-content-end mb-1'>
                            <DateRangePicker size="lg"
                                className="ml-1"
                                showOneCalendar
                                placement="bottomEnd"
                                value={dateRangeValue}
                                placeholder="Filter Range of Date"
                                onChange={setDaterangeValue} />
                        </div>
                    </div>
                </div>
                <div className="w-100 d-flex justify-content-center my-2">
                    <div className="leaveBoard">
                        <div className="leaveData col-12 col-lg-3">
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {requests?.approvedRequests || 0} Days
                                </div>
                                <div className="leaveDaysDesc">
                                    Taken requests
                                </div>
                            </div>
                        </div>
                        <div className="leaveData col-12 col-lg-3">
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {requests?.upcommingRequests || 0} Days
                                </div>
                                <div className="leaveDaysDesc">
                                    Upcoming requests
                                </div>
                            </div>
                        </div>
                        <div className="leaveData col-lg-3 col-12" style={{ borderRight: "none" }} >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {requests?.pendingRequests || 0} Days
                                </div>
                                <div className="leaveDaysDesc">
                                    Pending request
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {
                    isLoading ?
                        <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rounded"
                            height={"50vh"}
                        /> :
                        requests?.correctRequests?.length > 0 ?
                            <LeaveTable data={requests.correctRequests} isLoading={isResponsing} replyToLeave={replyToRequest} isTeamHead={isTeamHead} isTeamLead={isTeamLead} isTeamManager={isTeamManager} />
                            : <NoDataFound message={"WFH Requests not for this month!"} />
                }
            </div>
        </div>
    )
}
