import * as React from 'react';
import "./Attendence.css";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Link } from 'react-router-dom';

// const columns = [
//   { id: 'profile', label: 'Profile', minWidth: 170 },
//   { id: 'punch_in', label: 'Punch In', minWidth: 100 },
//   {
//     id: 'geolocation',
//     label: 'Geolocation',
//     minWidth: 170,
//     align: 'center',
//     format: (value) => value.toLocaleString('en-US'),
//   },
//   {
//     id: 'punched_out',
//     label: 'Punched Out',
//     minWidth: 170,
//     align: 'center',
//     format: (value) => value.toLocaleString('en-US'),
//   },
//   {
//     id: 'behavior',
//     label: 'Behavior',
//     minWidth: 170,
//     align: 'center',
//     format: (value) => value.toFixed(2),
//   },
//   {
//     id: 'total_hours',
//     label: 'Total hours',
//     minWidth: 170,
//     align: 'center',
//     format: (value) => value.toFixed(2),
//   },
//   {
//     id: 'action',
//     label: 'Action',
//     minWidth: 170,
//     align: 'center',
//     format: (value) => (
//       <div className="editdropdown">
//         <span className="editdropdown-button">
//           <i className="fa fa-ellipsis-v" aria-hidden="true"></i>
//         </span>
//         <div className="editdropdown-menu">
//           <Link to={"/"}>
//             <span className="ms-2">Edit</span>
//           </Link>
//           <div className="commonActionPadding">
//             <span className="ms-2">Delete</span>
//           </div>
//         </div>
//       </div>
//     ),
//   },
// ];




const columns = [
  { id: 'profile', label: 'Profile', minWidth: 120, align: 'center' },
  { id: 'punch_in', label: 'Punch In', minWidth: 120, align: 'center'},
  { id: 'total_hours', label: 'Total Hours', minWidth: 120, align: 'center' },
  { id: 'department', label: 'Department', minWidth: 120, align: 'center' },
  { id: 'file', label: 'File', minWidth: 120, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 120, align: 'center' },
  {
    id: 'action',
    label: 'Action',
    minWidth: 120,
    align: 'center',
    format: (value) => (
      <div className="editdropdown">
        <span className="editdropdown-button">
          <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.1426 4.1399C11.9502 4.1399 11.5481 3.89935 11.5481 3.27273C11.5481 2.6461 11.9502 2.40556 12.1426 2.40556C12.335 2.40556 12.737 2.6461 12.737 3.27273C12.737 3.89935 12.335 4.1399 12.1426 4.1399ZM12.1426 12.1172C11.9502 12.1172 11.5481 11.8766 11.5481 11.25C11.5481 10.6234 11.9502 10.3828 12.1426 10.3828C12.335 10.3828 12.737 10.6234 12.737 11.25C12.737 11.8766 12.335 12.1172 12.1426 12.1172ZM12.1426 20.0944C11.9502 20.0944 11.5481 19.8539 11.5481 19.2273C11.5481 18.6006 11.9502 18.3601 12.1426 18.3601C12.335 18.3601 12.737 18.6006 12.737 19.2273C12.737 19.8539 12.335 20.0944 12.1426 20.0944Z" stroke="#404040" stroke-width="1.81111" stroke-linejoin="round" />
          </svg>

        </span>
        <div className="editdropdown-menu">
          <Link to={"/edit"}>
            <span className="ms-2">Edit</span>
          </Link>
          <div className="commonActionPadding">
            <span className="ms-2">Delete</span>
          </div>
        </div>
      </div>
    ),
  },
];

function createData(profile, punch_in, total_hours, department, file, status) {
  return { profile, punch_in, total_hours, department, file, status };
}

const rows = [
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Annette Black', ' 7/27/13', '11h 45m', 'Product', 'debitnote_0310.xlsx', 'Ready'),
  createData('Jeremy Neigh', ' 7/27/13', '11h 45m', 'Product', 'debitnote_0310.xlsx', 'Ready'),
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Jeremy Neigh','9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Jeremy Neigh', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('France', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Annette Black','9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Annette Black', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Annette Black', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
  createData('Annette Black', '9/23/16', '15h 40m', 'Design', 'DebitNoteMckee.jpg', 'Busy', "test"),
];

// const rows = [
//   { profile: 'Jeremy Neigh', punch_in: '9/23/16', total_hours: '15h 40m', department: 'Design', file: 'DebitNoteMckee.jpg', status: 'Busy', },
//   { profile: 'Annette Black', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '9/23/16', total_hours: '15h 40m', department: 'Design', file: 'DebitNoteMckee.jpg', status: 'Busy', },
//   { profile: 'Annette Black', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   { profile: 'Jeremy Neigh', punch_in: '7/27/13', total_hours: '11h 45m', department: 'Product', file: 'debitnote_0310.xlsx', status: 'Ready', },
//   // More rows...
// ];


export default function StickyHeadTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper className="profiles">
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns?.map((column) => (
                <TableCell
                  key={column?.id}
                  align={column?.align}
                  style={{ minWidth: column?.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                    {columns?.map((column) => {
                      const value = row[column?.id];
                      return (
                        <TableCell key={column?.id} align={column?.align}>
                          {/* {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value} */}

                          {column.format ? column.format(value) : value}

                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}