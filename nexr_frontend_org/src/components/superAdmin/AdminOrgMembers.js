// export default AdminOrgMembers
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

const AdminOrgMembers = ({ organizations }) => {
    const { organizationId } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10); // Default to 10 users per page

    // Find the current organization based on the organizationId
    const currentOrganization = organizations.find(org => org._id === organizationId);
    const members = currentOrganization?.members || []; // Safely handle undefined
    console.log(members)
    // Pagination calculations
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = members.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(members.length / usersPerPage);
    // Render the members table
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    return (
        <div className="p-4 w-full">
            <h1 className="text-2xl font-bold mb-4">{currentOrganization?.name} Members</h1>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="p-3">S.No</th>
                            <th className="p-3">User ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.length > 0 ? (
                            currentUsers.map((member, index) => (
                                <tr key={member.user._id} className="border-bottom" >
                                    <td className="p-3">{indexOfFirstUser + index + 1}</td>
                                    <td className="p-3">{member.user._id}</td>
                                    <td className="p-3">{member.user.username}</td>
                                    <td className="p-3">{member.user.email}</td>
                                    <td className="p-3">{member.role.RoleName}</td>
                                    <td className="p-3 text-center">
                                        <VisibilityRoundedIcon />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                    <span>
                        Showing{' '}
                        {members.length > 0 ? indexOfFirstUser + 1 : 0} to{' '}
                        {Math.min(indexOfLastUser, members.length)} of{' '}
                        {members.length} entries
                    </span>
                </div>
                <nav aria-label="Page navigation">
                    <ul className="pagination justify-content-center mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <li
                                key={index}
                                className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => handlePageChange(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                        <li
                            className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default AdminOrgMembers;
