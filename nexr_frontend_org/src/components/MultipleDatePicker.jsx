import axios from "axios";
import React, { useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import { toast } from "react-toastify";
import DatePanel from "react-multi-date-picker/plugins/date_panel";
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import { getHoliday } from "./ReuseableAPI";
const localizer = dayjsLocalizer(dayjs);

function HolidayPicker({ changeHolidayUI }) {
    const [holidays, setHolidays] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");

    async function addHolidays() {
        try {
            const res = await axios.post(`${url}/api/holidays`, { holidays }, {
                headers: {
                    Authorization: token || ""
                }
            });
            toast.success(res.data.message);
            changeHolidayUI();
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    useEffect(() => {
        async function gettingHoliday() {
            try {
                const res = await getHoliday();
                console.log(res);

                setHolidays(res.map((item) => ({
                    title: item,
                    start: new Date(item),
                    end: new Date(item)
                })))
            } catch (error) {
                setHolidays([])
                toast.error(error)
            }
        }
        gettingHoliday();
    }, [])

    function getdata(e) {
        console.log(e);
    }

    return (
        holidays.length > 0 ?
            <Calendar
                localizer={localizer}
                events={holidays}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={getdata}
                style={{ height: 500 }}
            // eventPropGetter={eventPropGetter}
            /> :
            <div className="d-flex gap-2 justify-content-end my-2" >
                <DatePicker
                    value={holidays} // Pass the selected dates to the DatePicker
                    onChange={(dates) => {
                        setHolidays(dates.map((date) => date.format("YYYY-MM-DD"))); // Store in readable format
                    }}
                    multiple // Enable multiple date selection
                    style={{ height: "40px" }}
                    plugins={[
                        <DatePanel />
                    ]}
                    placeholder="Select Year of holidays"
                />
                <button className="button" onClick={addHolidays} disabled={holidays.length > 0 ? false : true}>+ Add Holidays</button>
            </div>
    );
}

export default HolidayPicker;
