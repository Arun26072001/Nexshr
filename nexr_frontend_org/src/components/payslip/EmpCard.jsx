import React, { useState } from "react";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CommonModel from "../Administration/CommonModel";

const EmpCard = ({ team, deleteTeam, editTeam, whoIs }) => {
    const [isDelete, setIsDelete] = useState(false);
    const [deleteId, setDeleteId] = useState("");

    function handleDelete(id) {
        if (!isDelete) {
            setDeleteId(id)
        } else {
            setDeleteId("");
        }
        setIsDelete(!isDelete);
    }

    function confirmDelete() {
        deleteTeam(deleteId); // Call delete function with the ID
        handleDelete()
    }

    return (
        <>
            {isDelete && (
                <CommonModel
                    type="Team Confirmation"
                    isAddData={isDelete}
                    deleteData={confirmDelete}
                    modifyData={handleDelete}
                />
            )}

            <div className="col-md-5 col-12 col-lg-5">
                <div className="empCard">
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
                        {
                            ["admin", "hr"].includes(whoIs) &&
                            <div onClick={() => handleDelete(team._id)}>
                                <DeleteOutlineOutlinedIcon color="primary" sx={{ cursor: "pointer" }} />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmpCard;
