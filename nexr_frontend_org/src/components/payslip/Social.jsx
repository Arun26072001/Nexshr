import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import NoDataFound from "./NoDataFound";
import { updateEmp } from "../ReuseableAPI";
import { useNavigate } from "react-router-dom";

const Social = ({ empObj, error, changeFetching }) => {
  const navigate = useNavigate();
  const [social, setSocial] = useState({});
  const [isDisabled, setIsDisabled] = useState(true);
  function addSocial(e) {
    const { name, value } = e.target;
    setSocial((pre) => ({
      ...pre,
      [name]: value
    }))
  }
  function handleCancel() {
    setSocial({
      facebook: empObj?.social?.facebook || "",
      twitter: empObj?.social?.twitter || "",
      instagram: empObj?.social?.instagram || ""
    });
  }

  useEffect(() => {
    setIsDisabled(Object.entries(social).every(
      ([key, value]) => value === "" || value === empObj?.social?.[key]
    ));
  }, [social])

  async function updateSocialEmp() {
    try {
      const updatedEmpValue = {
        ...empObj,
        social
      }

      const updateEmpData = await updateEmp(updatedEmpValue);
      toast.success(updateEmpData);
      changeFetching();

   } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
      toast.error(error);
    }
  }

  useEffect(() => {
    setSocial((pre) => ({
      ...pre,
      "facebook": empObj?.social?.facebook,
      "twitter": empObj?.social?.twitter,
      "instagram": empObj?.social?.instagram
    }))
  }, [empObj])


  return (
    error ? <NoDataFound message={error} /> :
      <div>
        <p className="payslipTitle">
          Social
        </p>

        <div className="socialParent">
          <div className="row mt-2">
            <div className="col-lg-3 col-12">
              Instagram
            </div>
          </div>
          <div className="row">
            <div className="col-lg-5 col-12">
              <input type="text" className="payrunInput" name="instagram" value={social?.instagram || ""} onChange={(e) => addSocial(e)} placeholder="Paste link here" />
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-lg-3 col-12">
              Twitter
            </div>
          </div>

          <div className="row">
            <div className="col-lg-5 col-12">
              <input type="text" className="payrunInput" name="twitter" value={social?.twitter || ""} onChange={(e) => addSocial(e)} placeholder="Paste link here" />
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-lg-3 col-12">
              Facebook
            </div>
          </div>
          <div className="row">
            <div className="col-lg-5 col-12">
              <input type="text" className="payrunInput" name="facebook" value={social?.facebook || ""} onChange={(e) => addSocial(e)} placeholder="Paste link here" />
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-lg-3 col-12">
              <div className="btnParent mx-auto">
                <button
                  className="outline-btn"
                  style={{ background: "#e0e0e0", border: "none" }}
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button className="button" disabled={isDisabled} onClick={updateSocialEmp}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
};

export default Social;
