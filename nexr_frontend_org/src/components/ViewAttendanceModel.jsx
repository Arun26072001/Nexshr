import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Loading from './Loader';
import { toast } from 'react-toastify';
import { jsPDF } from "jspdf";
import "./ParentStyle.css";

export default function ViewAttendanceModel({ id, toggleView, openModal, totalHours }) {
    const [attendanceData, setAttendanceData] = useState({});
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const pdfFile = new jsPDF();

    function exportPDF() {
        pdfFile.html("<h1>hello world</h1>");
        pdfFile.save("helloWorld.pdf");
    }

    useEffect(() => {
        async function fetchAttendanceData() {
            console.log(id);

            if (id) {
                try {
                    const data = await axios.get(`${url}/api/clock-ins/${id}`, {
                        headers: {
                            authorization: token || ""
                        }
                    });
                    setAttendanceData(data.data.timeData);
                } catch (err) {
                    console.log(err);
                    toast.error(err?.response?.data?.error)
                }
            }
        }
        fetchAttendanceData()
    }, [id])

    return (
        attendanceData ?
            <Dialog open={openModal} onClose={toggleView} className='aa'>
                <DialogTitle>ATTENDENCE DETAILS</DialogTitle>
                <div className="d-flex justify-content-end px-2">
                    <button className='btn btn-primary' onClick={exportPDF}>Export PDF</button>
                </div>
                <DialogContent>
                    <TableContainer>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Profile</TableCell>
                                    <TableCell>{attendanceData?.employee?.FirstName}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Punch In & Out</TableCell>
                                    <TableCell>
                                        {attendanceData?.login?.startingTime} - {attendanceData?.login?.endingTime}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Morning Break In & Out</TableCell>
                                    <TableCell>{attendanceData?.morningBreak?.startingTime} - {attendanceData?.morningBreak?.endingTime} </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Lunch In & Out</TableCell>
                                    <TableCell>{attendanceData?.lunch?.startingTime} - {attendanceData?.lunch?.endingTime}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Meeting In & Out</TableCell>
                                    <TableCell>{attendanceData?.meeting?.startingTime} - {attendanceData?.meeting?.endingTime}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Evening Break In & Out</TableCell>
                                    <TableCell>{attendanceData?.eveningBreak?.startingTime} - {attendanceData?.eveningBreak?.startingTime}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Behaviour</TableCell>
                                    <TableCell>{attendanceData?.behaviour}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Total Hour</TableCell>
                                    <TableCell>{totalHours[id]}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleView}>Close</Button>
                </DialogActions>
            </Dialog> : <Loading />

        // <p>kwhfkje</p>
    )
}
