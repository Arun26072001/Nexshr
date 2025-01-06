import axios from "axios";
import React, { useState } from "react";
import DatePicker from "react-multi-date-picker";
import { toast } from "react-toastify";
import DatePanel from "react-multi-date-picker/plugins/date_panel"

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

    return (
        <div className="d-flex justify-content-between gap-2" >
            <DatePicker
                value={holidays} // Pass the selected dates to the DatePicker
                onChange={(dates) => {
                    setHolidays(dates.map((date) => date.format("YYYY-MM-DD"))); // Store in readable format
                }}
                multiple // Enable multiple date selection
                style={{ height: "35px" }}
                plugins={[
                    <DatePanel />
                ]}
                placeholder="Select Year of holidays"
            />
            <button className="button" onClick={addHolidays} disabled={holidays.length > 0 ? false : true}>Add</button>
        </div>
    );
}

export default HolidayPicker;
