import React, { useContext, useEffect, useState } from "react";
import EmpCard from "./EmpCard";
import axios from "axios";
import { toast } from "react-toastify";
import AssignEmp from "./AssignEmp";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Input, InputGroup } from "rsuite";
import NoDataFound from "./NoDataFound";
import Loading from "../Loader";
import { EssentialValues } from "../../App";
import CommonModel from "../Administration/CommonModel";

const ManageTeam = () => {
    const [teamObj, setTeamObj] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [searchTeam, setSearchTeam] = useState('');
    const [dom, reload] = useState(false);
    const [assignEmp, setAssignEmp] = useState(false);
    const [addTeam, setAddTeam] = useState(false);
    const [editTeamObj, setEditTeamObj] = useState(null); // Null indicates no team is being edited
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [leads, setLeads] = useState([]);
    const [heads, setHeads] = useState([]);
    const [managers, setManagers] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const { token } = data;

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

    const changeTeamObj = (value, name) => {
        console.log(value, name);

        setTeamObj((prev) => ({
            ...prev,
            [name]: value
        }));
        // if (editTeamObj) {
        //     setEditTeamObj((prev) => ({
        //         ...prev,
        //         [name]: value
        //     }));
        // } else {

        // }
    };
    

    const updateTeamObj = (emp) => {
        // if (editTeamObj) {
        //     setEditTeamObj((prev) => {
        //         const updatedEmployees = prev.employees.includes(emp)
        //             ? prev.employees.filter(e => e._id !== emp._id)
        //             : [...prev.employees, emp];

        //         return {
        //             ...prev,
        //             employees: updatedEmployees
        //         };
        //     });
        // } else {
            setTeamObj((prev) => {

                let updatedEmployees;
                if(prev?.employees?.length){
                    updatedEmployees = prev?.employees?.includes(emp._id)
                        ? prev.employees.filter(e => e._id !== emp._id)
                        : [...prev?.employees, emp];
                }else{
                   updatedEmployees = [emp]
                }

                return {
                    ...prev,
                    ["employees"]: updatedEmployees
                };
            });
        // }
    };


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
            toast.error(err.message);
        }
    };

    const editTeam = async (team) => {
        try {
            const res = await axios.get(`${url}/api/team/${team._id}`,
                {
                    headers: {
                        Authorization: `${token}` || ""
                    }
                }
            );
            console.log(res.data);
            
            setTeamObj(res.data);
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
                headers: {
                    Authorization: `${token}` || ""
                }
            });

            toggleAssignEmp();
            toggleAddTeam();
            setTeamObj({})
            reloadUI();
            toast.success(response.data.message);
        } catch (err) {
            toast.error(err.response.data.error);
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
                headers: {
                    Authorization: `${token}` || ""
                }
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
            console.log(error);

            toast.error(error.repsonse.data.error)
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
            toast.error(error.repsonse.data.error)
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
            toast.error(error.repsonse.data.error)
        }
    }


    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
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
            }
            setIsLoading(false);
        };

        fetchTeams();
        fetchHeads();
        fetchLeads();
        fetchManagers();
    }, [dom]);

    return (
        isLoading ? <Loading /> :
            <div className="my-2">
                <div className="d-flex gap-2">
                    <InputGroup inside style={{ width: "300px" }}>
                        <Input placeholder="Team Name" className="m-0" value={searchTeam} onChange={filterTeam} />
                        <InputGroup.Button className="m-auto">
                            <SearchRoundedIcon />
                        </InputGroup.Button>
                    </InputGroup>
                    <button className="button" onClick={toggleAddTeam}>
                        {addTeam ? "Cancel" : "Add a new team"}
                    </button>
                </div>

                {addTeam && (
                    <CommonModel type="Team" leads={leads}
                        isAddData={addTeam}
                        changeData={changeTeamObj}
                        toggleAssignEmp={toggleAssignEmp}
                        heads={heads}
                        dataObj={teamObj}
                        managers={managers}
                        modifyData={toggleAddTeam}
                        />
                )}

                {assignEmp && (
                    <AssignEmp
                        teams={teams}
                        handleSubmit={editTeamObj ? handleSubmitEdit : handleSubmit}
                        teamObj={teamObj}
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
