import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom';

export default function NavModelRouter({ whoIs, files }) {
    const [payslip, setPayslip] = useState(files[0]);
    const [parentPath, setParentPath] = useState("");
    

    useEffect(() => {
        setParentPath(window.location.pathname.split("/")[2])
    }, [])
    return (
        <div className="payslipParent">
            {
                files.map((file) => {
                    return <NavLink to={`/${whoIs}/${parentPath}/${file}`}>
                        <div className={`text-secondary ${payslip === file && "selected"}`} onClick={() => setPayslip(file)}>{file[0]?.toUpperCase()+file.slice(1,file.length)}</div>
                    </NavLink>
                })
            }
        </div>
    )
}
