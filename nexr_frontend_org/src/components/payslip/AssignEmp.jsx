import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Message } from 'rsuite';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import axios from "axios";

const AssignEmp = ({ handleSubmit, teamObj, updateTeamObj, toggleAssignEmp, teams, setTeamLead }) => {
    console.log(teamObj);
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [nameSearch, setNameSearch] = useState("");
    const [rotateState, setRotateState] = useState({
        employees: true // Initially expand employee section
    });
    const [selectBy, setSelectBy] = useState("teamName");
    const [filteredItems, setFilteredItems] = useState(teams || []);
    const [filteredEmps, setFilteredEmps] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
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
                        Authorization: `Bearer ${token}`
                    }
                });
                setEmployees(res.data);
                setFilteredEmps(res.data);

            } catch (err) {
                console.log(err);
            }
        };
        fetchEmployees();
    }, [url, token]); // Add url and token as dependencies

    useEffect(() => {
        function filterLead() {
            // Use a Map to filter unique team leads by their ID
            const uniqueTeamLeads = teamObj?.employees
                ?.filter((emp) => emp?.teamLead?._id) // Ensure teamLead exists
                ?.reduce((acc, emp) => {
                    acc.set(emp.teamLead._id, emp.teamLead); // Map by teamLead ID
                    return acc;
                }, new Map()); // Use a Map to keep unique teamLeads by _id
            console.log(uniqueTeamLeads);

            setTeamLeads(Array.from(uniqueTeamLeads.values())); // Convert back to array of teamLead objects
        }

        filterLead();
    }, [updateTeamObj, teamObj]);

    return (
        <Modal open={true} onClose={toggleAssignEmp} size="sm" backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    Assign employees to {teamObj.teamName}
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
                            className="m-0"
                            placeholder="Search"
                            value={nameSearch}
                            onChange={onChangeEmp}
                        />
                    </div>
                    <div className="col-lg-8 my-2">
                        <select className="form-control" name="lead" onChange={(e) => setTeamLead(e)}>
                            <option value="">Select a Team Lead for {teamObj.teamName}</option>
                            {
                                teamLeads.map((lead) => {
                                    return <option value={lead._id}>{lead.FirstName + lead.LastName}</option>
                                })
                            }
                        </select>
                    </div>
                </div>

                {/* Selected Employees */}
                {teamObj.employees.length > 0 && (
                    <div>
                        <h5 className="px-2" onClick={() => handleRotate('selected')}>
                            Selected ({teamObj.employees.length})
                            <KeyboardArrowDownOutlinedIcon
                                fontSize="large"
                                color="primary"
                                className={`arrow ${rotateState['selected'] ? 'rotate' : ''}`}
                            />
                        </h5>
                        {rotateState['selected'] &&
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

                {/* Employee List by Name */}
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

                {/* Teams List */}
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
