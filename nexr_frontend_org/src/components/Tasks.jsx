import React, { useContext, useEffect, useState } from "react"
import { Dropdown, Input, Popover, SelectPicker, Whisper } from "rsuite";
import CommonModel from "./Administration/CommonModel";
import axios from "axios";
import { EssentialValues } from "../App";
import "./projectndTask.css";
import { toast } from "react-toastify";
import Loading from "./Loader";
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

const Tasks = ({ employees }) => {
  const url = process.env.REACT_APP_API_URL;
  const { data, whoIs } = useContext(EssentialValues);
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
  const [isDelete, setIsDelete] = useState({ type: false, value: "" });
  const [status, setStatus] = useState("Pending");

  function getTimeToHour(timeStr) {
    if (timeStr) {
      const [hours, minutes, seconds] = timeStr.split(":").map(Number);
      return (((hours * 60) + minutes + (seconds / 60)) / 60)?.toFixed(2);
    } else {
      return 0;
    }
  }

  function formatTimeFromHour(hour) {
    const hours = Math.floor(hour);
    const minutes = Math.floor(hour % 60);
    const seconds = Math.floor((hour * 60) % 60); // Convert remaining fraction to seconds

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }


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
  function changeTask(value, name) {

    if (name === "attachments") {
      const files = value.target.files;
      for (let index = 0; index < files.length; index++) {
        const imgFile = URL.createObjectURL(files[index])
        setPreviewList((pre) => ([
          ...pre,
          imgFile
        ]))
      }
    }

    setTaskObj((prev) => {
      if (name.includes("spend")) {
        const spendChild = name.split(".")[1];
        return ({
          ...prev,
          spend: {
            ...prev.spend,
            [spendChild]: value
          }
        })
      } else {
        return ({
          ...prev,
          [name]: name === "attachments"
            ? [...(prev[name] || []), ...value.target.files] // Spread the FileList into the array
            : value // Update other fields directly
        })
      }
    }
    )
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

  function removeAttachment(value) {
    const updatedPrevireList = previewList.filter((imgFile) => imgFile !== value);
    setPreviewList(updatedPrevireList);
    const updatedAttachments = taskObj.attachments.filter((data) => data !== value);
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

  async function fetchTaskById(id) {
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
          timeHolder: getTimeToHour(res?.data?.spend?.timeHolder || 0)
        }
      });
      setPreviewList(res.data.attachments);
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

  async function editTask(updatedTask) {
    let taskToUpdate;
    if (updatedTask.spend.timeHolder.split(":").length > 2) {
      taskToUpdate = updatedTask
    } else {
      taskToUpdate = {
        ...updatedTask,
        spend: {
          ...updatedTask.spend,
          timeHolder: formatTimeFromHour(updatedTask.spend.timeHolder)
        }
      }
    }

    if (!taskToUpdate?._id) {
      toast.error("Invalid task. Please try again.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.put(`${url}/api/task/${data._id}/${taskToUpdate._id}`, taskToUpdate, {
        headers: {
          Authorization: data.token || ""
        }
      });
      toast.success(res.data.message);
      setTaskObj({});
      setIsAddTask(false);
      setIsEditTask(false);
      fetchTaskByProjectId(projectId);
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error?.response?.data?.error || "An error occurred while updating the task.";
      toast.error(errorMessage);
    }
    setIsLoading(false);
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
    if (taskObj?.attachments?.length > 0) {
      const files = taskObj.attachments;
      const formData = new FormData(); // Ensure FormData is created

      // Append each file to the FormData
      for (let index = 0; index < files.length; index++) {
        formData.append("documents", files[index]); // Ensure correct field name for your backend
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${url}/api/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json', // Accept JSON response
          },
        });

        // Check if the response is successful
        if (!response.ok) {
          console.error('Upload failed with status:', response.status);
          return;
        }

        const responseData = await response.json();
        const newTask = {
          ...taskObj,
          ["attachments"]: responseData.files.map(((file) => file.originalFile))
        }
        try {
          const res = await axios.post(`${url}/api/task/${data._id}`, newTask, {
            headers: {
              Authorization: data.token || ""
            }
          })
          toast.success(res.data.message);
          setTaskObj({});
          triggerHandleAddTask();

        } catch (error) {
          toast.error(error.response.data.error)
        }

      } catch (error) {
        console.error('An error occurred during the upload:', error);
      }
      setIsLoading(false);
    } else {
      console.log('No attachments to upload.');
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
        // setFilterProjects(res.data.map((project) => ({ label: project.name, value: project._id })))
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
      "status": "Completed"
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
        isEditTask ? <CommonModel type="Task Assign" isAddData={isEditTask} employees={employees} changeData={changeTask} dataObj={taskObj} editData={editTask} modifyData={handleEditTask} /> :
          isAddTask ? <CommonModel
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
            <>
              <div className="projectParent">
                <div className="col-lg-6 projectTitle">Tasks</div>
                <div className="col-lg-6 projectChild">
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
                    [{ name: "Pending", color: "white", icon: PauseCircleOutlineRoundedIcon, taskData: pendingTasks }, { name: "In Progress", icon: HourglassTopRoundedIcon, color: "white", taskData: progressTasks }, { name: "Completed", color: "white", icon: CheckCircleOutlineRoundedIcon, taskData: completedTasks }].map((item) => {
                      return <div className={`box-content messageCount cardContent ${status === item.name && "activeCard"}`} style={{ background: item.color }} onClick={() => setStatus(item.name)}>
                        {<item.icon sx={{ fontSize: "65px" }} />}
                        <div className="d-block text-center">
                          <p className="org_name">
                            {item?.taskData?.length || 0}
                          </p>
                          <p className="m-0">
                            <b>
                              {item.name} Task
                            </b>
                          </p>
                        </div>
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
                    <Loading />
                  ) : status === "Pending" ? (
                    Array.isArray(pendingTasks) && pendingTasks?.length > 0 ? (
                      pendingTasks.map((task) => <TaskItem key={task._id} task={task} status={status} getValue={getValue} handleEditTask={handleEditTask} fetchTaskById={fetchTaskById} updatedTimerInTask={updatedTimerInTask} renderMenu2={renderMenu2} handleViewTask={handleViewTask} whoIs={whoIs} updateTask={updatedTimerInTask} />)
                    ) : (
                      <NoDataFound message="Task Not Found" />
                    )
                  ) : status === "Completed" ? (
                    Array.isArray(completedTasks) && completedTasks?.length > 0 ? (
                      completedTasks.map((task) => <TaskItem key={task._id} task={task} status={status} getValue={getValue} handleEditTask={handleEditTask} fetchTaskById={fetchTaskById} updatedTimerInTask={updatedTimerInTask} renderMenu2={renderMenu2} handleViewTask={handleViewTask} whoIs={whoIs} updateTask={updatedTimerInTask} />)
                    ) : (
                      <NoDataFound message="Task Not Found" />
                    )
                  ) : progressTasks.length > 0 ? (
                    progressTasks.map((task) => <TaskItem key={task._id} task={task} status={status} getValue={getValue} handleEditTask={handleEditTask} fetchTaskById={fetchTaskById} updatedTimerInTask={updatedTimerInTask} renderMenu2={renderMenu2} handleViewTask={handleViewTask} whoIs={whoIs} updateTask={updatedTimerInTask} />)
                  ) : (
                    <NoDataFound message="Task Not Found" />
                  )
                }

              </div >
            </>
  )
};

export default Tasks;
