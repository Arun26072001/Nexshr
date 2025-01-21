import React, { useState } from "react"
import { Dropdown, Popover, Whisper } from "rsuite";
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CommonModel from "./Administration/CommonModel";

const Tasks = () => {
  const [isAddProject, setIsAddProject] = useState("");
  const [taskObj, setTaskObj] = useState({});

  function handleAddProject() {
    setIsAddProject(!isAddProject);
  }

  const renderMenu = ({ onClose, right, top, className }, ref) => {
    const handleSelect = eventKey => {
      if (eventKey === 1) {
        handleAddProject();
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
    console.log(value, name);
    setTaskObj((pre) => ({
      ...pre,
      [name]: value
    }))
  }

  function addTask(){

  }
  return (

    isAddProject ? <CommonModel
      dataObj={taskObj}
      isAddData={isAddProject}
      changeData={changeTask}
      // teams={teams}
      addData={addTask}
      type="Task"
      // emps={employees}
      modifyData={handleAddProject} /> :
      <div className="projectParent">
        <div className="projectTitle">Tasks</div>
        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
          <div className="button">
            Action <ArrowDropDownRoundedIcon />
          </div>
        </Whisper>
      </div>
  )
};

export default Tasks;
