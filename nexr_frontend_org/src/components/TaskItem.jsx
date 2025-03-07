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

export default function TaskItem({ task, status, getValue, handleEditTask, fetchTaskById, updatedTimerInTask, renderMenu2, handleViewTask, whoIs }) {
    const navigate = useNavigate();
    const [timeData, setTimeData] = useState({ hour: 0, min: 0, sec: 0 });

    function convertDecimalToTime(decimalHours) {
        const timeValues = {
            hour: Math.floor(decimalHours) || 0,
            min: Math.floor((decimalHours * 60) % 60) || 0,
            sec: Math.floor((decimalHours * 3600) % 60) || 0
        };

        setTimeData(timeValues); // Assuming setTimeData updates state
    }

    useEffect(() => {
        convertDecimalToTime(Number(task.spend));
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
      
                <Mytimer2 task={task} updatedTimerInTask={updatedTimerInTask} />
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

                <CalendarMonthRoundedIcon sx={{ cursor: "pointer" }} />

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
