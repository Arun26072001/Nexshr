import axios from "axios";
import React, { useState } from "react";
import DatePicker from "react-multi-date-picker";
import { toast } from "react-toastify";

function HolidayPicker({handleViewCom}) {
    const [holidays, setHolidays] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");

    const handleRemoveDate = (indexToRemove) => {
        setHolidays(holidays.filter((_, index) => index !== indexToRemove));
    };

    async function addHolidays() {
        try {
            const res = await axios.post(`${url}/api/holidays`, {holidays}, {
                headers: {
                    Authorization: token || ""
                }
            });
            toast.success(res.data);
        } catch (error) {
            toast.error(error.response.data.error)
        }

    }

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>Selected Holidays:</h3>
            <ul style={styles.list}>
                {holidays?.map((date, index) => (
                    <li key={index} style={styles.listItem}>
                        <span>{date.format("YYYY-MM-DD")}</span>
                        <button
                            style={styles.removeButton}
                            onClick={() => handleRemoveDate(index)}
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>

            <DatePicker
                value={holidays} // Pass the selected dates to the DatePicker
                onChange={setHolidays} // Update state when dates change
                multiple // Enable multiple date selection
                style={styles.datePicker}
            />
            <div className="text-center my-2">
                <button className="button" onClick={addHolidays} disabled={holidays.length > 0 ? false : true}>Add Holiday for {new Date().getFullYear()}</button>
            </div>
        </div>
    );
}

// Custom Styles
const styles = {
    container: {
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "400px",
        margin: "auto",
        backgroundColor: "#f9f9f9",
    },
    header: {
        fontSize: "1.5rem",
        color: "#333",
        marginBottom: "10px",
    },
    list: {
        listStyleType: "none",
        padding: 0,
        marginBottom: "20px",
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 10px",
        marginBottom: "5px",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "4px",
    },
    removeButton: {
        backgroundColor: "#ff4d4f",
        color: "#fff",
        border: "none",
        padding: "5px 10px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    datePicker: {
        width: "100%",
    },
};

export default HolidayPicker;
