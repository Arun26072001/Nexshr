import { Skeleton } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react'
import { DateRangePicker, Input } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import axios from 'axios';
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';

export default function UnpaidRequest() {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [empName, setEmpName] = useState("");
    const [daterangeValue, setDaterangeValue] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);

    async function replyToLeave(leave, response) {
        try {
            let updatedLeaveRequest;
            updatedLeaveRequest = {
                ...leave,
                status: response
            }

            const res = await axios.put(`${url}/api/leave-application/${leave._id}`, updatedLeaveRequest, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            fetchUnpaidLeave();
        } catch (error) {
            console.log("error in reply to leave", error);
            toast.error(error.response.data.error)
        }
    }

    useEffect(() => {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests?.filter((leave) => leave?.employee?.FirstName?.toLowerCase()?.includes(empName) || leave?.employee?.LastName?.toLowerCase()?.includes(empName));
            setLeaveRequests(filterRequests);
        }
    }, [empName])

    async function fetchUnpaidLeave() {
        try {
            setIsLoading(true);
            const res = await axios.get(`${url}/api/leave-application/unpaid`, {
                params: {
                    daterangeValue
                },
                headers: {
                    Authorization: data.token
                }
            })
            setLeaveRequests(res.data);
            setFullLeaveRequests(res.data);
        } catch (error) {
            setLeaveRequests([])
            console.log("error in fetch unpaidleave", error);
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        fetchUnpaidLeave();
    }, [daterangeValue])

    return (
        <div>
            {/* Top date input and leave label */}
            <div className="leaveDateParent">
                <p className="payslipTitle">
                    Unpaid Requests
                </p>
            </div>

            {/* Display leave data or no data found */}
            <div>
                <div className="leaveContainer d-block">
                    <div className='px-3 my-3'>
                        <div className="d-flex align-items-center justify-content-between">
                            <Input value={empName} size="lg" style={{ width: "300px" }} placeholder="Search Employee" onChange={setEmpName} />
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

                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            leaveRequests?.length > 0 ?
                                <LeaveTable data={leaveRequests} replyToLeave={replyToLeave} /> : <NoDataFound message="No Leave request for this employee Name" />
                    }
                </div>
            </div>
        </div>
    )
}
