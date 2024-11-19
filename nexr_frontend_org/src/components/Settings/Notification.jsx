import React, { useState } from "react"
import './SettingsStyle.css';
import RadioButtons from "./RadioButtons";
// import "../../EmployeeHub/style.css";
// import "../../NavBar.css";

const Notification = () => {
  const [textAreaLen, setTextAreaLen] = useState(0);
  const [textAreaTxt, setTextAreaTxt] = useState("");

  const [RadioOption, setRadioOption] = useState({
    EmpRequestsAccess: 0,
    KeyDatesAccess: 0,
    DocFollowUpAccess: 0,
    PersonalInfoAccess: 0,
    SpecialOccansionsAccess: 0
  })

  // Step 2: Handle button click events
  const handleRadioOption = (e) => {
    let { name, value } = e.target;
    if (value == 0) {
      value = 1;
    } else if (value == 1) {
      value = 0;
    }
    setRadioOption({
      ...RadioOption,
      [name]: Number(value)
    })
  };

  function handleText(e) {
    setTextAreaLen(e.target.value.length)
    setTextAreaTxt(e.target.value)
  }
  return (
    <div className="container">
      <h5 className="my-2">
        NOTIFICATIONS </h5>
      <div className="row mt-4">
        <div className="col-lg-12">
          <div className="box active"
            style={{ border: "none", boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.20), 0px 10px 30px rgba(0, 0, 0, 0.15)" }}>
            <form action="">
              {/* Informative Paragraphs */}
              <p className="mt-3">Send an alert to your employees</p>
              <p className="styleText">
                Send important messages to your employees. Your messages will be sent as a push notification to users with our mobile app installed.
                Web users will see the message in the notification menu when they log in. There are limited characters available for messages.
                If you need to include a link, consider using a URL shortening service such as Bitly.
              </p>

              {/* Textarea for Message */}
              <textarea
                name=""
                className="form-control mt-3"
                placeholder="Type your message here"
                onChange={handleText}
                maxLength={174}
              >
                {textAreaTxt}
              </textarea>

              {/* Character Counter and Submit Button */}
              <div className="d-flex justify-content-between">
                <span className="styleText my-2">{textAreaLen}/174</span>
                <span className="my-2">
                  <input
                    type="submit"
                    className="button"
                    disabled={!textAreaLen}
                    placeholder="Send notification"
                  />
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        <h4 className="mb-3">Notification Preferences</h4>
        <p className="styleText">
          Change the settings for the notifications you receive about employees. These changes will be applied to emails and mobile app push messages.
        </p>

        <div className="row my-3 align-items-center">
          <div className="col-lg-8">
            <p><b>Employee Requests</b></p>
            <p className="styleText my-2">
              We can send you notifications when requests are:
            </p>
            <ul className="styleText">
              <li>Raised</li>
              <li>Deleted</li>
              <li>Updated</li>
            </ul>
          </div>
          <div className="col-lg-4">
            <RadioButtons
              RadioOption={RadioOption.EmpRequestsAccess}
              name={"EmpRequestsAccess"}
              handleRadioOption={handleRadioOption}
            />
          </div>
        </div>

        <div className="row my-3 align-items-center">
          <div className="col-lg-8">
            <p><b>Key Dates</b></p>
            <p className="styleText mb-2">
              Key dates that may affect a staff member's employment eligibility. These dates include:
            </p>
            <ul className="styleText">
              <li>DBS check follow-up</li>
              <li>Visa expiry</li>
              <li>Passport expiry</li>
              <li>End of fixed-term contract</li>
              <li>End of probation</li>
              <li>Driving licence expiry</li>
            </ul>
          </div>
          <div className="col-lg-4">
            <RadioButtons
              RadioOption={RadioOption.KeyDatesAccess}
              name={"KeyDatesAccess"}
              handleRadioOption={handleRadioOption}
            />
          </div>
        </div>


        <div className="row my-3 align-items-center">
          <div className="col-lg-8">
            <p><b>Document Follow-Up</b></p>
            <p className="styleText mb-2">
              We can remind you when documents are due for follow-up.
            </p>
          </div>
          <div className="col-lg-4">
            <RadioButtons
              RadioOption={RadioOption.DocFollowUpAccess}
              name={"DocFollowUpAccess"}
              
            />
          </div>
        </div>


        <div className="row my-3 align-items-center">
          <div className="col-lg-8">
            <p><b>Personal and Contact Information</b></p>
            <p className="styleText">
              We can notify you when employees update their personal or contact information.
            </p>
          </div>
          <div className="col-lg-4">
            <RadioButtons
              RadioOption={RadioOption.PersonalInfoAccess}
              name={"PersonalInfoAccess"}
              handleRadioOption={handleRadioOption}
              
            />
          </div>
        </div>


        <div className="row my-3 align-items-center">
          <div className="col-lg-8">
            <p><b>Special Occasions</b></p>
            <p className="styleText mb-2">
              We can remind you about special occasions, such as:
            </p>
            <ul className="styleText">
              <li>Work anniversaries</li>
              <li>Birthdays</li>
            </ul>
          </div>
          <div className="col-lg-4">
            <RadioButtons
              RadioOption={RadioOption.SpecialOccasionsAccess}
              name={"SpecialOccasionsAccess"}
              handleRadioOption={handleRadioOption}
            />
          </div>
        </div>
      </div>

    </div>
  )
};

export default Notification;
