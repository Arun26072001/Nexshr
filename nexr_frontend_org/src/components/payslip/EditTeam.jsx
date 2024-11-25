import React from 'react';
import "./editModel.css";
import { Modal, Button } from 'rsuite';
import 'rsuite/dist/rsuite.min.css'; // Make sure to import the CSS

const EditModel = ({ team, setTeamName, toggleAddTeam, toggleAssignEmp }) => {

  return (
    <Modal open={toggleAddTeam} size={'sm'} backdrop="static">
      <Modal.Header>
        <Modal.Title>
          {team._id ? "Edit Team" : "Add a New Team"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="modelInput">
          <p>Name</p>
          <input
            className='form-control'
            type="text"
            name="teamName"
            value={team.teamName}
            onChange={(e) => setTeamName(e)}
            placeholder="Please enter a team name..."
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={toggleAddTeam} appearance="subtle">
          Close
        </Button>
        <Button
          onClick={toggleAssignEmp}
          appearance="primary"
          disabled={!team.teamName}
        >
          Select Employees
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditModel;
