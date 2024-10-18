import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Loading from './Loader';
import "./ParentStyle.css";
import PayslipUI from './payslip/PayslipUI';

export default function ViewAttendanceModel({ modelData, toggleView, openModal }) {
    const [viewPayslip, setViewPayslip] = useState(false);
    function handleViewPayslip() {
        setViewPayslip(!viewPayslip)
    }
    const renderAttendanceRows = () => {
        return Object.keys(modelData).map((key) => {
            // Exclude keys like "title", "__v", "employee", and "_id"
            if (["title", "__v", "employee", "_id"].includes(key)) {
                return null;
            }

            // Handle if the value is an object (assuming you want to show startingTime and endingTime)
            if (typeof modelData[key] === 'object' && modelData[key] !== null) {
                return (
                    <TableRow key={key}>
                        <TableCell>{key.replace(/([A-Z])/g, ' $1').trim().charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').trim().slice(1)}</TableCell>
                        {/* Check if the object has 'startingTime' and 'endingTime' */}
                        <TableCell>
                            {modelData[key].startingTime && modelData[key].endingTime
                                ? `${modelData[key].startingTime} - ${modelData[key].endingTime}`
                                : 'N/A'}
                        </TableCell>
                    </TableRow>
                );
            }

            // Handle non-object values
            return (
                <TableRow key={key}>
                    <TableCell>{key.replace(/([A-Z])/g, ' $1').trim().charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').trim().slice(1)}</TableCell>
                    <TableCell>{modelData[key] !== null && modelData[key] !== undefined ? modelData[key] : 'N/A'}</TableCell>
                </TableRow>
            );
        });

    };

    return (
        viewPayslip ? <PayslipUI payslipId={modelData._id} handleViewPayslip={handleViewPayslip} /> : (modelData ? (
            <Dialog open={openModal} onClose={toggleView} className='aa'>
                <DialogTitle className='text-center'>{modelData?.title}</DialogTitle>
                <div className="d-flex justify-content-end px-2">
                    <button className='btn btn-primary' onClick={handleViewPayslip} >View Payslip</button>
                </div>
                <DialogContent > {/* Use ref here */}
                    <TableContainer>
                        <Table>
                            <TableBody>
                                {renderAttendanceRows()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleView}>Close</Button>
                </DialogActions>
            </Dialog>
        ) : <Loading />)

    );
}
