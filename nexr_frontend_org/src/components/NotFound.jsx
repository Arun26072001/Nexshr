import React from 'react';
import companyLogo from "../imgs/webnexs_logo.webp";
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <>
            <div className='leaveFormContainer'>
                <div className='leaveFormParent d-block align-content-center' style={{ width: "400px", height: "fit-content" }}>
                    <img src={companyLogo} alt='Nexshr' style={{ margin: "auto" }} width={50} height={50} />
                    <p className='payslipTitle p-0'>
                        Sorry, we don't have anything to show you on this page.
                    </p>
                    <p className='py-2' style={{ fontSize: "13px", color: "gray" }}><b>This could be because:</b></p>
                    <ul style={{ listStyle: "inherit", fontSize: "13px", color: "gray" }}>
                        <li>The item you're looking for has been deleted</li>
                        <li>You don't have access to it</li>
                        <li>You clicked a broken link</li>
                    </ul>
                    <p className="py-2" style={{ fontSize: "13px", color: "gray" }}>
                        If you believe you should have access to this page, please contact your HR administrator and ask them to add you to it.
                    </p>
                </div>
            </div>
            <div className="text-center my-1">
                <button className='button' onClick={() => navigate(-1)} >Get back</button>
            </div>
        </>
    )
}
