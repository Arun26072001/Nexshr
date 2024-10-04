import React from "react";
import AddRoundedIcon from '@mui/icons-material/AddRounded';

const Social = (props) => {
  return (
    <div>
      <div className="payslipTitle">
        Social
      </div>

      <div className="socialParent">
        <div className="row ">
          <div className="col-lg-3 col-12">
            Instagram
          </div>
        </div>
        <div className="row">
          <div className="col-lg-5 col-12">
            <input type="text" className="payrunInput" placeholder="Paste link here" />
          </div>
        </div>

        <div className="row ">
          <div className="col-lg-3 col-12">
            Twitter
          </div>
        </div>

        <div className="row">
          <div className="col-lg-5 col-12">
            <input type="text" className="payrunInput" placeholder="Paste link here" />
          </div>
        </div>

        <div className="row ">
          <div className="col-lg-3 col-12">
            Facebook
          </div>
        </div>
        <div className="row">
          <div className="col-lg-5 col-12">
            <input type="text" className="payrunInput" placeholder="Paste link here" />
          </div>
        </div>

        <div className="row">
          <div className="col-lg-5 col-12">
            <div className="addInput mx-auto">
              <span><AddRoundedIcon /></span>
            </div>
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
    </div>
  )
};

export default Social;
