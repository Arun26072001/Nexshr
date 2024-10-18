import * as React from 'react';
import "./Attendence.css";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const Summarytable = ({ rows }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Punch In</TableCell>
            <TableCell>Punch Out</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Schedule Hour</TableCell>
            <TableCell>Leave Hour</TableCell>
            <TableCell>Work Hour</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toLocaleDateString()}</TableCell> {/* Adding dates incrementally for demonstration */}
              <TableCell>{row.punch_in}</TableCell>
              <TableCell>{row.punch_out}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.scheduleHour}</TableCell>
              <TableCell>{row.leaveHour}</TableCell>
              <TableCell>{row.workHour}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Summarytable;
