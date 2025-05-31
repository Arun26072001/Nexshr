import React, { useEffect, useState } from 'react';
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";

const localizer = dayjsLocalizer(dayjs);
export default function CalendarViewTasks({ tasks }) {
    const [calendarViewTasks, setCalendarViewTasks] = useState([]);
    const eventPropGetter = () => ({
        style: {
            backgroundColor: "#5D8736",
            color: "#fff",
            padding: "5px"
        }
    });

    function changeTasksAsCalendarView() {
        const mapped = (tasks || []).map(item => ({
            title: item.title || "Untitled task",
            start: new Date(item.from),
            end: new Date(item.to)
        }));
        setCalendarViewTasks(mapped);
    }
    useEffect(() => {
        changeTasksAsCalendarView()
    }, [tasks])
    return (
        <Calendar
            localizer={localizer}
            events={calendarViewTasks}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventPropGetter}
            style={{ height: 500 }}
        />
    )
}
