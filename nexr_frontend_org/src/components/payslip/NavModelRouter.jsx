import React, { useContext, useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom';
import { TimerStates } from './HRMDashboard';
import { EssentialValues } from '../../App';

export default function NavModelRouter({files}) {
    const params = useParams();
    const [selectedFile, setSelectedFile] = useState(params['*'] || files[0]);
    const [parentPath, setParentPath] = useState("");
    const {whoIs} = useContext(TimerStates);
    const {data} = useContext(EssentialValues);

    useEffect(() => {
        setParentPath(window.location.pathname.split("/")[3])
    }, [])
    console.log(parentPath);
    
    return (
        <div className="payslipParent">
            {
                files.map((file) => {
                    return <NavLink to={`/${data.orgId}/${whoIs}/${parentPath}/${file}`} onClick={() => setSelectedFile(file)}>
                        <div className={`text-secondary ${selectedFile === file && "selected"}`}> {file[0]?.toUpperCase() + file.slice(1)}</div>
                    </NavLink>
                })
            }
        </div>
    )
}
