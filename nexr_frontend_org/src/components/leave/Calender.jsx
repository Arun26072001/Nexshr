import React, { useContext, useEffect, useState } from 'react';
import axios from "axios";
import defaultProfile from "../../imgs/male_avatar.webp";
import { DateRangePicker, Input } from 'rsuite';
import "../payslip/payslip.css";
import CircleIcon from '@mui/icons-material/Circle';
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';
import Loading from '../Loader';

const localizer = dayjsLocalizer(dayjs);
export default function LeaveCalender() {
    const { data, whoIs } = useContext(EssentialValues);
    const [dateRangeValue, setDateRangeValue] = useState([]);
    const [formattedLeaveDays, setFormattedLeaveDays] = useState([]);
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [empName, setEmpName] = useState("");
    const url = process.env.REACT_APP_API_URL;
    const [isLoading, setIsLoading] = useState(false);
    const statuses = [{ status: "Approved", color: "#78C841" }, { status: "Rejected", color: "#FB4141" }, { status: "Pending", color: "#FFD700" }]

    const getLeaveData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/leave-application/date-range/management/${whoIs}`, {
                params: {
                    dateRangeValue
                },
                headers: {
                    authorization: data.token || ""
                }
            })
            const leaveData = res.data.leaveData || [];
            const formattedRequests = leaveData.map((leave) => {
                const { fromDate, toDate, leaveType, employee, status } = leave;
                return {
                    title: leaveType,
                    start: new Date(fromDate),
                    end: new Date(toDate),
                    userProfile: employee.profile,
                    userName: employee.FirstName + " " + employee.LastName,
                    status
                }
            })
            setFormattedLeaveDays(formattedRequests);
            setFullLeaveRequests(formattedRequests)
        } catch (err) {
            toast.error(err?.response?.data?.message);
            console.log("error in fethc leave data", err)
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getLeaveData();
    }, [dateRangeValue]);

    useEffect(() => {
        if (empName === "") {
            setFormattedLeaveDays(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests.filter((leave) => leave?.userName?.toLowerCase()?.includes(empName.toLowerCase()));
            setFormattedLeaveDays(filterRequests);
        }
    }, [empName]);

    const eventPropGetter = (event) => ({
        style: {
            backgroundColor: event.status === "approved" ? "#78C841" : event.status === "rejected" ? "#FB4141" : "#FFD700",
            color: "#fff",
            padding: "5px"
        }
    });
    const CustomEventComponent = ({ event }) => {
        return (
            <div >
                <p><img src={event.userProfile || defaultProfile} alt={event.userName} style={{ width: '30px', height: '30px', borderRadius: '50%' }} /> {event.userName}</p>
            </div>
        );
    };

    return (
        <div>
            {/* Top date input and leave label */}
            <div className="leaveDateParent">
                <p className="payslipTitle">
                    Calendar
                </p>
            </div>

            {
                <div className="leaveContainer d-block">
                    {/* Search Input */}
                    <div className='px-3 my-3'>
                        <div className="d-flex align-items-center justify-content-between">
                            <Input value={empName} size="lg" style={{ width: "300px" }} placeholder="Search Employee" onChange={(e) => setEmpName(e)} />
                            <DateRangePicker
                                size="lg"
                                showOneCalendar
                                placement="bottomEnd"
                                value={dateRangeValue}
                                placeholder="Filter Range of Date"
                                onChange={setDateRangeValue}
                            />
                        </div>
                    </div>

                    {
                        isLoading ? <Loading height='60vh' /> :
                            <>
                                <p className="mb-2 payslipTitle justify-content-center gap-2">{statuses.map((item) => <><CircleIcon sx={{ color: item.color }} /> {item.status}</>)}</p>
                                <Calendar
                                    localizer={localizer}
                                    events={formattedLeaveDays}
                                    startAccessor="start"
                                    endAccessor="end"
                                    eventPropGetter={eventPropGetter}
                                    components={{
                                        event: CustomEventComponent
                                    }}
                                    style={{ height: 500 }}
                                />
                            </>
                    }
                </div>
            }

        </div>
    );
}
