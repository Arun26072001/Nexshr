import React from 'react';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function DefinitionToggle({ title, handleShowNotification, instructions }) {
    return (
        <div className="payrunNotification m-3">
            <div className="w-100">
                <div className="d-flex">
                    <div className="d-flex align-items-center">
                        <WarningAmberRoundedIcon color="primary" fontSize="large" />
                        <div className="payslipTitle p-1">{title}</div>
                    </div>
                    <div style={{ marginLeft: "auto", cursor: "pointer" }} onClick={handleShowNotification}><CloseRoundedIcon color="primary" fontSize="large" /></div>
                </div>
                <ol>
                    {
                        // instructions.map((msg) => {
                        //     return <li>{msg}</li>
                        // })
                        instructions
                    }
                </ol>
            </div>
        </div>
    )
}
