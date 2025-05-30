import { KanbanComponent, ColumnsDirective, ColumnDirective } from "@syncfusion/ej2-react-kanban";
import "./kanbanboardTemplate.css";
import { extend } from '@syncfusion/ej2-base';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PauseCircleFilledRoundedIcon from '@mui/icons-material/PauseCircleFilledRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { useContext, useState } from "react";
import { EssentialValues } from "../../App";
import { Skeleton } from "@mui/material";

export default function DeadlineTask({ tasks, isLoading, updateTaskStatus, updatedTimerInTask }) {
    const [isHovering, setIsHovering] = useState("");
    const [isWorkingTask, setIsWorkingTask] = useState("");
    const { data } = useContext(EssentialValues);
    let items = extend([], tasks, null, true);

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

    function contentTemplate(task) {
        return (
            <div className='content-template' onMouseEnter={() => setIsHovering(task._id)} onMouseLeave={() => setIsHovering("")} >
                <div className="sub_text" style={{ fontWeight: 600 }}>{task.title}</div>
                <p className="sub_text dateContainer" >{task.status !== "Completed" ? dateFormat(task.to) : "Completed"}</p>
                <div className="d-flex justify-content-between">
                    <div>
                        <AccountCircleRoundedIcon color="disabled" sx={{ cursor: "pointer" }} titleAccess={data.Name+" "+"(assignee)"} />
                        <ChevronRightRoundedIcon sx={{ cursor: "pointer" }} />
                        <AccountCircleRoundedIcon color="disabled" titleAccess={task.createdby.FirstName + " " + task.createdby.LastName+" "+"(creator)"} sx={{ cursor: "pointer" }} />
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
    function handleKanbanAction(args) {
        console.log("args", args);
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
            <div className="App">
                <KanbanComponent
                    height={"400px"}
                    id="kanban"
                    keyField="status"
                    dataSource={items}
                    cardSettings={{ headerField: "title", template: contentTemplate }}
                    enableTooltip={true}
                    actionComplete={handleKanbanAction}
                >
                    <ColumnsDirective>
                        <ColumnDirective headerText="Pending" keyField="Pending" allowToggle={true} showAddButton={true}  />
                        <ColumnDirective headerText="In Progress" keyField="In Progress" allowToggle={true} showAddButton={true}  />
                        <ColumnDirective headerText="On Hold" keyField="On Hold" allowToggle={true} showAddButton={true}  />
                        <ColumnDirective headerText="Completed" keyField="Completed" allowToggle={true} showAddButton={true}  />
                    </ColumnsDirective>
                </KanbanComponent>
            </div>
    );
}
