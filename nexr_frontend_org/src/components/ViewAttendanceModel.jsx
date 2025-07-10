import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Loading from './Loader';
import "./payslip/layout/ParentStyle.css";

export default function ViewAttendanceModel({ modelData, toggleView, openModal }) {
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
                            {modelData[key]?.startingTime?.length && modelData[key]?.endingTime?.length
                                ? `${modelData[key]?.startingTime[0]} - ${modelData[key]?.endingTime.at(-1)}`
                                : 'N/A'}
                        </TableCell>
                    </TableRow>
                );
            }

            // Handle non-object values
            return (
                <TableRow key={key}>
                    <TableCell>{key.replace(/([A-Z])/g, ' $1').trim().charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').trim().slice(1)}</TableCell>
                    <TableCell>{![undefined, null].includes(modelData[key]) ? (key === "date" ? modelData[key].split("T")[0] : modelData[key]) : "N/A"}</TableCell>
                </TableRow>
            );
        });
    };

    return (
        (modelData ? (
            <Dialog open={openModal} onClose={toggleView} className='aa'>
                <DialogTitle className='text-center'>{modelData?.title}</DialogTitle>

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
        ) : <Loading height="80vh" />)
    );
}
