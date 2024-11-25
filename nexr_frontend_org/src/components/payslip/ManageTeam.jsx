import React, { useContext, useEffect, useState } from "react";
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
import { TimerStates } from "./HRMDashboard";

const ManageTeam = () => {
    const {whoIs} = useContext(TimerStates);
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

    const changeTeamObj = (e) => {
        const {name, value} = e.target;
        if (editTeamObj) {
            setEditTeamObj((prev) => ({
                ...prev,
                [name]: value
            }));
        } else {
            setTeamObj((prev) => ({
                ...prev,
                [name]: value
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
                   Authorization: `Bearer ${token}` || ""
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
                Authorization: `Bearer ${token}` || ""
            });
            setEditTeamObj(res.data);
            toggleAddTeam();
        } catch (err) {
            toast.error(err?.response?.data?.message);
        }
    };

    const handleSubmit = async () => {
        try {
            const newTeamObj = {
                ...teamObj,
                employees: teamObj.employees.map((emp) => emp._id)
            };

            const response = await axios.post(`${url}/api/team`, newTeamObj, {
                Authorization: `Bearer ${token}` || ""
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
                Authorization: `Bearer ${token}` || ""
            });

            toggleAssignEmp();
            toggleAddTeam();
            reloadUI();
            toast.success(res.data.message);
            console.log(res.data);
            
        } catch (err) {
            console.log(err);
            
            toast.error(err.message);
        }
    };

    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`${url}/api/team`, {
                    Authorization: `Bearer ${token}` || ""
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
                        setTeamName={changeTeamObj} // to update teamName
                        toggleAddTeam={toggleAddTeam}
                        toggleAssignEmp={toggleAssignEmp}
                    />
                )}

                {assignEmp && (
                    <AssignEmp
                        teams={teams}
                        handleSubmit={editTeamObj ? handleSubmitEdit : handleSubmit}
                        teamObj={editTeamObj ? editTeamObj : teamObj}
                        setTeamLead={changeTeamObj}
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
