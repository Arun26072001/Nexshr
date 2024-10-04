import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Message } from 'rsuite';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import axios from "axios";

const AssignEmp = ({ handleSubmit, teamObj, updateTeamObj, toggleAssignEmp, teams }) => {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [nameSearch, setNameSearch] = useState("");
    const [rotateState, setRotateState] = useState({
        employees: true // Initially expand employee section
    });
    const [selectBy, setSelectBy] = useState("teamName");
    const [filteredItems, setFilteredItems] = useState(teams);
    const [filteredEmps, setFilteredEmps] = useState([]);
    const [employees, setEmployees] = useState([]);

    const handleRotate = (key) => {
        setRotateState((prevState) => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    const onChangeEmp = (value) => {
        setNameSearch(value);
        if (selectBy === "empName") {
            if (value === "") {
                setFilteredEmps(employees);
            } else {
                setFilteredEmps(
                    employees.filter((emp) =>
                        emp.FirstName.toLowerCase().includes(value.toLowerCase()) ||
                        emp.LastName.toLowerCase().includes(value.toLowerCase())
                    )
                );
            }
        } else {
            if (value === "") {
                setFilteredItems(teams);
            } else {
                setFilteredItems(
                    teams.filter((team) =>
                        team.teamName.toLowerCase().includes(value.toLowerCase())
                    )
                );
            }
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${url}/api/employee`, {
                    headers: {
                        authorization: token || ""
                    }
                });
                setEmployees(res.data);
                setFilteredEmps(res.data);
            } catch (err) {
                console.log(err);
            }
        };
        fetchEmployees();
    }, []);

    return (
        <Modal open={true} onClose={toggleAssignEmp} size="lg" backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    Assign employees to "{teamObj.teamName}"
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row mb-3">
                    <div className="col-lg-4">
                        <select className="form-control" onChange={(e) => setSelectBy(e.target.value)}>
                            <option value="teamName">Search by Team</option>
                            <option value="empName">Search by Name</option>
                        </select>
                    </div>
                    <div className="col-lg-4">
                        <Input
                            placeholder="Search"
                            value={nameSearch}
                            onChange={onChangeEmp}
                        />
                    </div>
                </div>

                {teamObj.employees.length > 0 && (
                    <div>
                        <h5 className="px-2" onClick={() => handleRotate(teamObj.teamName)}>
                            Selected ({teamObj.employees.length})
                            <KeyboardArrowDownOutlinedIcon
                                fontSize="large"
                                color="primary"
                                className={`arrow ${rotateState[teamObj.teamName] ? 'rotate' : ''}`}
                            />
                        </h5>
                        {rotateState[teamObj.teamName] &&
                            teamObj.employees.map((emp) => {
                                const active = teamObj.employees.some((e) => e._id === emp._id);
                                return (
                                    <div key={emp._id} className={`empSelect ${active ? "enable" : ""}`} onClick={() => updateTeamObj(emp)}>
                                        {emp.FirstName} {emp.LastName}
                                    </div>
                                );
                            })
                        }
                    </div>
                )}

                {selectBy === "empName" && filteredEmps.length > 0 && (
                    <div>
                        <h5 className="px-2" onClick={() => handleRotate("employees")}>
                            Employees ({filteredEmps.length})
                            <KeyboardArrowDownOutlinedIcon
                                fontSize="large"
                                color="primary"
                                className={`arrow ${rotateState["employees"] ? 'rotate' : ''}`}
                            />
                        </h5>
                        {rotateState["employees"] &&
                            filteredEmps.map((emp) => {
                                const active = teamObj.employees.some((e) => e._id === emp._id);
                                return (
                                    <div key={emp._id} className={`empSelect ${active ? "enable" : ""}`} onClick={() => updateTeamObj(emp)}>
                                        {emp.FirstName} {emp.LastName}
                                    </div>
                                );
                            })
                        }
                    </div>
                )}

                {selectBy === "empName" && filteredEmps.length === 0 && nameSearch && (
                    <Message showIcon type="warning" description="No employees found" />
                )}

                {selectBy === "teamName" && filteredItems.length > 0 && (
                    filteredItems.map((team) => (
                        <div key={team.teamName}>
                            <h5 className="px-2" onClick={() => handleRotate(team.teamName)}>
                                {team.teamName} ({team.employees.length})
                                <KeyboardArrowDownOutlinedIcon
                                    fontSize="large"
                                    color="primary"
                                    className={`arrow ${rotateState[team.teamName] ? 'rotate' : ''}`}
                                />
                            </h5>
                            {rotateState[team.teamName] &&
                                team.employees.map((emp) => {
                                    const active = teamObj.employees.some((e) => e._id === emp._id);
                                    return (
                                        <div key={emp._id} className={`empSelect ${active ? "enable" : ""}`} onClick={() => updateTeamObj(emp)}>
                                            {emp.FirstName} {emp.LastName}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ))
                )}

                {selectBy === "teamName" && filteredItems.length === 0 && (
                    <Message showIcon type="warning" description="No teams found" />
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={toggleAssignEmp} appearance="subtle">
                    Close
                </Button>
                <Button onClick={handleSubmit} appearance="primary">
                    {teamObj._id ? "Update" : "Save"} ({teamObj.employees.length})
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AssignEmp;
