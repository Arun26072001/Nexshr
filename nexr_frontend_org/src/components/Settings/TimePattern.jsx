import React, { useEffect, useState } from "react";
import AddTimePattern from "./AddTimePattern";
import axios from "axios";
import { toast } from "react-toastify";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EditTimePattern from "./EditTimePattern";
import WeeklyDaysDetails from "./WeeklyDaysDetails";
import Loading from "../Loader";
import "../payslip/dashboard.css";
import { Dropdown } from "rsuite";

const TimePattern = () => {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [workingTime, setWorkingTime] = useState(false);
    const [patternName, setPatternName] = useState("");
    const names = ["Names", "Days", "Assigned"];
    const days = ["Mon", "Tues", "Wednes", "Thus", "Fri", "Sat", "Sun"];
    const [curState, setCurState] = useState(null);
    const [curPattern, setCurPattern] = useState(null);
    const [timePatterns, setTimePatterns] = useState([]);
    const [selectedPattern, setSelectedPattern] = useState("");
    const [dom, reload] = useState(false);

    function handleAddWorkingTime() {
        setWorkingTime(!workingTime);
    }

    function ChangeShowDays(pattern) {
        setCurPattern(prevPattern => prevPattern === pattern ? null : pattern);
    }

    function handleEdit(pattern) {
        setPatternName(pattern.PatternName)
        setCurState(pattern);
    }

    function closeModel() {
        setCurState(null)
    }

    function handleSubmit(id) {
        const body = {
            "PatternName": curState.PatternName
        };
        console.log(body);
        axios.put(`${url}/api/time-pattern/${id}`, body, {
            headers: {
                authorization: token || ""
            }
        }).then((res) => {
            setCurState(null)
            reload(!dom);
            toast.success(res.data);
        }).catch((err) => {
            toast.error(err)
        })
    }

    function changePatternName(e) {
        const { name, value } = e.target;
        setCurState({
            ...curState,
            [name]: value
        })
    }

    function handleDelete(pattern) {
        if (!pattern.DefaultPattern) {
            axios.delete(`${url}/api/time-pattern/${pattern._id}`, {
                headers: {
                    authorization: token || ""
                }
            }).then((res) => {
                reload(!dom);
                toast.success(res.data);
            }).catch((err) => {
                console.log(err);
            })
        } else {
            toast.error("Can't delete default time pattern")
        }
    }

    function handleSelectedPattern(pattern) {
        if (selectedPattern) {
            setSelectedPattern("")
        } else {
            setSelectedPattern(pattern)
        }
    }

    useEffect(() => {
        axios.get(`${url}/api/time-pattern`, {
            headers: {
                authorization: token || ""
            }
        }).then((res) => {
            setTimePatterns(res.data);
            console.log(res.data);
        }).catch((err) => {
            console.log(err);
        })
    }, [dom]);

    return (
        workingTime ? (
            <AddTimePattern handleAddWorkingTime={handleAddWorkingTime} dom={dom} reload={reload} />
        ) : (
            <>
                <div className="d-flex align-items-center justify-content-between m-3">
                    <div>
                        <h5>CURRENT WORKING TIME PATTERNS </h5>
                        <p className="styleText mt-3">
                            New employees imported into the system will be defaulted to the pattern: <b>{timePatterns.length > 0 && timePatterns[timePatterns.length - 1].PatternName}</b>
                        </p>
                    </div>
                    <div>
                        <button className="button" onClick={handleAddWorkingTime}>
                            Add new pattern
                        </button>
                    </div>
                </div>
                {timePatterns.length > 0 ? (<table className='table table-striped my-2'>
                    <thead>
                        <tr style={{ backgroundColor: "#BBE9FF", textAlign: "center" }}>
                            {names.map((name, index) => (
                                <th key={index}>{name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timePatterns.map(pattern => (
                            <React.Fragment key={pattern._id}>
                                {curState && <EditTimePattern handleSubmit={handleSubmit} patternName={patternName} changePatternName={changePatternName} closeModel={closeModel} pattern={curState} />}
                                <tr>
                                    <td className="text-center">

                                        <div className="col-lg-12 row">
                                            <div className="col-lg-6"> {pattern.PatternName}</div>
                                            <div className="col-lg-6">{pattern.DefaultPattern && <div className="defaultDesign text-lead">Default</div>}</div>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        Monday - {days[pattern.WeeklyDays - 1]}day
                                    </td>
                                    <td className="d-flex justify-content-between align-item-center">
                                        <div className="text-primary d-flex align-items-center">
                                            <GroupOutlinedIcon fontSize="large" color="primary" />
                                            <span className="px-2">0</span>
                                            <Dropdown placement='leftStart' title={<EditRoundedIcon style={{ cursor: "pointer" }} />} noCaret>
                                                {/* <Dropdown.Item style={{ minWidth: 120 }}>Response</Dropdown.Item> */}
                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => handleEdit(pattern)}>Edit</Dropdown.Item>
                                                <Dropdown.Item style={{ minWidth: 120 }} onClick={() => handleDelete(pattern)}>Delete</Dropdown.Item>
                                            </Dropdown>
                                        </div>
                                        <div className="hoverStyle">
                                            <span className={`KeyboardArrowDownSharpIcon ${selectedPattern === pattern._id ? "rotate" : ""}`} onClick={() => handleSelectedPattern(pattern._id)}>
                                                <KeyboardArrowDownIcon fontSize="large" color="primary" onClick={() => ChangeShowDays(pattern)} />
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                {curPattern === pattern && (
                                    <tr>
                                        <td colSpan="3">
                                            <WeeklyDaysDetails pattern={curPattern} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>) : <div className="d-flex align-items-center justify-content-center"><Loading height="80vh" /></div>}

            </>
        )
    );
};

export default TimePattern;
