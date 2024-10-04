import React from "react";
import Phone from "../../asserts/phone.svg";

const Contact = (props) => {
  return (
    <div>
      <div className="payslipTitle">
        Contact
      </div>

      <div className="contactParent">
        <div className="d-flex justify-content-between p-2">
          <div><img src={Phone} alt={""} /> Product Manager</div>
          <div className="text-primary">+7 (903) 679-96-15</div>
        </div>
        <div className="d-flex justify-content-between p-2">
          <div><img src={Phone} alt={""} /> Chief Executive Officer</div>
          <div className="text-primary">+7 (903) 679-96-15</div>
        </div>
        <div className="d-flex justify-content-between p-2">
          <div><img src={Phone} alt={""} /> Human resource Manager</div>
          <div className="text-primary">+7 (903) 679-96-15</div>
        </div>
        <div className="d-flex justify-content-between p-2">
          <div><img src={Phone} alt={""} /> Frontend Developer</div>
          <div className="text-primary">+7 (903) 679-96-15</div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 col-12">
          <div className="btnParent mx-auto">
            <button className="button">Save</button>
            <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Contact;
