import React, { useContext, useEffect, useState } from "react"
import { Checkbox, Dropdown, Input, Popover, SelectPicker, Whisper } from "rsuite";
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CommonModel from "./Administration/CommonModel";
import axios from "axios";
import { EssentialValues } from "../App";
import { toast } from "react-toastify";
import { fetchEmployees } from "./ReuseableAPI";
import Loading from "./Loader";
import NoDataFound from "./payslip/NoDataFound";
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';

const Tasks = () => {
  const { data } = useContext(EssentialValues);
  const [taskObj, setTaskObj] = useState({});
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filterTasks, setFilterTasks] = useState([]);
  const [isAddTask, setIsAddTask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const url = process.env.REACT_APP_API_URL;


  const renderMenu = ({ onClose, right, top, className }, ref) => {
    const handleSelect = eventKey => {
      if (eventKey === 1) {
        handleAddTask();
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
  function changeTask(value, name) {
    setTaskObj((prev) => ({
      ...prev,
      [name]: name === "attachments"
        ? [...(prev[name] || []), value] // Ensure 'attachments' exists, append value
        : value // Update other fields directly
    }));
  }

  function handleAddTask() {
    setIsAddTask(!isAddTask)
  }

  async function fetchTaskById(id) {
    setIsLoading(true);
    try {
      const res = await axios.get(`${url}/api/task/${id}`, {
        headers: {
          Authorization: data.token || ""
        }
      })
      setTasks(res.data.tasks)
      setFilterTasks(res.data.tasks)
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false)
  }

  function filterByName(value) {

    if (["", null].includes(value)) {
      setTasks(filterTasks)
    } else {
      setTasks(filterTasks.filter((task) => task?.name?.includes(value)))
    }
  }

  async function addTask() {
    try {
      const res = await axios.post(`${url}/api/task/${data._id}`, taskObj, {
        headers: {
          Authorization: data.token || ""
        }
      })
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.error)
    }
  }

  async function gettingEmps() {
    try {
      const emps = await fetchEmployees();
      setEmployees(emps.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
    } catch (error) {
      console.log(error);
    }
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
    fetchProjects();
    gettingEmps();
  }, [])
  console.log(tasks);

  return (

    isAddTask ? <CommonModel
      dataObj={taskObj}
      isAddData={isAddTask}
      changeData={changeTask}
      projects={projects}
      addData={addTask}
      emps={employees}
      type="Task"
      modifyData={handleAddTask} /> :
      <>
        <div className="projectParent">
          <div className="projectTitle col-lg-6">Tasks</div>
          <div className="col-lg-6 projectChild">
            <SelectPicker
              data={projects}
              size="lg"
              appearance="default"
              style={{ width: 300 }}
              placeholder="Search By Project"
              onChange={(e) => fetchTaskById(e)}
            />
            <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
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
                  <div key={task._id} className="box-content d-flex align-items-center my-3">
                    <Checkbox /> {task.title} || <span className="defaultDesign">{task.status}</span> ||
                    <div className="d-flex align-items-center gap-2 my-3">
                      {task.assignedTo.map((emp) => (
                        <div className="nameHolder" style={{ width: "30px", height: "30px" }} key={emp._id}>
                          {emp.FirstName[0].toUpperCase() +
                            emp.LastName[0].toUpperCase()}
                        </div>
                      ))}
                      <AddCircleOutlineRoundedIcon fontSize="large" color="disabled" onClick={() => {
                        // fetchProjectById(project._id)
                        // handleEditProject()
                      }} />
                    </div>
                  </div>

                )) : <NoDataFound message={"Task Not Found"} />
          }
        </div >
      </>
  )
};

export default Tasks;
