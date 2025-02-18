import React, { useEffect, useState } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import Loading from './Loader';
import { getHoliday } from './ReuseableAPI';

const localizer = dayjsLocalizer(dayjs);

export default function AttendanceCalendar() {
    const [isLoading, setIsLoading] = useState(false);
    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        async function fetchHolidays() {
            setIsLoading(true)
            const res = await getHoliday();
            setHolidays(res.holidays.map((item) => ({
                title: item.title,
                start: new Date(item.date),
                end: new Date(item.date)
            })))
            setIsLoading(false)
        }
        fetchHolidays()
    }, [])

    return (
        isLoading ? <Loading /> : <div>
            <Calendar
                localizer={localizer}
                events={holidays}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
            />
        </div>
    )
}