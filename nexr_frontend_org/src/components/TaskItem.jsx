import React, { useEffect, useState } from 'react'
import { Checkbox, Whisper } from 'rsuite';
import defaultProfile from "../imgs/male_avatar.webp";

// icons
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import Mytimer2 from './Mytimer2';
import { ScaleLoader } from 'react-spinners';
import { formatTimeFromHour, getTimeFromHour } from './ReuseableAPI';

export default function TaskItem({ task, status, getValue, handleEditTask, handleAddComment, fetchTaskById, renderMenu3, updatedTimerInTask, renderMenu2, handleViewTask, isLoading }) {
    const [remainingTime, setRemainingTime] = useState({ hour: 0, min: 0, sec: 0 });

    useEffect(() => {
        const spendTime = task?.spend?.timeHolder?.split(/[:.]+/)?.length > 2 ? getTimeFromHour(task.spend.timeHolder) : Number(task.spend.timeHolder)

        const calculatedValue = Number(task.estTime) - spendTime
        const hourMinSec = formatTimeFromHour(calculatedValue)

        setRemainingTime({
            hour: hourMinSec.split(/[:.]+/)[0],
            min: hourMinSec.split(/[:.]+/)[1],
            sec: hourMinSec.split(/[:.]+/)[2]
        });
    }, [task]);

    return (
        <div key={task._id} className="box-content d-flex flex-wrap  align-items-center justify-content-between my-3">
            {/* Left Section - Task Details */}
            <div className=" d-flex flex-wrap  align-items-center col-lg-6 col-12 col-md-6 col-half gap-1">
                <Checkbox
                    onCheckboxClick={() => getValue(task)}
                    checked={status === "Completed"}
                />
                <b>{task.title}</b> 

                <span className={`defaultDesign text-light ${task.status === "Pending" ? "bg-danger" : task.status === "Completed" ? "bg-success" : "bg-warning"}`}>
                    {task.status}
                </span> 

                {/* Assigned Employees */}
                <div className=" d-flex flex-wrap  align-items-center gap-1 mx-1">
                    {task.assignedTo.slice(0, 3).map((emp) => (
                        <div
                            className="nameHolder"
                            style={{ width: "30px", height: "30px", background: "none" }}
                            key={emp._id}
                            title={`${emp.FirstName + " " + emp.LastName}`}
                        >
                            <img src={emp?.profile || defaultProfile} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt={`${emp.FirstName + " " + emp.LastName}`} />
                        </div>
                    ))}
                    {
                        Array.isArray(task.assignedTo) && task.assignedTo.length > 3 ? "..." : ""
                    }

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
            <div className="cal-half  d-flex flex-wrap  col-lg-6 col-12 col-md-6 align-items-center justify-content-end gap-2">
                {
                    JSON.parse(localStorage.getItem(`isRunning_${task._id}`)) === false &&
                    <div className=' d-flex flex-wrap  align-items-center gap-1 timerTxt box-content position-relative' title='Remaining Hours' style={{ padding: "10px" }}>
                        <span>{String(remainingTime.hour).padStart(2, "0")}</span> :
                        <span>{String(remainingTime.min).padStart(2, "0")}</span> :
                        <span>{String(remainingTime.sec).padStart(2, "0")}</span>
                    </div>
                }
                {
                    isLoading === task._id ?
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
                    style={{ background: task?.project?.color || "#FFC107" }}
                >
                    {task?.project?.name || "Individual"}
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
                >
                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu3(task)}>
                        <KeyboardArrowRightRoundedIcon sx={{ cursor: "pointer" }} />
                    </Whisper>
                </span>
            </div>

        </div>
    )
} 
