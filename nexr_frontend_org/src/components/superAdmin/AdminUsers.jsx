import React, { useEffect, useState } from 'react';
import LeaveTable from '../LeaveTable';
import { Input } from 'rsuite';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { Skeleton } from '@mui/material';

const AdminUsers = ({ users, isLoading }) => {
    const [empName, setEmpName] = useState('');
    const [filteredEmps, setFilteredEmps] = useState([]);

    useEffect(() => {
        if (empName === "") {
            setFilteredEmps(users)
        } else {
            setFilteredEmps(users.filter((emp) => emp.name.includes(empName)))
        }
        return () => {
            setFilteredEmps(users)
        }
    }, [empName, users])

    return (
        <main className="p-4 w-100 main-container">
            <p className="titleText text-start px-3">All Users</p>
            <div className="col-lg-12">
                <div className="d-flex justify-content-end align-items-center px-3">
                    <Input size="lg" appearance="default" style={{ width: "250px" }} placeholder="Search By Name" onChange={setEmpName} />
                </div>
            </div>

            {
                isLoading ? <Skeleton
                    sx={{ bgcolor: 'grey.500' }}
                    variant="rectangular"
                    width={"100%"}
                    height={"50vh"}
                /> :
                    filteredEmps?.length > 0 ?
                        <LeaveTable data={filteredEmps} /> :
                        <NoDataFound message={"Users data not found"} />
            }
        </main>
    );
};

export default AdminUsers;
