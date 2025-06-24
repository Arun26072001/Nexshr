import React, { useContext, useEffect, useState } from "react";
import InfoIcon from '@mui/icons-material/Info';
import './SettingsStyle.css';
import { Switch } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import WeekDay from "./WeekDays";
import { EssentialValues } from "../../App";
import Loading from "../Loader";
import { useNavigate } from "react-router-dom";


const AddTimePattern = ({ handleAddWorkingTime, reload }) => {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const [timeDifference, setTimeDifference] = useState(0);
    const [isWorkingApi, setIsWorkingApi] = useState(false);

    const [timePattern, setTimePattern] = useState({
        PatternName: "",
        WeeklyDays: 0,
        StartingTime: "",
        FinishingTime: "",
        BreakTime: 0,
        WaitingTime:0,
        DefaultPattern: false,
        PublicHoliday: "",
    })

    useEffect(() => {
        if (timePattern.FinishingTime !== "" && timePattern.StartingTime !== "") {
            if (timePattern.StartingTime && timePattern.FinishingTime) {

                const [startHour, startMinute] = timePattern.StartingTime.split(/[:.]+/).map(num => parseInt(num, 10));
                const [endHour, endMinute] = timePattern.FinishingTime.split(/[:.]+/).map(num => parseInt(num, 10));

                const startDate = new Date();
                startDate.setHours(startHour);
                startDate.setMinutes(startMinute);

                const endDate = new Date();
                endDate.setHours(endHour);
                endDate.setMinutes(endMinute);

                const timeDiff = endDate.getTime() - startDate.getTime();
                const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                setTimeDifference((hoursDiff * 60) + minutesDiff);

            }
        }
    }, [timePattern.FinishingTime, timePattern.StartingTime])

    let startTimeVal = timePattern.StartingTime.split(/[:.]+/).reduce((acc, val) => acc + val);
    let endTimeVal = timePattern.FinishingTime.split(/[:.]+/).reduce((acc, val) => acc + val);

    function makeActive(e) {
        setTimePattern({
            ...timePattern,
            ["PublicHoliday"]: e
        })
    }

    function handleSwitch() {
        setTimePattern({
            ...timePattern,
            ["DefaultPattern"]: !timePattern.DefaultPattern
        })
    }

    function ChangeTimePattern(e) {
        const { name, value } = e.target;
        setTimePattern({
            ...timePattern,
            [name]: value
        })
    }

    //add time pattern
    async function handleTimePattern(e) {
        try {
            e.preventDefault();
            setIsWorkingApi(true);
            const body = timePattern;
            const res = await axios.post(`${url}api/time-pattern`, body,
                {
                    headers: {
                        authorization: data.token
                    }
                })
            toast.success(res.data.message);
            setTimePattern({});
            reload();
            handleAddWorkingTime();
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error);
            console.log(error);
        } finally {
            setIsWorkingApi(false);
        }
    }

    const isSaveEnabled = () => {
        return Object.values(timePattern).every(value => value !== "" && value !== 0);
    };

    return (
        <div className="container">
            <form action="" onSubmit={handleTimePattern}>
                <h5>
                    Add working time pattern
                </h5>
                <p className="styleText"><b>Please note: </b>You cannot edit a pattern after it has been added so make sure you are before finalising it.</p>

                <p>
                    <b>Pattern details</b>
                </p>
                <div className="row">
                    <div className="col-lg-6">
                        <div className="row">
                            <div className="col-lg-6">
                                <p className="styleText">Pattern name</p>
                            </div>
                            <div className="col-lg-6">
                                <input type="text" name="PatternName" placeholder="Pattern name" value={timePattern.PatternName} onChange={(e) => ChangeTimePattern(e)} className="form-control" />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-6">
                                <p
                                    className="styleText"
                                    title="Use this option to make the working time pattern the default for all new employees.">
                                    Make default <InfoIcon />
                                </p>
                            </div>
                            <div className="col-lg-6">
                                <Switch name="DefaultPattern" value={timePattern.DefaultPattern} onClick={handleSwitch} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time and breaks */}
                <h5>
                    <b>Times and breaks</b>
                </h5>
                <p className="styleText my-2">
                    Enter start and end times for your working time pattern.
                </p>
                <div className="row mx-auto gap-2 d-flex align-items-center justify-content-center">
                    {/* Start Time */}
                    <div className="col-lg-2 text-center">
                        <span className="styletext">Start</span>
                        <div className="input-group">
                            <input
                                type="time"
                                name="StartingTime"
                                className="form-control"
                                style={{ border: "none" }}
                                value={timePattern.StartingTime}
                                onChange={(e) => ChangeTimePattern(e)}
                            />
                        </div>
                    </div>

                    {/* Finish Time */}
                    <div className="col-lg-2 text-center">
                        <span className="styletext">Finish</span>
                        <div className="input-group">
                            <input
                                type="time"
                                name="FinishingTime"
                                className="form-control"
                                style={{ border: "none" }}
                                value={timePattern.FinishingTime}
                                onChange={(e) => ChangeTimePattern(e)}
                            />
                        </div>
                        {startTimeVal !== "" && endTimeVal !== "" && startTimeVal >= endTimeVal && (
                            <p className="text-danger">Please select a time later than the start time.</p>
                        )}
                    </div>

                    {/* Break Time */}
                    <div className="col-lg-2 text-center">
                        <span className="styletext">Break</span>
                        <div className="input-group mt-1">
                            <input
                                type="number"
                                name="BreakTime"
                                value={timePattern.BreakTime}
                                className="form-control m-0"
                                style={{ border: "none" }}
                                onChange={(e) => ChangeTimePattern(e)}
                            />
                            <span className="input-group-text" style={{ border: "none", padding: "5px 7px" }}>Mins</span>
                        </div>
                    </div>

                    <div className="col-lg-2 text-center">
                        <span className="styletext">Waiting Time</span>
                        <div className="input-group mt-1">
                            <input
                                type="number"
                                name="WaitingTime"
                                className="form-control m-0"
                                value={timePattern.WaitingTime}
                                style={{ border: "none" }}
                                onChange={(e) => ChangeTimePattern(e)}
                            />
                            <span className="input-group-text" style={{ border: "none", padding: "5px 7px" }}>Mins</span>
                        </div>
                    </div>

                    {/* Repeat Days */}
                    <div className="col-lg-4 text-center">
                        <span className="styletext">Repeat</span>
                        <div className="d-flex justify-content-center align-items-center">
                            {days.map((day) => (
                                <WeekDay key={day} day={day} calDay={timePattern} setCalDay={setTimePattern} />
                            ))}
                        </div>
                        {!timePattern.WeeklyDays && (
                            <p className="text-danger">At least one day must be selected.</p>
                        )}
                    </div>
                </div>

                <p className="my-2 styleText">
                    <b>{timePattern.WeeklyDays} working days </b>
                    Selected totalling <b>{(timePattern.WeeklyDays * ((timeDifference - timePattern.BreakTime) / 60)).toFixed(2)} hrs</b>. excluding breaks
                </p>

                {/* public holidays */}
                <h5>
                    <b>Public holidays</b>
                </h5>
                <p className="styleText my-2">
                    Select it employees on this working time pattern work public holidays and if they are included as part of the annual leave entitlement.
                </p>

                <div className="row mb-5">
                    <div className="col-lg-2 d-flex align-items-center">
                        Public holidays
                    </div>

                    <div className="col-lg-3 d-flex">
                        <div className={`position-relative ${timePattern.PublicHoliday === "Deducated" ? 'box-content active' : 'box-content'}`} onClick={() => makeActive("Deducated")}>
                            <span className="RadioPosition">
                                <input type="radio" name="timePattern.PublicHoliday" checked={timePattern.PublicHoliday === "Deducated"} className="styleRadio" />
                            </span>
                            <h6 className="my-2">
                                Deducated
                            </h6>

                            <p className="styleText">
                                They'll have a day
                                off any public holidays they would
                                normally br wokring on and this is
                                taken from Their yearly holiday
                                entitlement
                            </p>
                        </div>
                    </div>

                    <div className="col-lg-3 d-flex">
                        <div className={`position-relative ${timePattern.PublicHoliday === "Not deducated" ? 'box-content active' : 'box-content'}`} onClick={() => makeActive("Not deducated")}>
                            <span className="RadioPosition">
                                <input type="radio" name="timePattern.PublicHoliday" checked={timePattern.PublicHoliday === "Not deducated"} className="styleRadio" />
                            </span>
                            <h6 className="my-2">
                                Not Deducated
                            </h6>

                            <p className="styleText">
                                They'll have a day
                                off any public holidays they would
                                normally br wokring on and this
                                will be given on top of their yearly
                                holiday entitlement
                            </p>
                        </div>
                    </div>

                    <div className="col-lg-3 d-flex">
                        <div className={`position-relative ${timePattern.PublicHoliday === "works public holidays" ? 'box-content active' : 'box-content'}`} onClick={() => makeActive("works public holidays")}>
                            <span className="RadioPosition">
                                <input type="radio" name="timePattern.PublicHoliday" checked={timePattern.PublicHoliday === "works public holidays"} className="styleRadio" />
                            </span>
                            <h6 className="my-2">
                                Works public holidays
                            </h6>

                            <p className="styleText">
                                Public holidays are seen as normal day
                                and they won't have the day off.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="btnBackground">
                    <div className="fixedPositionBtns">
                        <div className="w-50">
                            <button type="button" className="outline-btn mx-2" onClick={handleAddWorkingTime} >
                                Cancel
                            </button>
                        </div>
                        <div className="w-50">
                            <button type="submit" className="button" style={{ padding: "12px" }} disabled={!isSaveEnabled()}>
                                {isWorkingApi ? <Loading size={20} color='white' /> : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
};

export default AddTimePattern;
