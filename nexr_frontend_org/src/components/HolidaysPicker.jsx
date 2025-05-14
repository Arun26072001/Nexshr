import axios from "axios";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";
import { toast } from "react-toastify";
import DatePanel from "react-multi-date-picker/plugins/date_panel";
import weekends from "react-multi-date-picker/plugins/highlight_weekends";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import { Button, Input, InputNumber, Modal } from "rsuite";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import { getHoliday } from "./ReuseableAPI";
import { EssentialValues } from "../App";
import LeaveTable from "./LeaveTable";
import { Skeleton } from "@mui/material";
import Loading from "./Loader";

const localizer = dayjsLocalizer(dayjs);

function Holiday() {
    const [holidays, setHolidays] = useState([]);
    const [titles, setTitles] = useState({});
    const [holidayObj, setHolidayObj] = useState({});
    const [fetchedHolidays, setFetchedHolidays] = useState([]);
    const [allYearHoliday, setAllYearHoliday] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const [changeHoliday, setChangeHoliday] = useState({ isAdd: false, isEdit: false });

    const { data, whoIs } = useContext(EssentialValues);
    const url = process.env.REACT_APP_API_URL;

    const isEditable = useMemo(() => changeHoliday.isAdd || changeHoliday.isEdit, [changeHoliday]);

    const toggleHolidayMode = useCallback((type, value = null) => {
        const isEdit = type === "Edit";
        if (isEdit && !changeHoliday.isEdit && value) {
            setHolidayObj(value);
            const formatted = value.holidays.map((h) => h.date);
            setHolidays(formatted);
            const titleMap = Object.fromEntries(value.holidays.map((h) => [h.date, h.title]));
            setTitles(titleMap);
        } else {
            setHolidays([]);
            setTitles({});
            setHolidayObj({});
        }

        setChangeHoliday((prev) => ({
            ...prev,
            [isEdit ? "isEdit" : "isAdd"]: !prev[isEdit ? "isEdit" : "isAdd"]
        }));
    }, [changeHoliday]);

    const fetchAllYearHolidays = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/holidays`, {
                headers: { Authorization: data.token }
            });
            setAllYearHoliday(res.data);
        } catch (err) {
            console.error("Error fetching all-year holidays", err);
        } finally {
            setIsLoading(false);
        }
    }, [url, data.token]);

    const fetchHolidays = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getHoliday();
            const mapped = (res?.holidays || []).map(item => ({
                title: item.title || "Untitled Holiday",
                start: new Date(item.date),
                end: new Date(item.date)
            }));
            setFetchedHolidays(mapped);
        } catch (err) {
            console.error("Error fetching holidays", err);
            setFetchedHolidays([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fillHolidayObj = useCallback((value, name) => {
        setHolidayObj(prev => ({ ...prev, [name]: value }));
    }, []);

    const addOrUpdateHolidays = async () => {
        try {
            setIsWorkingApi(true);

            const isAllFilled = holidays.every(date => titles[date]);
            if (!isAllFilled) {
                toast.warn("Please fill titles for all selected dates");
                return;
            }

            const payload = {
                ...holidayObj,
                holidays: holidays.map(date => ({ date, title: titles[date] }))
            };

            const method = changeHoliday.isEdit ? axios.put : axios.post;
            const endpoint = changeHoliday.isEdit
                ? `${url}/api/holidays/${holidayObj._id}`
                : `${url}/api/holidays`;

            const res = await method(endpoint, payload, {
                headers: { Authorization: data.token }
            });

            toast.success(res.data.message);
            toggleHolidayMode(changeHoliday.isEdit ? "Edit" : "Add");
            fetchAllYearHolidays();
            setHolidays([]);
            setTitles({});
        } catch (err) {
            console.error("Error saving holidays", err);
            toast.error(err.response?.data?.error || "Error saving holidays");
        } finally {
            setIsWorkingApi(false);
        }
    };

    const deleteHoliday = useCallback(async (id) => {
        try {
            const res = await axios.delete(`${url}/api/holidays/${id}`, {
                headers: { Authorization: data.token }
            });
            toast.success(res.data.message);
            fetchAllYearHolidays();
        } catch (err) {
            console.error("Error deleting holiday", err);
        }
    }, [url, data.token, fetchAllYearHolidays]);

    useEffect(() => {
        if (["admin", "hr"].includes(whoIs)) fetchAllYearHolidays();
        else fetchHolidays();
    }, [whoIs, fetchAllYearHolidays, fetchHolidays]);

    const eventPropGetter = () => ({
        style: {
            backgroundColor: "#5D8736",
            color: "#fff",
            padding: "5px"
        }
    });

    const renderHolidayForm = () => (
        <Modal open={changeHoliday.isEdit || changeHoliday.isAdd} size="sm" backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    {`${changeHoliday.isEdit ? "Edit" : "Add"} Holidays`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <>
                    <div className="d-flex justify-content-center gap-2">
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel important'>Select Holidays </p>
                                <DatePicker
                                    multiple
                                    format="YYYY-MM-DD"
                                    value={holidays}
                                    onChange={(dates) => setHolidays(dates.map(d => d.format("YYYY-MM-DD")))}
                                    style={{ height: "40px" }}
                                    plugins={[<DatePanel key="panel" />, weekends()]}
                                    placeholder="Select holidays"
                                />
                            </div>
                        </div>
                        <div className="col-half">
                            <div className="modelInput">
                                <p className='modelLabel important'>Holiday Year</p>
                                <InputNumber size="lg" value={holidayObj?.currentYear} onChange={(val) => fillHolidayObj(val, "currentYear")} />
                            </div>
                        </div>
                    </div>
                    {holidays.length > 0 && (
                        <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                            {holidays.map(date => (
                                <div className="col-half" key={date}>
                                    <div className="modelInput">
                                        <p className='modelLabel important'>{date} Title: </p>
                                        <Input
                                            key={date}
                                            size="lg"
                                            width={"100%"}
                                            value={titles[date] || ""}
                                            onChange={(val) => setTitles(prev => ({ ...prev, [date]: val }))}
                                        />
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => toggleHolidayMode(changeHoliday.isEdit ? "Edit" : "Add")} appearance="default">Back</Button>
                <Button onClick={addOrUpdateHolidays} appearance="primary"> {isWorkingApi ? <Loading color="white" size={20} /> : changeHoliday.isEdit ? "Update Holiday" : "Add Holiday"}</Button>
            </Modal.Footer>
        </Modal>
    );

    if (isLoading) {
        return <Skeleton sx={{ bgcolor: "grey.500" }} variant="rectangular" width="100%" height="80vh" />;
    }

    return (
        <>
            {isEditable ? renderHolidayForm() :
                ["admin", "hr"].includes(whoIs) ? (
                    <>
                        <div className="leaveDateParent row px-2">
                            <p className="payslipTitle col-6">Leave</p>
                            <div className="col-6 d-flex justify-content-end">
                                <button className="button mx-1" onClick={() => toggleHolidayMode("Add")}>Add Holidays</button>
                            </div>
                        </div>
                        <LeaveTable data={allYearHoliday} deleteData={deleteHoliday} handleChangeData={toggleHolidayMode} />
                    </>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={fetchedHolidays}
                        startAccessor="start"
                        endAccessor="end"
                        eventPropGetter={eventPropGetter}
                        style={{ height: 500 }}
                    />
                )
            }
        </>
    );
}

export default Holiday;
