import React, { useContext, useEffect, useState } from 'react';
import axios from "axios";
import defaultProfile from "../../imgs/male_avatar.webp";
import { DateRangePicker, Input } from 'rsuite';
import "../payslip/payslip.css";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';
import Loading from '../Loader';

const localizer = dayjsLocalizer(dayjs);
export default function LeaveCalender() {
    const { data, whoIs } = useContext(EssentialValues);
    const [empName, setEmpName] = useState("");
    const [dateRangeValue, setDateRangeValue] = useState([]);
    const [formattedLeaveDays, setFormattedLeaveDays] = useState([]);
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const [isLoading, setIsLoading] = useState(false);

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
            const leaveData = res.data.leaveData;
            if (leaveData.length > 0) {
                setFormattedLeaveDays(leaveData.map((leave) => {
                    const { fromDate, toDate, leaveType, employee, status } = leave;
                    return {
                        title: leaveType,
                        start: new Date(fromDate),
                        end: new Date(toDate),
                        userProfile: employee.profile,
                        userName: employee.FirstName + " " + employee.LastName,
                        status
                    }
                }));
                setFullLeaveRequests(leaveData.data);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message);
            console.log("error in fethc leave data", err)
        } finally {
            setIsLoading(false);
        }
    }

    console.log("formattedLeaveDays", formattedLeaveDays)
    useEffect(() => {
        getLeaveData();
    }, [dateRangeValue]);
    // Filter leave requests when empName or daterangeValue changes
    useEffect(() => {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests?.leaveData.filter((leave) => leave?.employee?.FirstName?.toLowerCase()?.includes(empName.toLowerCase()) || leave?.employee?.LastName?.toLowerCase()?.includes(empName.toLowerCase()));
            setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
        }
    }, [empName]);

    // const eventPropGetter = () => ({
    //     style: {
    //         backgroundColor: "#5D8736",
    //         color: "#fff",
    //         padding: "5px"
    //     }
    // });
    const CustomEventComponent = ({ event }) => {
        return (
            <div>
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
                                <p className="text-center mb-2 payslipTitle">Holiday</p>
                                <Calendar
                                    localizer={localizer}
                                    events={formattedLeaveDays}
                                    startAccessor="start"
                                    endAccessor="end"
                                    // eventPropGetter={eventPropGetter}
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
