import { useNavigate } from "react-router-dom";
import "./leaveForm.css";
import { useContext } from "react";
import { EssentialValues } from "../App";

export default function ErrorUI({ image, title, description }) {
    const navigate = useNavigate();
    const { whoIs } = useContext(EssentialValues);

    return (
        <div className='leaveFormContainer'>
            <div className='leaveFormParent d-block align-content-center text-center'>
                <img src={image} alt="internet connection lost img" className='noConnectionImg' />
                <h3 className='py-2'>
                    {title}
                </h3>
                <p className='py-2'>
                    {description}
                </p>
                <button className="button" onClick={()=>navigate(`/${whoIs}`)} >Go to Dashboard</button>
            </div>
        </div>
    )
}
