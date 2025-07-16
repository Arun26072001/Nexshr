import React from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ReportRoundedIcon from '@mui/icons-material/ReportRounded';
import DangerousRoundedIcon from '@mui/icons-material/DangerousRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import "./notificationBox.css";

export default function NotificationBox({ type, header, content, closeBox }) {
    return (
        <div className={`boxContainer`} >
            <div className='boxHeader'>
                <div className='gap-1 d-flex align-items-center'>{
                    type === "warning" ? <ReportRoundedIcon fontSize='large' className={`text-${type}`} />
                        : type === "success" ? <CheckCircleRoundedIcon fontSize='large' className={`text-${type}`} />
                            : <DangerousRoundedIcon fontSize='large' className={`text-${type}`} />
                } <p className='payslipTitle'>{header}</p></div>
                <span style={{ cursor: "pointer" }} onClick={closeBox}><CloseRoundedIcon /></span>
            </div>
            <p className='my-2 sub_text' style={{ fontSize: "14px" }}>{content}</p>
        </div>
    )
}
