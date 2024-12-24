import React, { useState } from "react";
import { toast } from "react-toastify";
import NoDataFound from "./NoDataFound";
import { updateEmp } from "../ReuseableAPI";

const Social = ({ empObj, error }) => {
  const [social, setSocial] = useState({});

  function addSocial(e) {
    const { name, value } = e.target;
    setSocial((pre) => ({
      ...pre,
      [name]: value
    }))
  }


  async function updateSocialEmp() {
    try {
      const updatedEmpValue = {
        ...empObj,
        social
      }
      const updateEmpData = await updateEmp(updatedEmpValue);
      toast.success(updateEmpData);
    } catch (error) {
      toast.error(error);
    }
  }

  return (
    error ? <NoDataFound message={error} /> :
      <div>
        <p className="payslipTitle">
          Social
        </p>

        <div className="socialParent">
          <div className="row ">
            <div className="col-lg-3 col-12">
              Instagram
            </div>
          </div>
          <div className="row">
            <div className="col-lg-5 col-12">
              <input type="text" className="payrunInput" name="instagram" value={empObj?.social?.instagram || social?.instagram || ""} onChange={(e) => addSocial(e)} placeholder="Paste link here" />
            </div>
          </div>

          <div className="row ">
            <div className="col-lg-3 col-12">
              Twitter
            </div>
          </div>

          <div className="row">
            <div className="col-lg-5 col-12">
              <input type="text" className="payrunInput" name="twitter" value={empObj?.social?.twitter || social?.twitter || ""} onChange={(e) => addSocial(e)} placeholder="Paste link here" />
            </div>
          </div>

          <div className="row">
            <div className="col-lg-3 col-12">
              Facebook
            </div>
          </div>
          <div className="row">
            <div className="col-lg-5 col-12">
              <input type="text" className="payrunInput" name="facebook" value={empObj?.social?.facebook || social?.facebook || ""} onChange={(e) => addSocial(e)} placeholder="Paste link here" />
            </div>
          </div>

          <div className="row">
            <div className="col-lg-3 col-12">
              <div className="btnParent mx-auto">
                <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
                <button className="button" onClick={updateSocialEmp}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
};

export default Social;
