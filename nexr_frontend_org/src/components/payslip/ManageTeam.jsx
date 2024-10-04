import React, { useEffect, useState } from "react";
// import './style.css';
import EmpCard from "./EmpCard";
import axios from "axios";
import { toast } from "react-toastify";
import AssignEmp from "./AssignEmp";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditTeam from "./EditTeam";
import { Input, InputGroup } from "rsuite";
import { useNavigate } from "react-router-dom";

const ManageTeam = ({ whoIs }) => {
    const [teamObj, setTeamObj] = useState({
        teamName: "",
        employees: [],
        lead: ""
    });
    const [searchTeam, setSearchTeam] = useState('');
    const [dom, reload] = useState(false);
    const [assignEmp, setAssignEmp] = useState(false);
    const [addTeam, setAddTeam] = useState(false);
    const [editTeamObj, setEditTeamObj] = useState({});
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const filterTeam = (e) => {
        setSearchTeam(e);
        if (e === "") {
            setFilteredTeams(teams);
        } else {
            setFilteredTeams(
                teams.filter((team) =>
                    team.teamName.toLowerCase().includes(e.toLowerCase())
                )
            );
        }
    };

    const toggleAddTeam = () => {
        setAddTeam(!addTeam);
        if (addTeam) {  // editTeamObj will be empty. when exit from editTeam
            setEditTeamObj({})
        }
    };

    const toggleAssignEmp = () => {
        setAssignEmp(!assignEmp);
    };

    const setTeamName = (name) => {
        setTeamObj((prev) => ({
            ...prev,
            teamName: name
        }));
    };

    // add team
    const handleSubmit = async () => {
        try {
            const newTeamObj = {
                ...teamObj,
                employees: teamObj.employees.map((emp) => emp._id)
            };

            const response = await axios.post(url + "/api/team", newTeamObj, {
                headers: { authorization: token || "" }
            });

            toggleAssignEmp();
            toggleAddTeam();
            reloadUI();
            toast.success(response.data.message);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const updateTeamObj = (emp) => {
        if (editTeamObj.employees && editTeamObj.employees.length > 0) {
            setEditTeamObj((prev) => {
                const updatedEmployees = prev.employees.includes(emp)
                    ? prev.employees.filter(e => e._id !== emp._id)
                    : [...prev.employees, emp];

                return {
                    ...prev,
                    employees: updatedEmployees
                };
            });
        } else {
            setTeamObj((prev) => {
                const updatedEmployees = prev.employees.includes(emp._id)
                    ? prev.employees.filter(e => e._id !== emp._id)
                    : [...prev.employees, emp];

                return {
                    ...prev,
                    employees: updatedEmployees
                };
            });
        }
    };


    const reloadUI = () => {
        reload(!dom);
    };

    const deleteTeam = async (id) => {
        try {
            const res = await axios.delete(url + "/api/team/" + id, {
                headers: { authorization: token || "" }
            });

            toast.success(res.data.message);
            reloadUI();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const editTeam = async (team) => {
        try {
            const res = await axios.get(url + "/api/team/" + team._id, {
                headers: { authorization: token || "" }
            });

            setEditTeamObj(res.data);
            toggleAddTeam();
        } catch (err) {
            toast.error(err.message);
        }
    };

    // update team
    const handleSubmitEdit = async () => {
        try {
            const { _id, __v, ...object } = editTeamObj
            const updatedTeamObj = {
                ...object,
                employees: editTeamObj.employees.map((emp) => emp._id)
            };
            console.log(updatedTeamObj);

            const res = await axios.put(url + "/api/team/" + editTeamObj._id, updatedTeamObj, {
                headers: { authorization: token || "" }
            });

            toggleAssignEmp();
            toggleAddTeam();
            reloadUI();
            toast.success(res.data.message);
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        }
    };

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await axios.get(url + "/api/team", {
                    headers: { authorization: token || "" }
                });

                setTeams(res.data);
                setFilteredTeams(res.data);
            } catch (err) {
                toast.error(err.message);
                if (err?.status == 401) {
                    navigate("/admin/unauthorize");
                }
            }
        };

        fetchTeams();
    }, [dom]);

    return (
        <div className="my-2">
            {/* <div className="container-fluid"> */}

            <button className="button my-2" onClick={toggleAddTeam}>
                Add a new team
            </button>
            {/* <div className="searchParent my-2">
                <input
                    type="text"
                    name="searchTeam"
                    className="form-control"
                    value={searchTeam}
                    onChange={(e) => filterTeam(e.target.value)}
                    style={{ border: "2px solid #dadada", borderRadius: "10px" }}
                    placeholder="Team name"
                />
                <div className="searchIcon">
                    <SearchRoundedIcon />
                </div>
            </div> */}
            <InputGroup inside style={{ width: "300px" }}>
                <Input placeholder="Team Name" className="m-0" value={searchTeam} onChange={filterTeam} />
                <InputGroup.Button className="m-auto">
                    <SearchRoundedIcon />
                </InputGroup.Button>
            </InputGroup>

            {addTeam && (
                <EditTeam
                    teams={teams}
                    team={editTeamObj}
                    setTeamName={setTeamName}  // to update teamName
                    toggleAddTeam={toggleAddTeam}
                    toggleAssignEmp={toggleAssignEmp}
                />
            )}

            {assignEmp && (
                <AssignEmp
                    handleSubmit={editTeamObj._id ? handleSubmitEdit : handleSubmit}
                    teamObj={editTeamObj ? editTeamObj : teamObj}
                    updateTeamObj={updateTeamObj}
                    setTeams={setTeams}
                    toggleAssignEmp={toggleAssignEmp}
                    teams={teams}
                />
            )}

            {filteredTeams.length > 0 ? (
                <div className="row d-flex justify-content-start">
                    {filteredTeams.map((team) => (
                        <EmpCard key={team._id} team={team} editTeam={editTeam} deleteTeam={deleteTeam} />
                    ))}
                </div>
            ) : (
                <div className="dayBox text-center">
                    <p className="text-danger lead">Employee data not found</p>
                </div>
            )}
            {/* </div> */}
        </div>
    );
};

export default ManageTeam;