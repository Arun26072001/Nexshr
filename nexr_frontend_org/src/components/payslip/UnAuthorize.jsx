import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { TimerStates } from './HRMDashboard';

export default function UnAuthorize() {
    const {whoIs} = useContext(TimerStates);
    const navigate = useNavigate();
    
    return (
        <div className='h-100 d-block align-content-center text-center  '>
            <h3 className='my-2'>401</h3>
            <p className='my-2'>You access this page!</p>

            <button onClick={()=>navigate(-1)} className='button' >Get Back</button>
        </div>          
    )
}
