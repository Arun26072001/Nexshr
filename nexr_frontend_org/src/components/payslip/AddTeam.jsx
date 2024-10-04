import React from "react";
import CloseIcon from '@mui/icons-material/Close';
import './style.css';

const AddTeam = (props) => {
  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="card">
            <div className="card-header">
                <span>Add a Team</span>
                <span><CloseIcon /></span>
            </div>
            <div className="card-body">
                <p className="my-2">Name</p>
                <input type="text" name="team" className="form-control" />
            </div>
            <div className="card-footer">
                <button className="outline-btn">Close</button>
                <button className="btnRose" disabled={`${teamName } ?  false : true ` } onChange={(e)=> setTeamName(e.target.value)} >Select employees</button>
            </div>
        </div>
      </div>
    </div>
  )
};

export default AddTeam;
