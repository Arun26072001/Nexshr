import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { EssentialValues } from '../../App';
import { Skeleton } from "@mui/material";
import { calculateTimePattern, createTask } from '../ReuseableAPI';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PauseCircleFilledRoundedIcon from '@mui/icons-material/PauseCircleFilledRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import SubdirectoryArrowLeftRoundedIcon from '@mui/icons-material/SubdirectoryArrowLeftRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';

export default function Planner({ isLoading, updateTaskStatus, fetchEmpAssignedTasks, updatedTimerInTask, plannerTasks }) {
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const { data } = useContext(EssentialValues);
    const [categories, setCategories] = useState([]);
    // for task 
    const [isHovering, setIsHovering] = useState("");
    // for list of task
    const [onHover, setOnHover] = useState("");
    const [isWorkingTask, setIsWorkingTask] = useState("");
    const [taskObj, setTaskObj] = useState({});
    const [addTaskFor, setAddTaskFor] = useState("");
    const [draggedOver, setDraggedOver] = useState("");

    const handleDragStart = (e, task, taskType) => {
        e.dataTransfer.setData('application/json', JSON.stringify([task, taskType]));
    };

    const handleDragOver = (e, category) => {
        e.preventDefault(); // Required to allow drop
        setDraggedOver(category);
    };

    function mergeToSpecifyArray(category, task, taskType) {
        // if (category !== "Completed" && taskType !== category) {
        //     let updatedTask = { ...task };

        //     const removeFromType = plannerTasks[taskType].filter((taskData) => taskData._id !== task._id);

        //     setCategorizeTasks((prev) => ({
        //         ...prev,
        //         [taskType]: removeFromType,
        //         [category]: [...prev[category], updatedTask],
        //     }));
        //     updateTask(updatedTask)
        // }
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const [taskData, category] = JSON.parse(e.dataTransfer.getData("application/json"))
        mergeToSpecifyArray(draggedOver, taskData, category)
        setDraggedOver("");
    };

    function dateFormat(date) {
        const actualDate = new Date(date);
        return `${actualDate.toLocaleString("default", { month: "long" })} ${actualDate.getDate()} ${actualDate.toLocaleTimeString()}`
    }

    function startTime(task) {
        setIsWorkingTask(task._id)
        updatedTimerInTask(task, "startTime")
    }

    function stopTime(task) {
        setIsWorkingTask("")
        updatedTimerInTask(task, "stopTime")
    }

    function fillTaskObj(title) {
        setTaskObj((pre) => ({
            ...pre,
            title,
        }))
    }

    function contentTemplate(task, category) {
        const creator = task.createdby ? task?.createdby?.FirstName + " " + task?.createdby?.LastName : data.Name

        return (
            <div className='p-2 my-1 timeLogBox' draggable={category !== "Completed"} onDragStart={(e) => handleDragStart(e, task, category)} style={{ borderLeft: "3px solid black" }} onMouseEnter={() => setIsHovering(task._id)} onMouseLeave={() => setIsHovering("")} >
                <div className="sub_text" style={{ fontWeight: 600 }}>{task.title}</div>
                <p className="sub_text dateContainer" >{task.status === "Completed" ? "Completed" : task.to ? dateFormat(task.to) : "No DeadLine"}</p>
                <div className="d-flex justify-content-between">
                    <div>
                        <AccountCircleRoundedIcon color="disabled" sx={{ cursor: "pointer" }} titleAccess={data.Name + " " + "(assignee)"} />
                        <ChevronRightRoundedIcon sx={{ cursor: "pointer" }} />
                        <AccountCircleRoundedIcon color="disabled" titleAccess={creator + " " + "(creator)"} sx={{ cursor: "pointer" }} />
                    </div>
                    {task.status !== "Completed" ?
                        task._id === isHovering &&
                        <div >
                            {
                                isWorkingTask === task._id ? <PauseCircleFilledRoundedIcon sx={{ cursor: "pointer", color: "red" }} titleAccess="Pause Task" onClick={() => stopTime(task)} /> :
                                    <PlayCircleFilledRoundedIcon color="success" sx={{ cursor: "pointer", color: "green" }} titleAccess="Start Task" onClick={() => startTime(task)} />
                            }
                            <CheckCircleRoundedIcon sx={{ cursor: "pointer" }} color="action" onClick={() => updateTaskStatus(task)} />
                        </div> : null
                    }
                </div>
            </div>
        );
    }

    useEffect(() => {
        const inputElement = document.getElementById("taskNameInput");
        if (!inputElement) return;

        const handleKeyPress = async (e) => {
            if (e.key === "Enter") {
                const from = new Date();
                const to = new Date(new Date().setDate(from.getDate() + 5))
                const updatedTaskObj = {
                    ...taskObj,
                    createdby: data._id,
                    assignedTo: [data._id],
                    from,
                    to,
                    status: "Pending",
                    priority: "Low",
                    estTime: calculateTimePattern(from, to)
                };

                await createTask(updatedTaskObj);
                setAddTaskFor("");
                setTaskObj({});
                fetchEmpAssignedTasks();
            }
        };

        inputElement.addEventListener("keypress", handleKeyPress);

        // cleanup
        return () => {
            inputElement.removeEventListener("keypress", handleKeyPress);
        };
    }, [addTaskFor, taskObj, data]);

    async function fetchCategories() {
        try {
            const res = await axios.get(`${url}api/planner/${data._id}`, {
                headers: {
                    Authorization: data.token
                }
            })
            console.log("categories", res.data.categories);

            setCategories(res.data.categories);
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch categories", error);

        }
    }
    useEffect(() => {
        fetchCategories()
    }, [])

    // console.log(plannerTasks);

    return (
        isLoading ? (
            <>
                <div className="d-flex align-content-stretch flex-wrap w-100">
                    {/* Skeleton headers */}
                    {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} style={{ margin: "2px", flex: 1, height: "50px" }} variant="wave" />
                    ))}
                </div>
                <div className="d-flex align-content-stretch flex-wrap w-100">
                    {/* Skeleton content */}
                    {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} style={{ margin: "2px", flex: 1, height: "250px" }} variant="wave" />
                    ))}
                </div>
            </>
        ) :
            <div className="kanbanboard-parent" >
                {
                    categories?.map((category) => {
                        return <div key={category._id} className="kanbanboard-child" style={{ opacity: draggedOver === category._id ? 0.6 : null }}
                            onDragOver={(e) => handleDragOver(e, category._id)} onDragLeave={() => setDraggedOver("")}
                            onDrop={handleDrop} onMouseEnter={() => setOnHover(category._id)} onMouseLeave={() => setOnHover("")} >
                            <div className="kanbanboard-child-heading" style={{ backgroundColor: "black", color: "white" }}>
                                {category?.name}({plannerTasks[category._id]?.length})
                            </div>
                            {!["Completed", "Overdue"].includes(category._id) ?
                                <div className="addTask-btn" onClick={() => setAddTaskFor(category._id)} style={{ background: onHover === category._id ? "#DDDDDD" : null, cursor: "pointer" }}><AddRoundedIcon /> {onHover === category._id ? "Quick Task" : ""}</div> : null
                            }
                            {
                                addTaskFor === category._id &&
                                <div className="timeLogBox" >
                                    <input className="mb-3" id="taskNameInput" value={taskObj?.title} placeholder="Name #tag" onChange={(e) => fillTaskObj(e.target.value, category)} />
                                    <p>Press <SubdirectoryArrowLeftRoundedIcon /> to create</p>
                                </div>
                            }
                            {
                                plannerTasks[category._id].length ?
                                    plannerTasks[category._id]?.map((task) => {
                                        return contentTemplate(task, category._id)
                                    }) : null
                            }
                        </div>
                    })
                }
            </div>
    );

}
