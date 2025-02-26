import React, { useState } from "react";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CommonModel from "../Administration/CommonModel";

const EmpCard = ({ team, deleteTeam, editTeam }) => {
    const [isDelete, setIsDelete] = useState(false);
    const [deleteId, setDeleteId] = useState("");

    function handleDelete(id) {
        setDeleteId(id);
        setIsDelete(true);
    }
    

    function confirmDelete() {
        deleteTeam(deleteId); // Call delete function with the ID
        setIsDelete(false); // Close modal after deletion
    }

    return (
        <>
            {isDelete && (
                <CommonModel
                    type="Confirmation"
                    isAddData={isDelete}
                    deleteData={confirmDelete}
                    modifyData={handleDelete}
                />
            )}

            <div className="col-lg-5 empCard">
                <div className="nameHolder">
                    <b>{team?.teamName ? team.teamName[0].toUpperCase() : "?"}</b>
                </div>
                <div>
                    <div style={{ fontWeight: 600 }}>
                        {team?.teamName
                            ? team.teamName[0].toUpperCase() + team.teamName.slice(1)
                            : "Unnamed Team"}
                    </div>
                    <div>{team?.employees?.length || 0} member(s)</div>
                </div>
                <div>
                    <div onClick={() => editTeam(team)}>
                        <EditOutlinedIcon color="primary" sx={{ cursor: "pointer" }} />
                    </div>
                    <div onClick={() => handleDelete(team._id)}>
                        <DeleteOutlineOutlinedIcon color="primary" sx={{ cursor: "pointer" }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmpCard;
