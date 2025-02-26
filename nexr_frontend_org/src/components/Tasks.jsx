import React, { useContext, useEffect, useState } from "react"
import { Checkbox, Dropdown, Input, Popover, SelectPicker, Whisper } from "rsuite";
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CommonModel from "./Administration/CommonModel";
import axios from "axios";
import { EssentialValues } from "../App";
import "./projectndTask.css";
import { toast } from "react-toastify";
import Loading from "./Loader";
import NoDataFound from "./payslip/NoDataFound";
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { jwtDecode } from "jwt-decode";
import { TimerStates } from "./payslip/HRMDashboard";

const Tasks = ({ employees }) => {
  const url = process.env.REACT_APP_API_URL;
  const { data, whoIs } = useContext(EssentialValues);
  const { isAddTask, setIsAddTask, handleAddTask, selectedProject } = useContext(TimerStates);
  const { isTeamLead, isTeamHead } = jwtDecode(data.token)
  const [taskObj, setTaskObj] = useState({});
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [filterTasks, setFilterTasks] = useState([]);
  const [previewList, setPreviewList] = useState([]);
  // const [isAddTask, setIsAddTask] = useState(false);
  const [isEditTask, setIsEditTask] = useState(false);
  const [isviewTask, setIsViewtask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDelete, setIsDelete] = useState({ type: false, value: "" });

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
          {/* <Dropdown.Item eventKey={3}><b>Copy Today Activity</b></Dropdown.Item> */}
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

    setTaskObj((prev) => ({
      ...prev,
      [name]: name === "attachments"
        ? [...(prev[name] || []), ...value.target.files] // Spread the FileList into the array
        : value // Update other fields directly
    }));
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
      setTasks(res.data.tasks)
      setFilterTasks(res.data.tasks)
    } catch (error) {
      setTasks([])
      setFilterTasks([])
      console.log(error);
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (projectId) {
      fetchTaskByProjectId(projectId)
    }
  }, [projectId, isDelete.type, isAddTask, isEditTask])

  useEffect(() => {
    return () => setPreviewList([])
  }, [])

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
      setTaskObj(res.data);
      setPreviewList(res.data.attachments);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  }

  function filterByName(value) {
    if (["", null].includes(value)) {
      setTasks(filterTasks)
    } else {
      setTasks(filterTasks.filter((task) => task?.title?.includes(value)))
    }
  }

  async function editTask(updatedTask) {
    const taskToUpdate = updatedTask

    if (!taskToUpdate?._id) {
      console.error("No task ID found to update");
      toast.error("Invalid task. Please try again.");
      return;
    }

    try {
      const res = await axios.put(`${url}/api/task/${taskToUpdate._id}`, taskToUpdate, {
        headers: {
          Authorization: data.token || ""
        }
      });
      toast.success(res.data.message);
      setTaskObj({});
      setIsAddTask(false);
      setIsEditTask(false);
      fetchTaskByProjectId(projectId)
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error?.response?.data?.error || "An error occurred while updating the task.";
      toast.error(errorMessage);
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
    } else {
      console.log('No attachments to upload.');
    }
  }

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
                    onChange={(e) => setProjectId(e)}
                  />
                  <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu1}>
                    <div className="button">
                      Action <ArrowDropDownRoundedIcon />
                    </div>
                  </Whisper>
                </div>
              </div>
              <div className="projectBody">
                <div className="d-flex justify-content-end">
                  <div className="col-lg-3">
                    <div className="modelInput">
                      <Input size="lg" appearance="default" placeholder="Search" onChange={filterByName} />
                    </div>
                  </div>
                </div>
                {
                  isLoading ? <Loading /> :
                    tasks.length > 0 ?
                      tasks.map((task) => (
                        <div key={task._id} className="box-content d-flex align-items-center justify-content-between my-3">
                          <div className="d-flex align-items-center col-half">
                            <Checkbox onCheckboxClick={() => getValue(task)} /> <b>{task.title}</b> || <span className="defaultDesign">{task.status}</span> ||
                            <div className="d-flex align-items-center gap-1 mx-1">
                              {task.assignedTo.map((emp) => (
                                <div className="nameHolder" style={{ width: "30px", height: "30px" }} key={emp._id}>
                                  {emp.FirstName[0].toUpperCase() +
                                    emp.LastName[0].toUpperCase()}
                                </div>
                              ))}
                              <AddCircleOutlineRoundedIcon sx={{ cursor: "pointer" }} fontSize="large" color="disabled" onClick={() => {
                                fetchTaskById(task._id)
                                handleEditTask()
                              }} />
                            </div>
                          </div>
                          <div className="cal-half d-flex gap-2">
                            <ErrorOutlineRoundedIcon sx={{ cursor: "pointer" }} onClick={() => {
                              fetchTaskById(task._id)
                              handleViewTask()
                            }} />
                            <span className="defaultDesign text-light" style={{ background: `${task.project.color}` }}>{task.project.name}</span>
                            <CalendarMonthRoundedIcon sx={{ cursor: "pointer" }} />
                            <span style={{ cursor: "pointer" }}>
                              <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu2(task)}>
                                <MoreVertRoundedIcon sx={{ cursor: "pointer" }} />
                              </Whisper>
                            </span>
                            <span className="nameHolder" style={{ width: "25px", height: "25px" }}>
                              <KeyboardArrowRightRoundedIcon />
                            </span>
                          </div>
                        </div>

                      )) : <NoDataFound message={"Task Not Found"} />
                }
              </div >
            </>
  )
};

export default Tasks;
