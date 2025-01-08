import React, { useContext, useEffect, useState } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { toast } from 'react-toastify';
import "./calendar.css";
import { EssentialValues } from '../App';
import Loading from './Loader';
import { jwtDecode } from 'jwt-decode';

const localizer = dayjsLocalizer(dayjs);

export default function AttendanceCalendar() {
    const { data } = useContext(EssentialValues);
    const url = process.env.REACT_APP_API_URL;
    const decodedData = jwtDecode(data.token);
    
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    async function getAllLeavedata() {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/leave-application/all/emp`, {
                params: {
                    isHr: data.Account === "2" ? true : false
                },
                headers: {
                    authorization: data.token || ""
                }
            })

            setLeaveRequests(res.data.leaveData.map((leave) => ({
                title: `${leave.employee.FirstName[0].toUpperCase() + leave.employee.FirstName.slice(1)} ${leave.employee.LastName} (${leave.leaveType[0].toUpperCase() + leave.leaveType.slice(1)} - ${leave.status})`,
                start: new Date(leave.fromDate),
                end: new Date(leave.toDate),
                status: leave.status
            })));
        } catch (err) {
            toast.error(err?.response?.data?.message);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        async function fetchDataInTeam() {
            setIsLoading(true)
            try {
                // // Fetch leave requests
                const leaveRes = await axios.get(`${url}/api/leave-application/all/team/${data._id}`, {
                    params: {
                        isLead: decodedData.isTeamLead ? true : false
                    },
                    headers: {
                        authorization: data.token || "",
                    },
                });

                setLeaveRequests(leaveRes.data.leaveData.map((leave) => ({
                    title: `${leave.employee.FirstName[0].toUpperCase() + leave.employee.FirstName.slice(1)} ${leave.employee.LastName} (${leave.leaveType[0].toUpperCase() + leave.leaveType.slice(1)} - ${leave.status})`,
                    start: new Date(leave.fromDate),
                    end: new Date(leave.toDate),
                    status: leave.status
                })));
            } catch (err) {
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(err.response.data.message);
                }
            }
            setIsLoading(false)
        }
        if (decodedData.isTeamLead || decodedData.isTeamHead) {
            console.log(decodedData.isTeamLead, decodedData.isTeamHead);

            fetchDataInTeam()
        } else if (["1", "2"].includes(data.Account)) {
            getAllLeavedata()
        }
    }, [])

    function getdata(e) {
        console.log(e);
    }

    const eventPropGetter = (event) => {
        let backgroundColor = "";

        switch (event.status) {
            case "pending":
                backgroundColor = "#f4d03f"; // Yellow
                break;
            case "rejected":
                backgroundColor = "#e74c3c"; // Red
                break;
            case "approved":
                backgroundColor = "#5D8736"; // Blue
                break;
            default:
                backgroundColor = "#95a5a6"; // Grey
        }
        return {
            style: {
                backgroundColor,
                color: "#fff",
                padding: "5px",
            }
        }
    }
    return (
        isLoading ? <Loading /> :
            <div>
                <ul className='calendar-style'>
                    <span className='dotIcon' style={{ background: "#f4d03f" }}></span>
                    <p>
                        Pending
                    </p>
                    <span className='dotIcon' style={{ background: "#e74c3c" }}></span>
                    <p>Rejected</p>
                    <span className='dotIcon' style={{ background: "#5D8736" }}></span>
                    <p>Approved</p>
                </ul>
                <Calendar
                    localizer={localizer}
                    events={leaveRequests}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={getdata}
                    style={{ height: 500 }}
                    eventPropGetter={eventPropGetter}
                />
            </div>
    )
}
