// import React, { useEffect, useState } from "react";
// import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
// import InfoIcon from '@mui/icons-material/Info';
// import "./SettingsStyle.css";
// import axios from "axios";
// import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
// import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
// import { toast } from "react-toastify";
// import Loading from "../Loader";
// import EditWorkingPlace from "./EditWorkPlace";
// import AddWorkingPlace from "./AddWorkingPlace";
// import { fetchWorkplace } from "../ReuseableAPI";


// const WorkPlaceTab = () => {
//   const [showModel, setShowModel] = useState(false);
//   const [editModel, setEditModel] = useState(false);
//   const [editWorkPlace, setEditWorkPlace] = useState([]);
//   const [stateData, setStateData] = useState([]);
//   const [changeWorkPlace, setChangeWorkPlace] = useState(false);
//   const url = process.env.REACT_APP_API_URL;
//   const [workPlaces, setWorkPlaces] = useState([]);

//   async function onChangeEdit(e) {
//     const { name, value } = e.target;
//     console.log(name, value);

//     // Handle Country and State separately
//     if (name === "Country" || name === "State") {
//       let values = value.split(",");
//       console.log(values);

//       // Update editWorkPlace state
//       setEditWorkPlace((prevEditWorkPlace) => ({
//         ...prevEditWorkPlace,
//         [name]: values
//       }));

//       // If Country is selected, fetch its corresponding states
//       if (name === "Country") {
//         try {
//           const states = await axios.get(`${url}/api/country/${values[0]}`, {
//             headers: {
//               authorization: token || ""
//             }
//           });
//           setStateData(states)
//         } catch (err) {
//           console.error(err);
//           toast.error("Error in fetch state")
//         }

//       }
//     } else {
//       // For all other inputs, update the editWorkPlace state normally
//       setEditWorkPlace((prevEditWorkPlace) => ({
//         ...prevEditWorkPlace,
//         [name]: value
//       }));
//     }
//   }


//   function removeEmp(e) {
//     setEditWorkPlace(prevState => ({
//       ...prevState,
//       ['EmpID']: prevState.EmpID.filter(id => id !== e._id)
//     }));
//   }
//   console.log(editWorkPlace);

//   function ChangeAssignEmp(emp) {
//     console.log("changeassign working", emp);

//     setEditWorkPlace({
//       ...editWorkPlace,
//       ['EmpID']: [...editWorkPlace.EmpID, emp._id]
//     })
//   }
//   const names = ["Name", "Address", "Assigned employees", "Action"];
//   const token = localStorage.getItem("token");
//   function changeModel() {
//     setShowModel(!showModel)
//   }

//   function changeEditModel() {
//     setEditModel(!editModel)
//   }

//   function modifyWorkPlace() {
//     setChangeWorkPlace(!changeWorkPlace)
//   }

//   function handleEdit(id) {
//     axios.get(url + "/api/work-place/" + id, {
//       headers: {
//         authorization: token || ""
//       }
//     })
//       .then((res) => {
//         console.log(res.data);
//         setEditWorkPlace(res.data);
//         changeEditModel()
//       })
//       .catch((err) => {
//         console.log(err);
//       })
//   }

//   function handleDelete(e) {
//     if (e.EmpID.length > 0) {
//       return toast.error(`Can't delete workPlace. There Have ${e.EmpID.length} Employees!`)
//     } else {
//       axios.delete(`${url}/api/work-place/${e._id}`, {
//         headers: {
//           authorization: token || ""
//         }
//       }).then((res) => {
//         toast.success(res.data)
//         modifyWorkPlace()
//       }).catch((err) => {
//         toast.error(err)
//       })
//     }
//   }

//   function updateWorkPlaces() {
//     setChangeWorkPlace(!changeWorkPlace)
//   }

//   useEffect(() => {
//     async function gettingWorkPlaces() {
//       try {
//         const workPlaces = await fetchWorkplace();
//         setWorkPlaces(workPlaces);
//       } catch (err) {
//         console.error(err);
//         toast.error(err)
//       }
//     }
//     gettingWorkPlaces();
//   }, [changeWorkPlace]);

//   return (
// <div className="container">
//   <div className="my-3 row">
//     <div className="col-6 d-flex justify-content-start">
//       <span>
//         <h5>PLACES OF WORK</h5>
//       </span>
//     </div>
//     {/* Button trigger modal */}
//     <div className="col-6 d-flex justify-content-end">
//       <button type="button" onClick={changeModel} className="button" data-toggle="modal" data-target="#exampleModal">
//         NEW PLACE TO WORK
//       </button>
//     </div>
//   </div>
//       <p className="mt-3">
//         Places of work are where working activites are conducted.
//         Only assign employees to their regular place of work.
//       </p>
//       <p className="text-warning my-2">
//         <InfoIcon /> Note: Places of work cannot be fully edited once they have employees assigned.
//       </p>

//       {/* {showModel &&
//         <div className="formModal" id="" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
//           <div className="modal-dialog" role="document">
//             <div className="modal-content">
//               <div className="modal-body">
//                 <form>
//                   <div className="form-group">
//                     <AddWorkingPlace changeModel={changeModel} updateWorkPlaces={updateWorkPlaces} editWorkPlace={editWorkPlace} />
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>}

//       {editModel && <div className="formModal" id="" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
//         <div className="modal-dialog" role="document">
//           <div className="modal-content">
//             <div className="modal-body">
//               <form>
//                 <div className="form-group">
//                   <EditWorkingPlace modifyWorkPlace={modifyWorkPlace} onChangeEdit={onChangeEdit} ChangeAssignEmp={ChangeAssignEmp} changeEditModel={changeEditModel} removeEmp={removeEmp} editWorkPlace={editWorkPlace} />
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>}

//       {workPlaces.length > 0 ? (<table className='table table-striped my-2 mt-3'>
//         <thead>
//           <tr className="text-center">
//             {names.map((name, index) => (
//               <th key={index}>{name}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {workPlaces.length > 0 && workPlaces.map((workPlace, index) => (
//             <tr key={index}>
//               <td><b>{workPlace.CompanyName}</b></td>
//               <td>
//                 <div>
//                   {workPlace.Address_1} <br />
//                   {workPlace.Address_2} <br />
//                   {workPlace.Town} <br />
//                   {workPlace.State[1]} <br />
//                   {workPlace.PostCode} {workPlace.Country[1]}
//                 </div>
//               </td>
//               <td>
//                 <div style={{ fontSize: "17px" }} className="text-primary">
//                   <GroupOutlinedIcon fontSize="large" color="primary" />{" "}
//                   {workPlace.EmpID.length}
//                 </div>
//               </td>
//               <td>
//                 <div>
//                   <EditOutlinedIcon fontSize="large" style={{ cursor: "pointer" }} onClick={() => handleEdit(workPlace._id)} color="primary" />{" "}
//                   <DeleteOutlineOutlinedIcon style={{ cursor: "pointer" }} fontSize="large" onClick={() => handleDelete(workPlace)} color="primary" />
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>) : <div className="d-flex align-items-center justify-content-center"><Loading /></div>} */}
//       {showModel && (
//   <div
//     className="formModal"
//     id=""
//     tabIndex="-1"
//     role="dialog"
//     aria-labelledby="exampleModalLabel"
//     aria-hidden="true"
//   >
//     <div className="modal-dialog modal-dialog-centered" role="document">
//       <div className="modal-content">
//         <div className="modal-body">
//           <form>
//             <div className="form-group">
//               <AddWorkingPlace
//                 changeModel={changeModel}
//                 updateWorkPlaces={updateWorkPlaces}
//                 editWorkPlace={editWorkPlace}
//               />
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   </div>
// )}

// {editModel && (
//   <div
//     className="formModal"
//     id=""
//     tabIndex="-1"
//     role="dialog"
//     aria-labelledby="exampleModalLabel"
//     aria-hidden="true"
//   >
//     <div className="modal-dialog modal-dialog-centered" role="document">
//       <div className="modal-content">
//         <div className="modal-body">
//           <form>
//             <div className="form-group">
//               <EditWorkingPlace
//                 modifyWorkPlace={modifyWorkPlace}
//                 onChangeEdit={onChangeEdit}
//                 ChangeAssignEmp={ChangeAssignEmp}
//                 changeEditModel={changeEditModel}
//                 removeEmp={removeEmp}
//                 editWorkPlace={editWorkPlace}
//               />
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   </div>
// )}

// {workPlaces.length > 0 ? (
//   <table className="table table-striped my-2 mt-3">
//     <thead>
//       <tr className="text-center">
//         {names.map((name, index) => (
//           <th key={index}>{name}</th>
//         ))}
//       </tr>
//     </thead>
//     <tbody>
//       {workPlaces.map((workPlace, index) => (
//         <tr key={index} className="text-center">
//           <td>
//             <b>{workPlace.CompanyName}</b>
//           </td>
//           <td>
//             <div>
//               {workPlace.Address_1} <br />
//               {workPlace.Address_2} <br />
//               {workPlace.Town} <br />
//               {workPlace.State[1]} <br />
//               {workPlace.PostCode} {workPlace.Country[1]}
//             </div>
//           </td>
//           <td>
//             <div style={{ fontSize: '17px' }} className="text-primary">
//               <GroupOutlinedIcon fontSize="large" color="primary" />
//               {workPlace.EmpID.length}
//             </div>
//           </td>
//           <td className="justify-content-center align-items-center">
//   {/* Action icons */}
//   <div className="align-items-center justify-content-center" style={{ flexDirection: 'column' }}>
//     <EditOutlinedIcon
//       fontSize="large"
//       style={{ cursor: 'pointer', marginBottom: '5px' }} // Adjusted margin to give space between icons
//       onClick={() => handleEdit(workPlace._id)}
//       color="primary"
//     />
//     <DeleteOutlineOutlinedIcon
//       fontSize="large"
//       style={{ cursor: 'pointer' }}
//       onClick={() => handleDelete(workPlace)}
//       color="primary"
//     />
//   </div>
// </td>

//         </tr>
//       ))}
//     </tbody>
//   </table>
// ) : (
//   <div className="d-flex align-items-center justify-content-center">
//     <Loading />
//   </div>
// )}

//     </div>
//   )
// };

// export default WorkPlaceTab;





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
    console.log(name, value);
    if (name === "Country" || name === "State") {
      let values = value.split(",");
      console.log(values);
      setEditWorkPlace((prevEditWorkPlace) => ({
        ...prevEditWorkPlace,
        [name]: values
      }));
      if (name === "Country") {
        try {
          const states = await axios.get(`${url}/api/country/${values[0]}`, {
            Authorization: `Bearer ${token}` || ""
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

  function handleEdit(id) {
    axios.get(url + "/api/work-place/" + id, {
      Authorization: `Bearer ${token}` || ""
    })
      .then((res) => {
        console.log(res.data);
        setEditWorkPlace(res.data);
        setEditModel(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleDelete(workPlace) {
    if (workPlace.EmpID.length > 0) {
      return toast.error(`Can't delete workPlace. There Have ${workPlace.EmpID.length} Employees!`);
    } else {
      axios.delete(`${url}/api/work-place/${workPlace._id}`, {
        Authorization: `Bearer ${token}` || ""
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
                      onClick={() => { handleEdit(selectedWorkPlace._id); handleClose(); }}
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
          <Loading />
        </div>
      )}
    </div>
  );
};

export default WorkPlaceTab;
