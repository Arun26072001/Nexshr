import React from "react";
import Phone from "../../asserts/phone.svg";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

const Contact = ({empObj}) => {
  
  return (
    <div>
      <p className="payslipTitle">
        Contact
      </p>

      <div className="contactParent">
        <div className="d-flex align-items-center justify-content-between p-2">
          <div className="d-flex align-items-center gap-2">
            <img src={Phone} alt="" />
            <span>Phone</span>
          </div>
          <div className="text-primary ms-3">+{empObj?.countryCode} {empObj?.phone}</div>
        </div>
        <div className="d-flex align-items-center justify-content-between p-2">
          <div className="d-flex align-items-center gap-2">
            {/* <img src={Phone} alt="" /> */}
            <EmailOutlinedIcon />
            <span>Email</span>
          </div>
          <div className="text-primary ms-3">{empObj?.Email}</div>
        </div>
      </div>
    </div>
  )
};

export default Contact;
