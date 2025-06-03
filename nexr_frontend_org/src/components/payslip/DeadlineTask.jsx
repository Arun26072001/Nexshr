import "./kanbanboardTemplate.css";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PauseCircleFilledRoundedIcon from '@mui/icons-material/PauseCircleFilledRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import SubdirectoryArrowLeftRoundedIcon from '@mui/icons-material/SubdirectoryArrowLeftRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useContext, useEffect, useState } from "react";
import { EssentialValues } from "../../App";
import { Skeleton } from "@mui/material";
import { calculateTimePattern, createTask, getDueDateByType } from "../ReuseableAPI";
import { prefix } from "rsuite/esm/internals/utils";

export default function DeadlineTask({ isLoading, updateTaskStatus, fetchEmpAssignedTasks, updatedTimerInTask, categorizeTasks, setCategorizeTasks, updateTask }) {
    // for task 
    const [isHovering, setIsHovering] = useState("");
    // for list of task
    const [onHover, setOnHover] = useState("");
    const [taskObj, setTaskObj] = useState({});
    const [isWorkingTask, setIsWorkingTask] = useState("");
    const { data } = useContext(EssentialValues);
    const [addTaskFor, setAddTaskFor] = useState("");
    const [draggedOver, setDraggedOver] = useState("");
    const typeOfTasks = [
        { name: "Overdue" },
        { name: "Due Today" },
        { name: "Due This Week" },
        { name: "Due Next Week" },
        { name: "Due Over Two Weeks" },
        { name: "No Deadline" },
        { name: "Completed" }
    ];

    const handleDragStart = (e, task, taskType) => {
        e.dataTransfer.setData('application/json', JSON.stringify([task, taskType]));
    };

    const handleDragOver = (e, type) => {
        e.preventDefault(); // Required to allow drop
        setDraggedOver(type);
    };

    function mergeToSpecifyArray(type, task, taskType) {
        if (type !== "Completed" && taskType !== type) {
            let updatedTask = { ...task };

            const toDate = getDueDateByType(type)
            updatedTask.to = toDate;

            const removeFromType = categorizeTasks[taskType].filter((taskData) => taskData._id !== task._id);

            setCategorizeTasks((prev) => ({
                ...prev,
                [taskType]: removeFromType,
                [type]: [...prev[type], updatedTask],
            }));
            updateTask(updatedTask)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const [taskData, type] = JSON.parse(e.dataTransfer.getData("application/json"))
        mergeToSpecifyArray(draggedOver, taskData, type)
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

    function fillTaskObj(title, type) {
        setTaskObj({
            ...prefix,
            title: title,
        })
    }

    function contentTemplate(task, type) {
        const creator = task.createdby ? task?.createdby?.FirstName + " " + task?.createdby?.LastName : data.Name

        return (
            <div className='p-2 my-1 timeLogBox' draggable={type !== "Completed"} onDragStart={(e) => handleDragStart(e, task, type)} style={{ borderLeft: "3px solid black" }} onMouseEnter={() => setIsHovering(task._id)} onMouseLeave={() => setIsHovering("")} >
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
                const to = getDueDateByType(addTaskFor);
                const updatedTaskObj = {
                    ...taskObj,
                    createdby: data._id,
                    assignedTo: [data._id],
                    from,
                    to,
                    status: "Pending",
                    priority: "Low",
                    estTime: calculateTimePattern(from, to),
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
                    typeOfTasks?.map((type) => {
                        return <div key={type} className="kanbanboard-child" style={{ opacity: draggedOver === type.name ? 0.6 : null }}
                            onDragOver={(e) => handleDragOver(e, type.name)} onDragLeave={() => setDraggedOver("")}
                            onDrop={handleDrop} onMouseEnter={() => setOnHover(type.name)} onMouseLeave={() => setOnHover("")} >
                            <div className="kanbanboard-child-heading" style={{ backgroundColor: "black", color: "white", borderLeft: type.name === "Overdue" ? "1px dotted black" : null }}>
                                {type?.name}({categorizeTasks[type.name]?.length || 0})
                            </div>
                            {!["Completed", "Overdue"].includes(type.name) &&
                                <div className="addTask-btn" onClick={() => setAddTaskFor(type.name)} style={{ background: onHover === type.name ? "#DDDDDD" : null, cursor: "pointer" }}><AddRoundedIcon /> {onHover === type.name ? "Quick Task" : ""}</div>
                            }
                            {
                                addTaskFor === type.name &&
                                <div className="timeLogBox" >
                                    <input className="mb-3" id="taskNameInput" value={taskObj?.title} placeholder="Name #tag" onChange={(e) => fillTaskObj(e.target.value, type)} />
                                    <p>Press <SubdirectoryArrowLeftRoundedIcon /> to create</p>
                                </div>
                            }
                            {
                                categorizeTasks[type.name].length &&
                                categorizeTasks[type.name]?.map((task) => {
                                    return contentTemplate(task, type.name)
                                })
                            }
                        </div>
                    })
                }
            </div>
    );
}

// <div style={{ padding: '40px' }}>
//     <div
//         draggable
//         onDragStart={handleDragStart}
//         style={{
//             width: '150px',
//             height: '150px',
//             backgroundColor: 'skyblue',
//             marginBottom: '20px',
//             textAlign: 'center',
//             lineHeight: '150px',
//             border: '2px solid black',
//             cursor: 'grab'
//         }}
//     >
//         Drag me
//     </div>

//     <div
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//         style={{
//             width: '300px',
//             height: '200px',
//             border: `4px dashed ${draggedOver ? 'green' : 'gray'}`,
//             backgroundColor: dropped ? '#d4edda' : '#f8f9fa',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//         }}
//     >
//         {dropped ? 'Dropped!' : 'Drop here'}
//     </div>
// </div>
// const handleDragStart = (e) => {
//     e.dataTransfer.setData('text/plain', 'This is the dragged div');
// };

// const handleDragOver = (e) => {
//     e.preventDefault(); // Required to allow drop
//     setDraggedOver(true);
// };

// const handleDragLeave = () => {
//     setDraggedOver(false);
// };

// const handleDrop = (e) => {
//     e.preventDefault();
//     setDropped(true);
//     setDraggedOver(false);
// };