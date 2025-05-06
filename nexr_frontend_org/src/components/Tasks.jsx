import React, { useContext, useEffect, useState } from "react"
import { Dropdown, Input, Popover, SelectPicker, Whisper } from "rsuite";
import { fileUploadInServer, formatTimeFromHour, getTimeFromHour } from "./ReuseableAPI";
import { useNavigate } from "react-router-dom";
import CommonModel from "./Administration/CommonModel";
import axios from "axios";
import { EssentialValues } from "../App";
import "./projectndTask.css";
import { toast } from "react-toastify";
import NoDataFound from "./payslip/NoDataFound";
import { jwtDecode } from "jwt-decode";
import { TimerStates } from "./payslip/HRMDashboard";
import "./org_list.css";
import TaskItem from "./TaskItem";

// Icons
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { Skeleton } from "@mui/material";

const Tasks = () => {
  const navigate = useNavigate();
  const url = process.env.REACT_APP_API_URL;
  const [employees, setEmployees] = useState([]);
  const { data, whoIs, socket } = useContext(EssentialValues);
  const { isAddTask, setIsAddTask, handleAddTask, selectedProject } = useContext(TimerStates);
  const { isTeamLead, isTeamHead } = jwtDecode(data.token)
  const [taskObj, setTaskObj] = useState({});
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(localStorage.getItem("selectedProject") || "");
  const [allTasks, setAllTask] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [progressTasks, setProgressTasks] = useState([]);
  const [completedTasks, setCompletedTask] = useState([]);
  const [pendingFilterTasks, setPendingFilterTasks] = useState([]);
  const [completedFilterTasks, setCompletedFilterTasks] = useState([]);
  const [processFilterTasks, setProgressFilterTasks] = useState([]);
  const [previewList, setPreviewList] = useState([]);
  const [isEditTask, setIsEditTask] = useState(false);
  const [isviewTask, setIsViewtask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdateTime, setIsUpdateTime] = useState(false);
  const [isDelete, setIsDelete] = useState({ type: false, value: "" });
  const [status, setStatus] = useState("Pending");
  const [isAddComment, setIsAddComment] = useState(false);
  const [isTaskChanging, setIsTaskChanging] = useState(false);

  const renderMenu1 = ({ onClose, right, top, className }, ref) => {
    const handleSelect = eventKey => {
      if (eventKey === 1) {
        triggerHandleAddTask();
      } else if (eventKey === 2) {
        // handleLogout();
      }
      onClose();
    };
    return (
      <Popover ref={ref} className={className} style={{ right, top }} full>
        <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
          <Dropdown.Item eventKey={1}><b><AddRoundedIcon />  New Task</b></Dropdown.Item>
          <Dropdown.Item eventKey={2}><b><WatchLaterOutlinedIcon /> New Time Entry</b></Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  };

  async function fetchProjectEmps() {
    try {
      const res = await axios.get(`${url}/api/project/employees/${taskObj?.project}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      setEmployees(res.data.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
    } catch (error) {
      console.log("error in fetch employess", error);
    }
  }

  // fetch prject of employees
  useEffect(() => {
    if (taskObj?.project) {
      fetchProjectEmps()
    }
  }, [taskObj?.project])

  const renderMenu2 = (task) => ({ onClose, right, top, className }, ref) => {
    const handleSelect = eventKey => {
      if (eventKey === 1) {
        if (task._id) {
          fetchTaskById(task._id)
        }
        triggerHandleAddTask();
      } else if (eventKey === 2) {
        handleDelete(task);
      }
      onClose();
    };
    return (
      <Popover ref={ref} className={className} style={{ right, top }} full>
        <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
          <Dropdown.Item eventKey={1}>
            <b>
              <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
            </b>
          </Dropdown.Item>
          <Dropdown.Item eventKey={2}>
            <b>
              <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
            </b>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  };

  const renderMenu3 = (task) => ({ onClose, right, top, className }, ref) => {
    const handleSelect = eventKey => {
      if (eventKey === 1) {
        navigate(`/${whoIs}/tasks/comments/${task._id}`)
      } else if (eventKey === 2) {
        navigate(`/${whoIs}/tasks/time-log/${task._id}`)
      }
      onClose();
    };
    return (
      <Popover ref={ref} className={className} style={{ right, top }} full>
        <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
          <Dropdown.Item eventKey={1}><b><WatchLaterOutlinedIcon /> Comments</b></Dropdown.Item>
          <Dropdown.Item eventKey={2}><b><AddRoundedIcon />  Time Logs</b></Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  };

  function changeTask(event, name) {

    const files = event?.target?.files; // Extract files correctly
    const value = event; // Extract value properly

    if (name === "attachments" || name.includes("attachments")) {
      const imgUrls = [];

      for (let index = 0; index < files.length; index++) {
        imgUrls.push(URL.createObjectURL(files[index]));
      }

      // Update state once with all images
      setPreviewList((prev = []) => [...prev, ...imgUrls]);
    }

    setTaskObj((prev) => {
      if (name.startsWith("spend.")) {
        const spendChild = name.split(".")[1];

        return {
          ...prev,
          spend: {
            ...prev.spend,
            [spendChild]: files || value, // Store correctly
          },
        };
      } else if (name.startsWith("comments.")) {
        const commentChild = name.split(".")[1];

        return {
          ...prev,
          comments: prev.comments.length > 0
            ? [
              ...prev.comments.slice(0, -1), // Keep all except the last one
              {
                ...prev.comments[prev.comments.length - 1], // Modify last comment
                [commentChild]: name.includes("attachments")
                  ? [...(prev?.comments?.[prev.comments.length - 1]?.[commentChild] || []), ...files]
                  : value,
              },
            ]
            : [{ [commentChild]: name.includes("attachments") ? [...files] : value }],
        };
      } else {
        return {
          ...prev,
          [name]: name === "attachments"
            ? [...(prev[name] || []), ...files] // Spread FileList properly
            : value, // Update other fields directly
        };
      }
    });
  }

  function handleEditTask() {
    if (isEditTask) {
      setTaskObj({});
    }
    setIsEditTask(!isEditTask);
  }

  function triggerHandleAddTask() {
    if (isAddTask) {
      setTaskObj({});
      setPreviewList([]);
    }
    handleAddTask()
  }
  function removeAttachment(value, fileIndex) {

    const updatedPrevireList = previewList.filter((imgFile) => imgFile !== value);
    setPreviewList(updatedPrevireList);
    const updatedAttachments = taskObj.attachments.filter((file, index) => index !== fileIndex);
    setTaskObj({ ...taskObj, attachments: updatedAttachments })
  }

  async function fetchTaskByProjectId(id) {
    setIsLoading(true);
    try {
      const res = await axios.get(`${url}/api/task/project/${id}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      setAllTask(res.data.tasks);
      console.log(res.data.tasks);
      // getSelectStatusTasks();
    } catch (error) {
      setAllTask([])
      console.log(error);
    }
    setIsLoading(false)
  }

  function handleViewTask() {
    if (isviewTask) {
      setTaskObj({})
    }
    setIsViewtask(!isviewTask)
  }

  function handleAddComment(id) {
    if (!isAddComment) {
      fetchTaskById(id, "Add Comments")
    } else if (isAddComment) {
      setTaskObj({});
      setPreviewList([]);
    }
    setIsAddComment(!isAddComment);
  }

  async function fetchTaskById(id, storeCommentImgs) {
    try {
      const res = await axios.get(`${url}/api/task/${id}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      setTaskObj({
        ...res.data,
        spend: {
          ...res?.data?.spend,
          timeHolder: getTimeFromHour(res?.data?.spend?.timeHolder || 0)
        }
      });
      if (storeCommentImgs) {
        setPreviewList(res.data?.comments[0]?.attachments);
      } else {
        setPreviewList(res.data.attachments);
      }
      return res.data;
    } catch (error) {
      console.log(error);
    }
  }

  function filterByName(value) {
    if (["", null].includes(value)) {
      if (status === "Pending") return setPendingTasks(pendingFilterTasks);
      else if (status === "Completed") return setCompletedTask(completedFilterTasks);
      else setProgressTasks(processFilterTasks)
    } else {
      if (status === "Pending") {
        setPendingTasks(pendingFilterTasks.filter((task) => task?.title?.includes(value)))
      } else if (status === "Completed") {
        setCompletedTask(completedFilterTasks.filter((task) => task?.title?.includes(value)))
      } else {
        setProgressTasks(processFilterTasks.filter((task) => task?.title?.includes(value)))
      }
    }
  }

  function getSelectStatusTasks() {
    const statusTypes = ["Pending", "Completed", "In Progress"];
    statusTypes.map((type) => {
      const filterValue = allTasks.filter((task) => task?.status === type);
      if (type === "Pending") {
        setPendingTasks(filterValue);
        setPendingFilterTasks(filterValue);
      } else if (type === "Completed") {
        setCompletedTask(filterValue);
        setCompletedFilterTasks(filterValue);
      } else {
        setProgressTasks(filterValue);
        setProgressFilterTasks(filterValue);
      }
    })
  }

  useEffect(() => {
    getSelectStatusTasks()
  }, [status, allTasks]);

  async function editTask(updatedTask, changeComments) {
    if (!updatedTask?._id) {
      toast.error("Invalid task. Please try again.");
      return;
    }

    let taskToUpdate = { ...updatedTask };

    // Ensure `spend.timeHolder` is correctly formatted
    if (
      typeof updatedTask?.spend?.timeHolder === "string" &&
      updatedTask.spend.timeHolder.split(":").length <= 2
    ) {
      taskToUpdate.spend = {
        ...updatedTask.spend,
        timeHolder: formatTimeFromHour(updatedTask.spend.timeHolder) || "00:00:00",
      };
    }

    setIsUpdateTime(true);

    let files = [];

    try {
      // Ensure attachments exist before filtering
      if (taskToUpdate?.comments?.[0]?.attachments?.length) {
        files = taskToUpdate.comments[0].attachments.filter((file) => file.type === "image/png");
      } else {
        files = taskToUpdate?.attachments?.filter((file) => file.type === "image/png") || [];
      }

      let updatedTaskData = { ...taskToUpdate };

      if (files.length > 0) {
        // Upload files if any exist
        const responseData = await fileUploadInServer(files);

        if (taskToUpdate?.comments?.[0]?.attachments?.length > 0) {
          updatedTaskData = {
            ...taskToUpdate,
            comments: [
              {
                ...taskToUpdate.comments[0],
                attachments: responseData.files.map((file) => file.originalFile),
              },
            ],
          };
        } else {
          const uploadedImgPath = taskToUpdate.attachments?.filter((file) => file.type !== "image/png" && file.type !== "video/mp4") || [];

          updatedTaskData = {
            ...taskToUpdate,
            attachments: [...uploadedImgPath, ...responseData.files.map((file) => file.originalFile)],
          };
        }
      }
      // set loader true task is updating
      setIsTaskChanging(true);
      // Send updated task
      const res = await axios.put(
        `${url}/api/task/${data._id}/${taskToUpdate._id}`, // Ensure correct projectId
        updatedTaskData,
        {
          params: { changeComments },
          headers: { Authorization: data?.token || "" },
        }
      );

      toast.success(res.data.message);
      setTaskObj({});
      setIsAddTask(false);
      setIsEditTask(false);
      fetchTaskByProjectId(projectId); // Refresh tasks
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error?.response?.data?.error || "An error occurred while updating the task.";
      toast.error(errorMessage);
    } finally {
      setIsUpdateTime(false);
      setIsAddComment(false);
      setIsTaskChanging(false);
    }
  }

  // handling to delete task
  function handleDeleteTask() {
    setIsDelete((pre) => ({
      ...pre,
      type: !pre.type
    }));
  }

  function handleDelete(data) {
    setIsDelete((pre) => ({
      ...pre,
      value: data._id
    }))
    handleDeleteTask()
  }

  async function deleteTask() {
    try {
      const res = await axios.delete(`${url}/api/task/${isDelete.value}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      toast.success(res.data.message);
      handleDeleteTask();
      fetchTaskByProjectId(projectId);
    } catch (error) {
      toast.error(error.response.data.error)
    }
  }

  async function addTask() {
    let newTask;
    setIsTaskChanging(true);

    if (taskObj?.attachments?.length > 0) {
      try {
        const files = taskObj.attachments;
        const responseData = await fileUploadInServer(files)

        newTask = {
          ...taskObj,
          estTime: (new Date(taskObj.to) - new Date(taskObj.from)) / (1000 * 60 * 60),
          attachments: responseData.files.map(file => file.originalFile)
        };

        // After successful upload, create the task
        await createTask(newTask);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("File upload failed");
      } finally {
        setIsLoading(false);
      }
    } else {
      newTask = {
        ...taskObj,
        estTime: (new Date(taskObj.to) - new Date(taskObj.from)) / (1000 * 60 * 60)
      };

      await createTask(newTask);
    }

    setIsTaskChanging(false);
  }

  // Separate function to create the task
  async function createTask(task) {
    try {
      let newTaskObj = {
        ...task,
        assignedTo: Array.isArray(task?.assignedTo) && task.assignedTo.includes(data._id)
          ? task.assignedTo
          : [...(task?.assignedTo || []), data._id]
      }
      const res = await axios.post(`${url}/api/task/${data._id}`, newTaskObj, {
        headers: { Authorization: data.token || "" }
      });

      toast.success(res.data.message);
      socket.emit("send_notification_for_task", newTaskObj)
      setTaskObj({});
      triggerHandleAddTask();
    } catch (error) {
      console.error("Task creation error:", error);
      toast.error(error.response?.data?.error || "Task creation failed");
    }
  }


  async function fetchEmpsProjects() {
    setIsLoading(true)
    try {
      const res = await axios.get(`${url}/api/project/emp/${data._id}`, {
        headers: {
          Authorization: data.token || ""
        }
      })

      setProjects(res.data.map((project) => ({ label: project.name, value: project._id })));
    } catch (error) {
      toast.error(error.response.data.error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (projectId) {
      fetchTaskByProjectId(projectId)
    } else {
      setAllTask([]);
    }
  }, [projectId, isDelete.type, isAddTask, isEditTask])

  useEffect(() => {
    return () => setPreviewList([])
  }, [])

  useEffect(() => {
    function changeUIForSelectedProject() {
      setProjectId(selectedProject);
      setTaskObj((pre) => ({
        ...pre,
        ["project"]: selectedProject
      }))
    }

    if (selectedProject) {
      changeUIForSelectedProject()
    }
  }, [selectedProject])

  useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true)
      try {
        const res = await axios.get(`${url}/api/project`, {
          headers: {
            Authorization: data.token || ""
          }
        })

        setProjects(res.data.map((project) => ({ label: project.name, value: project._id })));
      } catch (error) {
        toast.error(error.response.data.error)
      }
      setIsLoading(false)
    }
    if (whoIs === "admin" || isTeamLead || isTeamHead) {
      fetchProjects();
    } else {
      fetchEmpsProjects()
    }
  }, [])

  async function getValue(task) {
    const taskData = await fetchTaskById(task._id);
    const updatedTask = {
      ...taskData,
      "status": task.status === "Completed" ? "Pending" : "Completed"
    }
    editTask(updatedTask)
  }

  async function updatedTimerInTask(id, timerType, timeHolderData) {
    const taskData = await fetchTaskById(id);
    let updatedTask;
    const currentTime = new Date().toTimeString().split(' ')[0];
    if (timerType === "startTime") {
      updatedTask = {
        ...taskData,
        spend: {
          ...taskData?.spend,
          startingTime: [...(taskData?.spend?.startingTime || []), currentTime]
        }
      }
    } else {
      updatedTask = {
        ...taskData,
        spend: {
          ...taskData?.spend,
          endingTime: [...(taskData?.spend?.endingTime || []), currentTime],
          timeHolder: timeHolderData
        }
      }
    }
    editTask(updatedTask)
  }

  return (

    isviewTask ? <CommonModel type="Task View" isAddData={isviewTask} modifyData={handleViewTask} dataObj={taskObj} projects={projects} removeAttachment={removeAttachment} employees={employees} /> :
      isDelete.type ? <CommonModel type="Task Confirmation" modifyData={handleDeleteTask} deleteData={deleteTask} isAddData={isDelete.type} /> :
        isEditTask ? <CommonModel type="Task Assign" isAddData={isEditTask} employees={employees} changeData={changeTask} dataObj={taskObj} editData={editTask} isWorkingApi={isTaskChanging} modifyData={handleEditTask} /> :
          isAddTask ? <CommonModel
            isWorkingApi={isTaskChanging}
            dataObj={taskObj}
            previewList={previewList}
            isAddData={isAddTask}
            editData={editTask}
            changeData={changeTask}
            projects={projects}
            addData={addTask}
            removeAttachment={removeAttachment}
            employees={employees}
            type="Task"
            modifyData={triggerHandleAddTask} /> :
            isAddComment && taskObj?._id ? (
              <CommonModel
                type="Add Comments"
                removeAttachment={removeAttachment}
                isAddData={isAddComment}
                modifyData={handleAddComment}
                changeData={changeTask}
                editData={editTask}
                dataObj={taskObj}
                previewList={previewList}
              />
            ) :
              <>
                <div className="projectParent flex-wrap">
                  <div className="col-lg-6 col-md-4 col-12 projectTitle">Tasks</div>
                  <div className="col-lg-6 col-md-8 col-12 text-center flex-wrap">
                    <SelectPicker
                      data={projects}
                      size="lg"
                      appearance="default"
                      style={{ width: 300 }}
                      placeholder="Search By Project"
                      value={projectId}
                      onChange={(e) => {
                        setProjectId(e)
                        localStorage.setItem("selectedProject", e)
                      }}
                    />
                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu1}>
                      <div className="button">
                        Action <ArrowDropDownRoundedIcon />
                      </div>
                    </Whisper>
                  </div>
                </div>
                <div className="projectBody">
                  <div className="card-parent">
                    {
                      isLoading ? [...Array(3)].map((item, index) => (<Skeleton variant="rounded" width={300} height={80} key={index} />))
                        : [{ name: "Pending", color: "white", icon: PauseCircleOutlineRoundedIcon, taskData: pendingTasks }, { name: "In Progress", icon: HourglassTopRoundedIcon, color: "white", taskData: progressTasks }, { name: "Completed", color: "white", icon: CheckCircleOutlineRoundedIcon, taskData: completedTasks }].map((item) => {
                          return <div key={item} className={`box-content messageCount cardContent ${status === item.name && "activeCard"}`} style={{ background: item.color, boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }} onClick={() => setStatus(item.name)}>
                            {<item.icon sx={{ fontSize: "50px" }} />}
                            <p className="m-0">
                              <b>
                                {item.name} Task
                              </b>
                            </p>
                            <p className="org_name" style={{ margin: "0px" }}>
                              {item?.taskData?.length || 0}
                            </p>
                          </div>
                        })
                    }
                  </div>
                  <div className="d-flex justify-content-end">
                    <div className="col-lg-3">
                      <div className="modelInput">
                        <Input size="lg" appearance="default" placeholder="Search" onChange={filterByName} />
                      </div>
                    </div>
                  </div>
                  {
                    isLoading ? (
                      [...Array(2)].map((item, index) => (<Skeleton variant="rounded" width={"100%"} height={80} key={index} className="my-3" />))
                    ) : status === "Pending" ? (
                      Array.isArray(pendingTasks) && pendingTasks?.length > 0 ? (
                        pendingTasks.map((task) => <TaskItem key={task._id} task={task} renderMenu3={renderMenu3} handleAddComment={handleAddComment} status={status} isLoading={isUpdateTime} getValue={getValue} handleEditTask={handleEditTask} fetchTaskById={fetchTaskById} updatedTimerInTask={updatedTimerInTask} renderMenu2={renderMenu2} handleViewTask={handleViewTask} whoIs={whoIs} updateTask={updatedTimerInTask} />)
                      ) : (
                        <NoDataFound message="Task Not Found" />
                      )
                    ) : status === "Completed" ? (
                      Array.isArray(completedTasks) && completedTasks?.length > 0 ? (
                        completedTasks.map((task) => <TaskItem key={task._id} task={task} status={status} renderMenu3={renderMenu3} getValue={getValue} handleAddComment={handleAddComment} handleEditTask={handleEditTask} fetchTaskById={fetchTaskById} updatedTimerInTask={updatedTimerInTask} renderMenu2={renderMenu2} handleViewTask={handleViewTask} whoIs={whoIs} updateTask={updatedTimerInTask} />)
                      ) : (
                        <NoDataFound message="Task Not Found" />
                      )
                    ) : progressTasks.length > 0 ? (
                      progressTasks.map((task) => <TaskItem key={task._id} task={task} handleAddComment={handleAddComment} renderMenu3={renderMenu3} status={status} isLoading={isUpdateTime} getValue={getValue} handleEditTask={handleEditTask} fetchTaskById={fetchTaskById} updatedTimerInTask={updatedTimerInTask} renderMenu2={renderMenu2} handleViewTask={handleViewTask} whoIs={whoIs} updateTask={updatedTimerInTask} />)
                    ) : (
                      <NoDataFound message="Task Not Found" />
                    )
                  }

                </div >
              </>
  )
};

export default Tasks;
