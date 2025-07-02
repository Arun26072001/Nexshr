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
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal } from 'rsuite';
import Loading from '../Loader';
import { toast } from 'react-toastify';
import axios from 'axios';
import NoDataFound from '../payslip/NoDataFound';

export default function Planner({ isLoading, updateTaskStatus, fetchEmpAssignedTasks, deleteTask, updateTask, handleViewTask, handleEditTask, updatedTimerInTask, plannerTasks, setPlannerTasks }) {
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const { data } = useContext(EssentialValues);
    const [categories, setCategories] = useState([]);
    // for task 
    const [isHovering, setIsHovering] = useState("");
    // for list of task
    const [onHover, setOnHover] = useState("");
    const [isWorkingTasks, setIsWorkingTasks] = useState({});
    const [taskObj, setTaskObj] = useState({});
    const [addTaskFor, setAddTaskFor] = useState("");
    const [draggedOver, setDraggedOver] = useState("");
    const [isAddCategory, setIsAddCategory] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [isWorkingApi, setIsWorkingApi] = useState(false);

    const handleDragStart = (e, task, taskType) => {
        e.dataTransfer.setData('application/json', JSON.stringify([task, taskType]));
    };

    const handleDragOver = (e, category) => {
        e.preventDefault(); // Required to allow drop
        setDraggedOver(category);
    };

    function mergeToSpecifyArray(category, task, taskType) {
        if (category && taskType !== category) {
            let updatedTask = {
                ...task,
                category
            };
            const removeFromCategory = plannerTasks[taskType].filter((task) => task.category !== taskType)

            setPlannerTasks((pre) => ({
                ...pre,
                [taskType]: removeFromCategory,
                [category]: [...(pre[category] || []), task]
            }))
            updateTask(updatedTask)
        }
    }

    function handleAddCategory() {
        setIsAddCategory(!isAddCategory)
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
        localStorage.setItem(`isRunning_${task._id}`, true)
        setIsWorkingTasks((pre) => ({
            ...pre,
            [`isRunning_${task._id}`]: true
        }))
        updatedTimerInTask(task, "startTime")
    }

    function stopTime(task) {
        localStorage.setItem(`isRunning_${task._id}`, false)
        setIsWorkingTasks((pre) => ({
            ...pre,
            [`isRunning_${task._id}`]: false
        }))
        updatedTimerInTask(task, "stopTime")
    }

    function fillTaskObj(title, category) {
        setTaskObj((pre) => ({
            ...pre,
            title,
            "category": typeof category === "string" ? category : category._id
        }))
    }

    async function addCategory() {
        try {
            setIsWorkingApi(true);
            const res = await axios.post(`${url}/api/category/${data._id}`, { name: categoryName }, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            setCategoryName("");
            fetchCategories();
            setIsAddCategory(false);
        } catch (error) {
            console.log("error in add category", error);
            toast.error(error.response.data.error)
        } finally {
            setIsWorkingApi(false)
        }
    }

    function contentTemplate(task, category) {
        const creator = task.createdby ? task?.createdby?.FirstName + " " + task?.createdby?.LastName : data.Name

        return (
            <div className='p-2 my-1 timeLogBox' draggable key={task._id} onDragStart={(e) => handleDragStart(e, task, category)} style={{ borderLeft: "3px solid black" }} onMouseEnter={() => setIsHovering(task._id)} onMouseLeave={() => setIsHovering("")} >
                <div className="d-flex justify-content-between">
                    <span className="sub_text hoverStyle" style={{ fontWeight: 600 }} onClick={() => task.createdby._id === data._id ? handleEditTask(task._id) : handleViewTask(task._id)} >{task.title}</span>
                    <span className="" >{task._id === isHovering && task.createdby._id === data._id ? <DeleteRoundedIcon onClick={() => deleteTask(task)} /> : ""}</span>
                </div>
                <p className="sub_text dateContainer" >{task.status === "Completed" ? "Completed" : task.to ? dateFormat(task.to) : "No DeadLine"}</p>
                <div className="d-flex justify-content-between">
                    <div>
                        <AccountCircleRoundedIcon color="disabled" sx={{ cursor: "pointer" }} titleAccess={data.Name + " " + "(assignee)"} />
                        <ChevronRightRoundedIcon sx={{ cursor: "pointer" }} />
                        <AccountCircleRoundedIcon color="disabled" titleAccess={creator + " " + "(creator)"} sx={{ cursor: "pointer" }} />
                    </div>
                    {
                        task._id === isHovering &&
                        <div >
                            {
                                isWorkingTasks[`isRunning_${task._id}`] === task._id ? <PauseCircleFilledRoundedIcon sx={{ cursor: "pointer", color: "red" }} titleAccess="Pause Task" onClick={() => stopTime(task)} /> :
                                    <PlayCircleFilledRoundedIcon color="success" sx={{ cursor: "pointer", color: "green" }} titleAccess="Start Task" onClick={() => startTime(task)} />
                            }
                            <CheckCircleRoundedIcon sx={{ cursor: "pointer" }} color="action" onClick={() => updateTaskStatus(task)} />
                        </div>
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
            const res = await axios.get(`${url}/api/planner/${data._id}`, {
                headers: {
                    Authorization: data.token
                }
            })
            setCategories(res.data.categories);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch categories", error);
        }
    }

    function fetchRunningTimersData() {
        categories.map((category) => {
            const categoryTasks = plannerTasks[category] || [];
            if (categoryTasks.length > 0) {
                categoryTasks.map((task) => {
                    if (localStorage.getItem(`isRunning_${task._id}`) === "true") {
                        setIsWorkingTasks((pre) => ({
                            ...pre,
                            [`isRunning_${task._id}`]: true
                        }))
                    }
                })
            }
        })
    }

    useEffect(() => {
        fetchCategories();
    }, [])

    useEffect(() => {
        fetchRunningTimersData();
    }, [categories])

    if (isAddCategory) {
        return <Modal open={isAddCategory} size="sm" backdrop="static" onClose={handleAddCategory} >
            <Modal.Header>
                <Modal.Title>
                    Add Category
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="col-full">
                    <div className="modelInput">
                        <p className='modelLabel important'>Category Name: </p>
                        <Input
                            size="lg"
                            width={"100%"}
                            value={categoryName}
                            onChange={setCategoryName}
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={handleAddCategory} appearance="default">Back</Button>
                <Button onClick={addCategory} appearance="primary"> {isWorkingApi ? <Loading color="white" size={20} /> : "Add Category"}</Button>
            </Modal.Footer>
        </Modal>
    }

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
            plannerTasks && Object.keys(plannerTasks).length > 0 ? (
                <div className="kanbanboard-parent">
                    {categories?.map((category, index) => (
                        <div
                            key={index}
                            className="kanbanboard-child col-lg-3 col-12 col-md-3"
                            style={{
                                position: "relative",
                                opacity: draggedOver === category?._id ? 0.6 : 1,
                            }}
                            onDragOver={(e) => handleDragOver(e, category?._id)}
                            onDragLeave={() => setDraggedOver("")}
                            onDrop={handleDrop}
                            onMouseEnter={() => setOnHover(category?._id)}
                            onMouseLeave={() => setOnHover("")}
                        >
                            {/* Header */}
                            <div className="kanbanboard-child-header">
                                <div
                                    className="kanbanboard-child-heading"
                                    style={{ backgroundColor: "black", color: "white" }}
                                >
                                    {category?.name} ({plannerTasks[category?._id]?.length || 0}){" "}
                                    {onHover === category._id && (
                                        <AddCircleRoundedIcon
                                            onClick={handleAddCategory}
                                            className="heading_icon"
                                            sx={{ color: "white" }}
                                            fontSize="small"
                                        />
                                    )}
                                </div>

                                {!["Completed", "Overdue"].includes(category?._id) && (
                                    <div
                                        className="addTask-btn"
                                        onClick={() => setAddTaskFor(category?._id)}
                                        style={{
                                            background: onHover === category?._id ? "#DDDDDD" : undefined,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <AddRoundedIcon /> {onHover === category?._id ? "Quick Task" : ""}
                                    </div>
                                )}
                            </div>

                            {/* Quick Add Input */}
                            {addTaskFor === category?._id && (
                                <div className="timeLogBox">
                                    <input
                                        className="mb-3"
                                        id="taskNameInput"
                                        value={taskObj?.title}
                                        placeholder="Name #tag"
                                        onChange={(e) => fillTaskObj(e.target.value, category)}
                                    />
                                    <p>
                                        Press <SubdirectoryArrowLeftRoundedIcon /> to create
                                    </p>
                                </div>
                            )}

                            {/* Task List */}
                            {plannerTasks[category?._id]?.length > 0 &&
                                plannerTasks[category?._id].map((task) =>
                                    contentTemplate(task, category?._id)
                                )}
                        </div>
                    ))}
                </div>
            ) : (
                <NoDataFound message="Tasks not found" />
            )
    );
}
