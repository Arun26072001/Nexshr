import React from 'react';
import noInternet from "../imgs/no_internet.webp";
import { useNavigate } from 'react-router-dom';

export default function NoInternet() {
    const navigate = useNavigate()
    function pageReload() {
        navigate(-1)
    }
    return (
        <div className='leaveFormContainer'>
            <div className='leaveFormParent d-block align-content-center text-center'>
                <img src={noInternet} alt="internet connection lost img" className='noConnectionImg' />
                <h3 className='py-2'>
                    Network Disconnected
                </h3>
                <p className='py-2'>
                    Please check your network connection!
                </p>
                <button className='btn btn-primary' onClick={pageReload}>Reload</button>
            </div>
        </div>
    )
}
