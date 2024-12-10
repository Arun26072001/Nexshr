import React, { useState } from "react";
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const EmpCard = ({ team, deleteTeam, editTeam }) => {
    const [isDelete, setIsDelete] = useState(false);
    const [deleteId, setDeleteId] = useState("");

    function handleDelete() {
        setIsDelete(!isDelete);
    }

    function confirmToDlt(id) {
        setDeleteId(id);
        handleDelete()
    }
    return (
        isDelete ? (
            <div className="formModal">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header" style={{backgroundColor: "#03346E"}}>
                            <h5 className="modal-title text-light" id="exampleModalLongTitle">Delete Team</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body text-dark">
                            Are you sure you want to delete Team ?
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleDelete}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={() => {
                                handleDelete()
                                deleteTeam(deleteId)
                            }
                            }>Yes</button>
                        </div>
                    </div>
                </div>
            </div>) :
            <div className="col-lg-5 empCard">
                <div className="nameHolder">
                    {team.teamName[0]}
                </div>
                <div>
                    <div style={{ fontWeight: 600 }}>{team.teamName[0].toUpperCase()+team.teamName.slice(1)}</div>
                    <div>{team.employees.length} member</div>
                </div>
                <div >
                    <div onClick={()=>editTeam(team)}>
                        <EditOutlinedIcon color="primary" sx={{ cursor: "pointer" }} />
                    </div>
                    <div onClick={() => confirmToDlt(team._id)} >
                        <DeleteOutlineOutlinedIcon color="primary" sx={{ cursor: "pointer" }} />
                    </div>
                </div>
            </div>
    )
};

export default EmpCard;
