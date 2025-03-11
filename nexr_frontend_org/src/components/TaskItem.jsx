import React, { useEffect, useState } from 'react'
import { Checkbox, Whisper } from 'rsuite';
import { useNavigate } from 'react-router-dom';

// icons
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import Mytimer2 from './Mytimer2';
import { ScaleLoader } from 'react-spinners';
import { getTimeToHour } from './ReuseableAPI';

export default function TaskItem({ task, status, getValue, handleEditTask, handleAddComment, fetchTaskById, updatedTimerInTask, renderMenu2, handleViewTask, whoIs, isLoading, }) {
    const navigate = useNavigate();
    // const [timeData, setTimeData] = useState({ hour: 0, min: 0, sec: 0 });
    const [remainingTime, setRemainingTime] = useState({ hour: 0, min: 0, sec: 0 });

    function convertDecimalToTime(decimalHours) {
        const timeValues = {
            hour: Math.floor(decimalHours) || 0,
            min: Math.floor((decimalHours * 60) % 60) || 0,
            sec: Math.floor((decimalHours * 3600) % 60) || 0
        };
        return timeValues;
    }

    useEffect(() => {
        const calculatedValue = Number(task.estTime) - getTimeToHour(task.spend.timeHolder)
        setRemainingTime(convertDecimalToTime(calculatedValue));
    }, [task]);

    return (

        <div key={task._id} className="box-content d-flex align-items-center justify-content-between my-3">

            {/* Left Section - Task Details */}
            <div className="d-flex align-items-center col-half gap-1">
                <Checkbox
                    onCheckboxClick={() => getValue(task)}
                    checked={status === "Completed"}
                />
                <b>{task.title}</b> ||

                <span className={`defaultDesign text-light ${task.status === "Pending" ? "bg-danger" : task.status === "Completed" ? "bg-success" : "bg-warning"}`}>
                    {task.status}
                </span> ||

                {/* Assigned Employees */}
                <div className="d-flex align-items-center gap-1 mx-1">
                    {task.assignedTo.map((emp) => (
                        <div
                            className="nameHolder"
                            style={{ width: "30px", height: "30px" }}
                            key={emp._id}
                        >
                            {emp.FirstName[0].toUpperCase() + emp.LastName[0].toUpperCase()}
                        </div>
                    ))}

                    <AddCircleOutlineRoundedIcon
                        sx={{ cursor: "pointer" }}
                        fontSize="large"
                        color="disabled"
                        onClick={() => {
                            fetchTaskById(task._id);
                            handleEditTask();
                        }}
                    />
                </div>
            </div>

            {/* Right Section - Timer & Actions */}
            <div className="cal-half d-flex align-items-center justify-content-center gap-2">
                {
                    JSON.parse(localStorage.getItem(`isRunning_${task._id}`)) === false &&
                    <div className='d-flex align-items-center gap-1 timerTxt box-content position-relative' title='Remaining Hours' style={{ padding: "10px" }}>
                        <span>{String(remainingTime.hour).padStart(2, "0")}</span> :
                        <span>{String(remainingTime.min).padStart(2, "0")}</span> :
                        <span>{String(remainingTime.sec).padStart(2, "0")}</span>
                    </div>
                }
                {
                    isLoading ?
                        <ScaleLoader size={100} color="#123abc" />
                        :
                        <Mytimer2 task={task} updatedTimerInTask={updatedTimerInTask} />
                }
                <ErrorOutlineRoundedIcon
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                        fetchTaskById(task._id);
                        handleViewTask();
                    }}
                />

                <span
                    className="defaultDesign text-light"
                    title="Project Name"
                    style={{ background: task.project.color }}
                >
                    {task.project.name}
                </span>

                <CalendarMonthRoundedIcon sx={{ cursor: "pointer" }} onClick={() => handleAddComment(task._id)} />

                <span style={{ cursor: "pointer" }}>
                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu2(task)}>
                        <MoreVertRoundedIcon sx={{ cursor: "pointer" }} />
                    </Whisper>
                </span>

                <span
                    className="nameHolder"
                    style={{ width: "25px", height: "25px" }}
                    onClick={() => navigate(`/${whoIs}/tasks/time-log/${task._id}`)}
                >
                    <KeyboardArrowRightRoundedIcon />
                </span>
            </div>

        </div>
    )
} 
