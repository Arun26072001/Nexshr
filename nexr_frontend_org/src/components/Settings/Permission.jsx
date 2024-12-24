import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import React, { useEffect, useState } from 'react';
import './SettingsStyle.css';
import Loading from '../Loader';
import { Input, InputGroup } from 'rsuite';
import { fetchAllEmployees, fetchRoles } from '../ReuseableAPI';
import { toast } from 'react-toastify';
import NoDataFound from '../payslip/NoDataFound';


const Permission = () => {
    const [employees, setEmployees] = useState([]);
    const [fullEmployees, setFullemployees] = useState([]);
    const names = ['Users', 'Roles', 'Direct Reports', 'Permissions'];
    const [roles, setRoles] = useState([]);
    const [empName, setEmpName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const getEmployees = async () => {
            setIsLoading(true);
            try {
                const emps = await fetchAllEmployees();
                setEmployees(emps);
                setFullemployees(emps);

            } catch (err) {
                toast.error(err)
            }
            setIsLoading(false);
        }
        getEmployees();
    }, [])

    useEffect(() => {
        const fetchEmpRoles = async () => {
            setIsLoading(true);
            try {
                const rolesData = await fetchRoles();
                setRoles(rolesData);

            } catch (err) {
                console.log(err);
                toast.error(err?.response?.data?.message)
            }
            setIsLoading(false);
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

    return (
        <div className="container">
            <h5>PERMISSIONS</h5>
            <p style={{ fontSize: "15px", color: "rgb(178 174 174)", marginTop: "10px" }}>Assign or revoke for your employees</p>
            <div className="row">
                <div className="col-lg-4 mt-2">
                    <InputGroup inside style={{ width: 300, marginBottom: 10 }}>
                        <InputGroup.Addon><SearchIcon /></InputGroup.Addon>
                        <Input placeholder="Search user's names" value={empName} onChange={filterEmps} style={{ marginTop: "0", width: "100%", padding: "-8px" }} />
                        <InputGroup.Addon style={{ cursor: "pointer" }} >
                            <span onClick={() => setEmpName("")}>
                                <CloseIcon />
                            </span>
                        </InputGroup.Addon>
                    </InputGroup>
                </div>
            </div>
            {
                isLoading ? <Loading /> :
                    employees.length > 0 ? (
                        <table className="table table-striped my-4">
                            <thead>
                                <tr className='text-center'>
                                    {names.map((name, index) => (
                                        <th key={index}>{name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees?.map((emp) => (
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
                             
                                        </td>
                                        <td>
                                            <div className='td-parent gap-2 d-flex justify-content-center text-secondary'>
                                                {emp?.role[0]?.RoleName === "Admin" ? "everyone" : emp?.role[0]?.RoleName === "Human Resource" ? "Select People" : null}
                                            </div>
                                        </td>
                                        <td>
                                            <div className='td-parent gap-2' title='People with this additional permission level can access the payroll navigator in order to view and amend payroll information including salary and run payroll reports for the entire company.'>
                                                <input type="checkbox" className="styleRadio" checked={emp?.role[0]?.RoleName === "Admin" ? true : false} />
                                                Payroll
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <NoDataFound message={"Employees of role and permission Data not found!"} />
                    )
            }

        </div>


    )
};

export default Permission;
