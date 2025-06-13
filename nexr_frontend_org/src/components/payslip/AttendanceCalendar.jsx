import React, { useEffect, useState } from 'react'
import NoDataFound from './NoDataFound';
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { getHoliday } from '../ReuseableAPI';
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';

const localizer = dayjsLocalizer(dayjs);
export default function AttendanceCalendar() {
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const eventPropGetter = (event) => {
        let backgroundColor = "";

        if (event.title) {
            backgroundColor = "#5D8736"
        }
        return {
            style: {
                backgroundColor,
                color: "#fff",
                padding: "5px",
            }
        }
    }
    useEffect(() => {
        async function gettingHoliday() {
            setIsLoading(true);
            try {
                const res = await getHoliday();
                setHolidays(
                    res?.holidays?.map((item) => ({
                        title: item.title || "Untitled Holiday", // ✅ Ensure title is not empty
                        start: new Date(item.date),
                        end: new Date(item.date),
                    }))
                );
           } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
                console.log(error);
                setHolidays([]);
            }
            setIsLoading(false);
        }
        gettingHoliday();
    }, []);
    return (
        isLoading ? <Loading height="80vh" /> :
            holidays?.length > 0 ?
                <Calendar
                    localizer={localizer}
                    events={holidays}
                    startAccessor="start"
                    endAccessor="end"
                    // onSelectEvent={getdata}
                    eventPropGetter={eventPropGetter}
                    style={{ height: 500 }}
                /> : <NoDataFound message="Please Add Holidays for this year" />
    )
}
