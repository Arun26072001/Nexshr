import React, { useEffect, useState } from "react";
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import InfoIcon from '@mui/icons-material/Info';
import "./SettingsStyle.css";
import axios from "axios";
import MoreVertIcon from '@mui/icons-material/MoreVert'; // For vertical ellipsis
import { Menu, MenuItem } from "@mui/material"; // Menu and MenuItem for actions
import { toast } from "react-toastify";
import Loading from "../Loader";
import EditWorkingPlace from "./EditWorkPlace";
import AddWorkingPlace from "./AddWorkingPlace";
import { fetchWorkplace } from "../ReuseableAPI";

const WorkPlaceTab = () => {
  const [showModel, setShowModel] = useState(false);
  const [editModel, setEditModel] = useState(false);
  const [editWorkPlace, setEditWorkPlace] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [changeWorkPlace, setChangeWorkPlace] = useState(false);
  const url = process.env.REACT_APP_API_URL;
  const [workPlaces, setWorkPlaces] = useState([]);

  const [anchorEl, setAnchorEl] = useState(null); // State for Menu anchor
  const [selectedWorkPlace, setSelectedWorkPlace] = useState(null); // Store selected workplace for actions

  const token = localStorage.getItem("token");

  // Handle opening and closing the menu
  const handleClick = (event, workPlace) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorkPlace(workPlace);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  async function onChangeEdit(e) {
    const { name, value } = e.target;
    if (name === "Country" || name === "State") {
      let values = value.split(",");
      setEditWorkPlace((prevEditWorkPlace) => ({
        ...prevEditWorkPlace,
        [name]: values
      }));
      if (name === "Country") {
        try {
          const states = await axios.get(`${url}/api/country/${values[0]}`, {
            Authorization: token || ""
          });
          setStateData(states)
        } catch (err) {
          console.error(err);
          toast.error("Error in fetch state")
        }
      }
    } else {
      setEditWorkPlace((prevEditWorkPlace) => ({
        ...prevEditWorkPlace,
        [name]: value
      }));
    }
  }

  async function editToGetWorkPlace(id) {

    try {
      const workPlace = await axios.get(`${url}/api/work-place/${id}`, {
        headers: {
          Authorization: token || ""
        }
      })
      setEditWorkPlace(workPlace.data);
      setEditModel(true);
    } catch (error) {
      console.log(error);
    }
  }

  function handleDelete(workPlace) {
    if (workPlace.EmpID.length > 0) {
      return toast.error(`Can't delete workPlace. There Have ${workPlace.EmpID.length} Employees!`);
    } else {
      axios.delete(`${url}/api/work-place/${workPlace._id}`, {
        headers: {
          Authorization: `${token}` || ""
        }
      })
        .then((res) => {
          toast.success(res.data);
          setChangeWorkPlace(!changeWorkPlace);
        })
        .catch((err) => {
          toast.error(err);
        });
    }
  }

  function updateWorkPlaces() {
    setChangeWorkPlace(!changeWorkPlace);
  }

  useEffect(() => {
    async function gettingWorkPlaces() {
      try {
        const workPlaces = await fetchWorkplace();
        setWorkPlaces(workPlaces);
      } catch (err) {
        console.error(err);
        toast.error(err);
      }
    }
    gettingWorkPlaces();
  }, [changeWorkPlace]);

  return (
    <div className="container">
      <div className="my-3 row">
        <div className="col-6 d-flex justify-content-start">
          <span>
            <h5>PLACES OF WORK</h5>
          </span>
        </div>
        <div className="col-6 d-flex justify-content-end">
          <button type="button" onClick={() => setShowModel(!showModel)} className="button">
            NEW PLACE TO WORK
          </button>
        </div>
      </div>
      <p className="mt-3">
        Places of work are where working activities are conducted. Only assign employees to their regular place of work.
      </p>
      <p className="text-warning my-2">
        <InfoIcon /> Note: Places of work cannot be fully edited once they have employees assigned.
      </p>

      {showModel && (
        <div className="formModal" id="" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-body">
                <AddWorkingPlace changeModel={() => setShowModel(!showModel)} updateWorkPlaces={updateWorkPlaces} editWorkPlace={editWorkPlace} />
              </div>
            </div>
          </div>
        </div>
      )}

      {editModel && (
        <div className="formModal" id="" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-body">
                <EditWorkingPlace
                  modifyWorkPlace={() => setChangeWorkPlace(!changeWorkPlace)}
                  onChangeEdit={onChangeEdit}
                  changeEditModel={() => setEditModel(!editModel)}
                  editWorkPlace={editWorkPlace}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {workPlaces.length > 0 ? (
        <table className="table table-striped my-2 mt-4">
          <thead>
            <tr className="text-center">
              <th>Name</th>
              <th>Address</th>
              <th>Assigned employees</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {workPlaces.map((workPlace, index) => (
              <tr key={index} className="text-center">
                <td><b>{workPlace.CompanyName}</b></td>
                <td>
                  <div>
                    {workPlace.Address_1}, {workPlace.Address_2}, {workPlace.Town}, {workPlace.State[1]}, {workPlace.PostCode}, {workPlace.Country[1]}
                  </div>

                </td>
                <td>
                  <div style={{ fontSize: '17px' }} className="text-primary">
                    <GroupOutlinedIcon fontSize="large" color="primary" />
                    {workPlace.EmpID.length}
                  </div>
                </td>
                <td className="justify-content-center align-items-center">
                  <MoreVertIcon
                    fontSize="large"
                    onClick={(e) => handleClick(e, workPlace)}
                  />
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem
                      onClick={() => { editToGetWorkPlace(selectedWorkPlace._id); handleClose(); }}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => { handleDelete(selectedWorkPlace); handleClose(); }}
                    >
                      Delete
                    </MenuItem>

                  </Menu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="align-items-center justify-content-center">
          <Loading height="80vh" />
        </div>
      )}
    </div>
  );
};

export default WorkPlaceTab;
