import React, { useEffect, useState } from "react";
import AddTimePattern from "./AddTimePattern";
import axios from "axios";
import { toast } from "react-toastify";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EditTimePattern from "./EditTimePattern";
import WeeklyDaysDetails from "./WeeklyDaysDetails";
import Loading from "../Loader";

const TimePattern = (props) => {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [workingTime, setWorkingTime] = useState(false);
    const [patternName, setPatternName] = useState("");
    const names = ["Names", "Days", "Assigned"];
    const days = ["Mon", "Tues", "Wednes", "Thus", "Fri", "Sat", "Sun"];
    const [curState, setCurState] = useState(null);
    const [curPattern, setCurPattern] = useState(null);
    const [timePatterns, setTimePatterns] = useState([]);
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
    console.log(curState);

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
                        <h4>Current working time patterns</h4>
                        <p className="styleText">
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
                        <tr style={{ backgroundColor: "#BBE9FF", textAlign:"center" }}>
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
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div>
                                                {pattern.PatternName}
                                            </div>
                                            {pattern.DefaultPattern && <div className="defaultDesign text-lead">Default</div>}
                                        </div>
                                    </td>
                                    <td>
                                        Monday - {days[pattern.WeeklyDays - 1]}day
                                    </td>
                                    <td className="d-flex justify-content-between">
                                        <div className="text-primary d-flex align-items-center">
                                            <GroupOutlinedIcon fontSize="large" color="primary" />
                                            <span className="px-2">0</span>
                                            <div className="dropdown">
                                                <span className="nameHolder" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><MoreVertIcon /></span>
                                                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                                    <a className="dropdown-item text-primary" onClick={() => handleEdit(pattern)} data-toggle="modal" data-target="#exampleModalCenter"> <EditOutlinedIcon /> Edit</a>
                                                    <a className="dropdown-item text-danger" onClick={() => handleDelete(pattern)}><DeleteOutlineOutlinedIcon /> Delete</a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hoverStyle">
                                            <KeyboardArrowDownIcon fontSize="large" color="primary" onClick={() => ChangeShowDays(pattern)} />
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
                </table>) : <div className="d-flex align-items-center justify-content-center"><Loading /></div>}

            </>
        )
    );
};

export default TimePattern;
