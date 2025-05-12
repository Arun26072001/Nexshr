import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import { toast } from "react-toastify";
import DatePanel from "react-multi-date-picker/plugins/date_panel";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { Input } from "rsuite";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import { getHoliday } from "./ReuseableAPI";
import Loading from "./Loader";
import NoDataFound from "./payslip/NoDataFound";
import { EssentialValues } from "../App";

const localizer = dayjsLocalizer(dayjs);

function HolidayPicker({ changeHolidayUI, isAddHolidays }) {
    const [holidays, setHolidays] = useState([]); // Stores selected holidays
    const [titles, setTitles] = useState([]);
    const [fetchedHolidays, setFetchedHolidays] = useState([]); // Stores holiday titles
    const url = process.env.REACT_APP_API_URL;
    const {data} = useContext(EssentialValues)
    const [isLoading, setIsLoading] = useState(false);

    // Function to send holidays to backend
    async function addHolidays() {
        try {
            const isAllAdded = holidays.some((value) => !["", undefined].includes(titles[value]));
            if (isAllAdded) {
                const newHolidays = holidays.map((item) => ({
                    date: item,
                    title: titles[item]
                }))
                const res = await axios.post(
                    `${url}/api/holidays`,
                    { holidays: newHolidays },
                    {
                        headers: {
                            Authorization: data.token || "",
                        },
                    }
                );
                toast.success(res.data.message);
                changeHolidayUI();
                setHolidays([])
                setTitles([]);
            } else {
                console.log("please fill all date of title");
            }
        } catch (error) {
            console.log(error);

            toast.error(error.response?.data?.error || "Error adding holidays");
        }
    }

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

    // Fetch holidays on component mount
    useEffect(() => {
        async function gettingHoliday() {
            setIsLoading(true);
            try {
                const res = await getHoliday();
                setFetchedHolidays(
                    res?.holidays?.map((item) => ({
                        title: item.title || "Untitled Holiday", // ✅ Ensure title is not empty
                        start: new Date(item.date),
                        end: new Date(item.date),
                    }))
                );
            } catch (error) {
                console.log(error);
                setFetchedHolidays([]);
            }
            setIsLoading(false);
        }
        gettingHoliday();
    }, [isAddHolidays]);

    // Handle title input change
    function handleHolidaysTitle(value, name) {
        setTitles((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    return (
        isLoading ? <Loading height="80vh" /> :
            fetchedHolidays?.length > 0 ?
                <Calendar
                    localizer={localizer}
                    events={fetchedHolidays}
                    startAccessor="start"
                    endAccessor="end"
                    // onSelectEvent={getdata}
                    eventPropGetter={eventPropGetter}
                    style={{ height: 500 }}
                /> :
                <>
                    <div className="d-flex gap-2 justify-content-end my-2">
                        <DatePicker
                            value={holidays}
                            onChange={(dates) => {
                                setHolidays(dates.map((date) => date.format("YYYY-MM-DD"))); // Properly updating state
                            }}
                            multiple
                            style={{ height: "40px" }}
                            plugins={[<DatePanel key="date-panel" />]}
                            placeholder="Select Year of Holidays"
                        />

                        {holidays.length > 0 && (
                            <div className="inputs">
                                {holidays.map((day) => (
                                    <Input
                                        key={day}
                                        size="sm"
                                        name={day}
                                        value={titles[day] || ""}
                                        onChange={(value) => handleHolidaysTitle(value, day)}
                                        placeholder={`Title for ${day}`}
                                    />
                                ))}
                            </div>
                        )}

                        <button
                            className="button"
                            onClick={addHolidays}
                            disabled={holidays.length === Object.keys(titles).length ? false : true}
                        >
                            + Add Holidays
                        </button>
                    </div>
                    <NoDataFound message="Please Add Holidays for this year" />
                </>
    );
}

export default HolidayPicker;
