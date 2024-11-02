import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import React, { useEffect, useState } from 'react';
import './SettingsStyle.css';
import axios from 'axios';
import Loading from '../Loader';
import { Input, InputGroup } from 'rsuite';
import { fetchAllEmployees, fetchRoles } from '../ReuseableAPI';
import { toast } from 'react-toastify';


const Permission = () => {
    const [employees, setEmployees] = useState([]);
    const [fullEmployees, setFullemployees] = useState([]);
    const names = ['Users', 'Roles', 'Direct Reports', 'Permissions'];
    const [roles, setRoles] = useState([]);
    const [empName, setEmpName] = useState("");
    // const url = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const getEmployees = async () => {
            try {
                const emps = await fetchAllEmployees();
                setEmployees(emps);
                setFullemployees(emps);
            } catch (err) {
                toast.error(err)
            }
        }
        getEmployees();
    }, [])

    useEffect(() => {
        const fetchEmpRoles = async () => {
            try {
                const rolesData = await fetchRoles();
                setRoles(rolesData);
            } catch (err) {
                console.log(err);
                toast.error(err?.response?.data?.message)
            }
        }
        fetchEmpRoles();
    }, [])

    function filterEmps(e) {
        setEmpName(e)
        if (e === "") {
            setEmployees(fullEmployees);
        } else if (e !== "") {
            setEmployees(fullEmployees.filter((emp) => emp.FirstName.includes(e)));
        }
    }
    console.log(employees);

    return (
        <div className="container">
            <h4>Permissions</h4>
            <p style={{ fontSize: "15px", color: "rgb(178 174 174)" }}>Assign or revoke for your employees</p>
            <div className="row">
                <div className="col-lg-4">
                    <InputGroup inside style={{ width: 300, marginBottom: 10 }}>
                        <InputGroup.Addon><SearchIcon /></InputGroup.Addon>
                        <Input placeholder='Find Name' value={empName} onChange={filterEmps} />
                        <InputGroup.Addon style={{ cursor: "pointer" }} >
                            <span onClick={() => setEmpName("")}>
                                <CloseIcon />
                            </span>
                        </InputGroup.Addon>
                    </InputGroup>
                </div>
            </div>

            {employees.length > 0 ? (
                <table className="table table-striped my-2">
                    <thead>
                        <tr className='text-center'>
                            {names.map((name, index) => (
                                <th key={index}>{name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp._id}> {/* Added key assuming _id is unique for each employee */}
                                <td>
                                    <div className="td-parent gap-1">
                                        <div className="nameHolder">
                                            {`${emp.FirstName[0]}${emp.LastName[0]}`}
                                        </div>
                                        {emp.FirstName} {emp.LastName} <br />
                                    </div>
                                </td>
                                <td>
                                    <select name="" id="" className="form-control">
                                        <option value={emp?.role[0]?._id} >{emp?.role[0]?.RoleName}</option>
                                        {roles.map((role) => (
                                            <option key={role._id} value={role._id}> {/* Added key */}
                                                {role.RoleName}
                                            </option>
                                        ))}
                                    </select>
                                    {/* <div className='d-flex justify-content-center align-items-center'>
                                        <button className='button m-0'>Edit accessing Permissions</button>
                                    </div> */}
                                </td>
                                <td>
                                    <div className='td-parent gap-2'>
                                        <input type="checkbox" className="styleRadio" />
                                        Payroll
                                    </div>
                                </td>
                                <td>
                                    <div className='td-parent gap-2'>
                                        <input type="checkbox" className="styleRadio" />
                                        Payroll
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <Loading />
            )}

        </div>


    )
};

export default Permission;
