import React, { useContext, useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom';
import { TimerStates } from './HRMDashboard';

export default function NavModelRouter({files }) {
    const params = useParams();
    const [selectedFile, setSelectedFile] = useState(params['*'] || files[0]);
    const [parentPath, setParentPath] = useState("");
    const {whoIs} = useContext(TimerStates);

    useEffect(() => {
        setParentPath(window.location.pathname.split("/")[2])
    }, [])
    return (
        <div className="payslipParent">
            {
                files.map((file) => {
                    return <NavLink to={`/${whoIs}/${parentPath}/${file}`} onClick={() => setSelectedFile(file)}>
                        <div className={`text-secondary ${selectedFile === file && "selected"}`}> {file[0]?.toUpperCase() + file.slice(1)}</div>
                    </NavLink>
                })
            }
        </div>
    )
}
