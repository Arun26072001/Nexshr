import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Loading from './Loader';
import { toast } from 'react-toastify';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import "./ParentStyle.css";

export default function ViewAttendanceModel({ id, toggleView, openModal, totalHours }) {
    const [attendanceData, setAttendanceData] = useState({});
    const tableRef = useRef(null); // Reference to the table for PDF export
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");

    // Function to dynamically export the content of the modal as a PDF
    function exportPDF() {
        const input = tableRef.current; // Get the current table data
        html2canvas(input)
            .then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF();
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 295; // A4 height in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                pdf.save('Attendance_Details.pdf');
            })
            .catch((error) => {
                console.error('Error exporting PDF:', error);
            });
    }

    useEffect(() => {
        async function fetchAttendanceData() {
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
                    toast.error(err?.response?.data?.error);
                }
            }
        }
        fetchAttendanceData();
    }, []);

    const renderAttendanceRows = () => {
        return Object.keys(attendanceData).map((key) => {
            if (typeof attendanceData[key] === 'object') {
                return (
                    <TableRow key={key}>
                        <TableCell>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                        <TableCell>{attendanceData[key]?.startingTime} - {attendanceData[key]?.endingTime}</TableCell>
                    </TableRow>
                );
            } else {
                return (
                    <TableRow key={key}>
                        <TableCell>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                        <TableCell>{attendanceData[key]}</TableCell>
                    </TableRow>
                );
            }
        });
    };

    return (
        attendanceData ? (
            <Dialog open={openModal} onClose={toggleView} className='aa'>
                <DialogTitle className='text-center'>ATTENDANCE DETAILS</DialogTitle>
                <div className="d-flex justify-content-end px-2">
                    <button className='btn btn-primary' onClick={exportPDF}>Export PDF</button>
                </div>
                <DialogContent ref={tableRef}> {/* Use ref here */}
                    <TableContainer>
                        <Table>
                            <TableBody>
                                {renderAttendanceRows()}
                                <TableRow>
                                    <TableCell>Total Hours</TableCell>
                                    <TableCell>{totalHours[id]}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleView}>Close</Button>
                </DialogActions>
            </Dialog>
        ) : <Loading />
    );
}
