import React, { useEffect, useState } from "react";
import EmpCard from "./EmpCard";
import axios from "axios";
import { toast } from "react-toastify";
import AssignEmp from "./AssignEmp";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditTeam from "./EditTeam";
import { Input, InputGroup } from "rsuite";
import { useNavigate } from "react-router-dom";
import NoDataFound from "./NoDataFound";
import Loading from "../Loader";

const ManageTeam = ({ whoIs }) => {
    const [teamObj, setTeamObj] = useState({
        teamName: "",
        employees: [],
        lead: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [searchTeam, setSearchTeam] = useState('');
    const [dom, reload] = useState(false);
    const [assignEmp, setAssignEmp] = useState(false);
    const [addTeam, setAddTeam] = useState(false);
    const [editTeamObj, setEditTeamObj] = useState(null); // Null indicates no team is being edited
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
        if (addTeam) {
            setEditTeamObj(null);  // Reset editTeamObj when toggling out of add/edit mode
        }
    };

    const toggleAssignEmp = () => {
        setAssignEmp(!assignEmp);
    };

    const setTeamName = (name) => {
        if (editTeamObj) {
            setEditTeamObj((prev) => ({
                ...prev,
                teamName: name
            }));
        } else {
            setTeamObj((prev) => ({
                ...prev,
                teamName: name
            }));
        }
    };

    const updateTeamObj = (emp) => {
        if (editTeamObj) {
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
            const res = await axios.delete(`${url}/api/team/${id}`, {
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
            const res = await axios.get(`${url}/api/team/${team._id}`, {
                headers: { authorization: token || "" }
            });
            setEditTeamObj(res.data);
            toggleAddTeam();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleSubmit = async () => {
        try {
            const newTeamObj = {
                ...teamObj,
                employees: teamObj.employees.map((emp) => emp._id)
            };

            const response = await axios.post(`${url}/api/team`, newTeamObj, {
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

    const handleSubmitEdit = async () => {
        try {
            const { _id, __v, ...object } = editTeamObj;
            const updatedTeamObj = {
                ...object,
                employees: editTeamObj.employees.map((emp) => emp._id)
            };

            const res = await axios.put(`${url}/api/team/${editTeamObj._id}`, updatedTeamObj, {
                headers: { authorization: token || "" }
            });

            toggleAssignEmp();
            toggleAddTeam();
            reloadUI();
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`${url}/api/team`, {
                    headers: { authorization: token || "" }
                });

                setTeams(res.data);
                setFilteredTeams(res.data);
                setIsLoading(false);
            } catch (err) {
                toast.error(err.message);
                if (err?.response?.status === 401) {
                    navigate("/admin/unauthorize");
                }
            }
        };

        fetchTeams();
    }, [dom]);

    return (
        isLoading ? <Loading /> :
            <div className="my-2">
                <button className="button my-2" onClick={toggleAddTeam}>
                    {addTeam ? "Cancel" : "Add a new team"}
                </button>

                <InputGroup inside style={{ width: "300px" }}>
                    <Input placeholder="Team Name" className="m-0" value={searchTeam} onChange={filterTeam} />
                    <InputGroup.Button className="m-auto">
                        <SearchRoundedIcon />
                    </InputGroup.Button>
                </InputGroup>

                {addTeam && (
                    <EditTeam
                        team={editTeamObj ? editTeamObj : teamObj}
                        setTeamName={setTeamName} // to update teamName
                        toggleAddTeam={toggleAddTeam}
                        toggleAssignEmp={toggleAssignEmp}
                    />
                )}

                {assignEmp && (
                    <AssignEmp
                        teams={teams}
                        handleSubmit={editTeamObj ? handleSubmitEdit : handleSubmit}
                        teamObj={editTeamObj ? editTeamObj : teamObj}
                        updateTeamObj={updateTeamObj}
                        toggleAssignEmp={toggleAssignEmp}
                    />
                )}

                {filteredTeams.length > 0 ? (
                    <div className="row d-flex justify-content-start">
                        {filteredTeams.map((team) => (
                            <EmpCard key={team._id} team={team} editTeam={editTeam} deleteTeam={deleteTeam} />
                        ))}
                    </div>
                ) : (
                    <NoDataFound message={"No teams found"} />
                )}
            </div>
    );
};

export default ManageTeam;
