import React from "react";
import Phone from "../../asserts/phone.svg";

const Contact = (props) => {
  return (
    <div>
      <div className="payslipTitle">
        Contact
      </div>

      <div className="contactParent">
  <div className="d-flex align-items-center justify-content-between p-2">
    <div className="d-flex align-items-center gap-2">
      <img src={Phone} alt="" />
      <span>Product Manager</span>
    </div>
    <div className="text-primary ms-3">+7 (903) 679-96-15</div>
  </div>
  <div className="d-flex align-items-center justify-content-between p-2">
    <div className="d-flex align-items-center gap-2">
      <img src={Phone} alt="" />
      <span>Chief Executive Officer</span>
    </div>
    <div className="text-primary ms-3">+7 (903) 679-96-15</div>
  </div>
  <div className="d-flex align-items-center justify-content-between p-2">
    <div className="d-flex align-items-center gap-2">
      <img src={Phone} alt="" />
      <span>Human Resource Manager</span>
    </div>
    <div className="text-primary ms-3">+7 (903) 679-96-15</div>
  </div>
  <div className="d-flex align-items-center justify-content-between p-2">
    <div className="d-flex align-items-center gap-2">
      <img src={Phone} alt="" />
      <span>Frontend Developer</span>
    </div>
    <div className="text-primary ms-3">+7 (903) 679-96-15</div>
  </div>
</div>


      <div className="row">
        <div className="col-lg-3 col-12">
          <div className="btnParent mx-auto">
            <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
            <button className="button">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Contact;
