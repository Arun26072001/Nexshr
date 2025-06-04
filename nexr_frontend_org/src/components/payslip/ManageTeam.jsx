import { useContext, useEffect, useState } from "react";
import EmpCard from "./EmpCard";
import axios from "axios";
import { toast } from "react-toastify";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Input, InputGroup } from "rsuite";
import NoDataFound from "./NoDataFound";
import Loading from "../Loader";
import { EssentialValues } from "../../App";
import CommonModel from "../Administration/CommonModel";
import { jwtDecode } from "jwt-decode";

const ManageTeam = () => {
    const url = process.env.REACT_APP_API_URL;
    const { data, whoIs } = useContext(EssentialValues);
    const { token, _id } = data;
    const [teamObj, setTeamObj] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [searchTeam, setSearchTeam] = useState('');
    const [dom, reload] = useState(false);
    const [addTeam, setAddTeam] = useState(false);
    const [employees, setEmployees] = useState([]); // Null indicates no team is being edited
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [leads, setLeads] = useState([]);
    const [heads, setHeads] = useState([]);
    const [managers, setManagers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [hrs, setHrs] = useState([]);
    const [isChangingTeam, setIsChangingTeam] = useState(false);
    const { isTeamHead, isTeamLead, isTeamManager } = jwtDecode(token);

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
            setTeamObj({});  // Reset editTeamObj when toggling out of add/edit mode
        }
    };

    const changeTeamObj = (value, name) => {
        setTeamObj((prev) => ({
            ...prev,
            [name]: value
        }));
    };
    

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${url}/api/employee/all`, {
                    headers: {
                        Authorization: token
                    }
                });
                setEmployees(res.data.map((emp) => ({
                    label: emp.FirstName[0] + emp.FirstName.slice(1) + " " + emp.LastName,
                    value: emp._id
                })));

            } catch (err) {
                console.log(err);
            }
        };
        fetchEmployees();
    }, []);

    const reloadUI = () => {
        reload(!dom);
    };

    const deleteTeam = async (id) => {
        try {
            const res = await axios.delete(`${url}/api/team/${id}`, {
                headers: {
                    Authorization: `${token}` || ""
                }
            });

            toast.success(res.data.message);
            reloadUI();
        } catch (err) {
            toast.error(err.response.data.error);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsChangingTeam(true);
            const response = await axios.post(`${url}/api/team/${_id}`, teamObj, {
                headers: {
                    Authorization: token || ""
                }
            });

            toast.success(response.data.message);
            toggleAddTeam();
            setTeamObj({})
            reloadUI();
        } catch (err) {
            toast.error(err.response.data.error);
        } finally {
            setIsChangingTeam(false)
        }
    };

    console.log(teamObj);
    
    const handleSubmitEdit = async () => {
        try {
            setIsChangingTeam(true);
            const res = await axios.put(`${url}/api/team/${teamObj._id}`, teamObj, {
                headers: {
                    Authorization: token || ""
                }
            });

            toggleAddTeam();
            reloadUI();
            toast.success(res.data.message);
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.error);
        } finally {
            setIsChangingTeam(false);
        }
    };

    async function fetchLeads() {
        try {
            const res = await axios.get(`${url}/api/employee/team/lead`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setLeads(res.data.map((emp) => ({
                label: emp.FirstName + " " + emp.LastName,
                value: emp._id
            })));
        } catch (error) {
            console.log(error.response.data.error);
        }
    }

    async function fetchHeads() {
        try {
            const res = await axios.get(`${url}/api/employee/team/head`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setHeads(res.data.map((emp) => ({
                label: emp.FirstName + " " + emp.LastName,
                value: emp._id
            })));
        } catch (error) {
            console.log(error.response.data.error);
        }
    }

    async function fetchManagers() {
        try {
            const res = await axios.get(`${url}/api/employee/team/manager`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setManagers(res.data.map((emp) => ({
                label: emp.FirstName + " " + emp.LastName,
                value: emp._id
            })));
        } catch (error) {
            console.log(error.response.data.error);
        }
    }

    async function fetchHr() {
        try {
            const res = await axios.get(`${url}/api/employee/team/hr`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setHrs(res.data.map((emp) => ({
                label: emp.FirstName + " " + emp.LastName,
                value: emp._id
            })));
        } catch (error) {
            console.log(error.response.data.error);
        }
    }

    async function fetchAdmins() {
        try {
            const res = await axios.get(`${url}/api/employee/team/admin`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setAdmins(res.data.map((emp) => ({
                label: emp.FirstName + " " + emp.LastName,
                value: emp._id
            })));
        } catch (error) {
            console.log(error.response.data.error);
        }
    }

    async function fetchEmpHasTeams() {
        try {
            setIsLoading(true);
            const who = isTeamHead ? "head" : isTeamLead ? "lead" : "manager";
            const res = await axios.get(`${url}/api/team/${who}/${_id}`, {
                headers: {
                    Authorization: `${token}` || ""
                }
            });
            setTeams(res.data);
            setFilteredTeams(res.data);
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.error);
        } finally {
            setIsLoading(false);
        }
    }

    function handleEditTeam(team) {
        setTeamObj(team);
        toggleAddTeam();
    }

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setIsLoading(true);
                const res = await axios.get(`${url}/api/team`, {
                    headers: {
                        Authorization: `${token}` || ""
                    }
                });
                setTeams(res.data);
                setFilteredTeams(res.data);
            } catch (err) {
                console.log(err);

                toast.error(err.response.data.error);
            } finally {
                setIsLoading(false);
            }
        };
        if (["admin", "hr"].includes(whoIs)) {
            fetchTeams();
        } else if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
            fetchEmpHasTeams()
        }

    }, [dom]);

    useEffect(() => {
        fetchHeads();
        fetchLeads();
        fetchManagers();
        fetchAdmins();
        fetchHr();
    }, [])

    return (
        isLoading ? <Loading height="80vh" /> :
            <div className="my-2">
                <div className="d-flex gap-2">
                    <InputGroup inside style={{ width: "300px" }} size="lg">
                        <Input placeholder="Team Name" className="m-0" value={searchTeam} onChange={filterTeam} />
                        <InputGroup.Button className="m-auto">
                            <SearchRoundedIcon />
                        </InputGroup.Button>
                    </InputGroup>
                    {
                        ["admin", "hr"].includes(whoIs) &&
                        <button className="button" onClick={toggleAddTeam}>
                            {addTeam ? "Cancel" : "Add a new team"}
                        </button>
                    }
                </div>

                {addTeam && (
                    <CommonModel type="Team"
                        isAddData={addTeam}
                        changeData={changeTeamObj}
                        editData={handleSubmitEdit}
                        leads={leads}
                        heads={heads}
                        managers={managers}
                        admins={admins}
                        hrs={hrs}
                        addData={handleSubmit}
                        dataObj={teamObj}
                        modifyData={toggleAddTeam}
                        employees={employees}
                        isWorkingApi={isChangingTeam}
                    />
                )}

                {filteredTeams.length > 0 ? (
                    <div className="row d-flex justify-content-start">
                        {filteredTeams.map((team) => (
                            <EmpCard key={team._id} team={team} editTeam={handleEditTeam} whoIs={whoIs} deleteTeam={deleteTeam} />
                        ))}
                    </div>
                ) : (
                    <NoDataFound message={"No teams found"} />
                )}
            </div>

    );
};

export default ManageTeam;
