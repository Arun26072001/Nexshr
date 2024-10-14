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
    let {name, value} = e.target;
    if(value == 0){
      value = 1;
    } else if(value == 1){
      value = 0;
    }
    setRadioOption({
      ...RadioOption,
      [name]: Number(value)
    })
  };

  function handleText(e){
    setTextAreaLen(e.target.value.length)
    setTextAreaTxt(e.target.value)
  }
  return (
    <div className="container">
        <h4 className="my-2">
          Send an alert to your employees
        </h4>
        <p className="styleText">
            Send important messages to your employees. your messages will be send as a push notification to users with our mobile app installed.
            Web users will see the message in the notification menu when they log in. There are limited characters available for messages. 
            If you need to include a link, conside using a URL shortening service such as Bitly.
        </p>

         <div className="row">
          <div className="col-lg-12">
          <div className="box active" style={{border: "none"}}>
            <form action="">
            <textarea name=""
             className="form-control" 
             placeholder="Type your message here" 
             onChange={handleText}
             maxLength={174}>
              {textAreaTxt}
            </textarea>
           
            <div className="d-flex justify-content-between">
              <span className="styleText my-2">
                {textAreaLen}/174 
              </span>
              <span className="my-2">
                <input type="submit" className="button" disabled={!textAreaLen} placeholder="Send notification" />
              </span>
            </div>
            </form>
          </div>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="mb-2">
            Notification prefernces
          </h4>
          <p className="styleText">
              change the settings for the notifications you recevie about employees.
              These changes will be apllied to emails and mobile app push messages you receive.
          </p>
        </div>

        <div className="row my-3">
          <div className="col-lg-8">
            <p>
              <b>Employee requests</b>
            </p>
            <p className="styleText my-2">
              We can send you notifications when requests are: 
            </p>
            <ul>
              <li>Raised</li>
              <li>Deleted</li>
              <li>Updated</li>
            </ul>
          </div>

           <RadioButtons RadioOption={RadioOption.EmpRequestsAccess} name={"EmpRequestsAccess"} handleRadioOption={handleRadioOption} title={"Receive notificatios from..."} />
        </div>

        <div className="row my-3">
          <div className="col-lg-8">
            <p className="my-2">
              <b>Key dates</b>
            </p>
            <p className="mb-2 styleText">Key dates which may affect a staff member's employment 
              eligibilty. These dates include: </p>

              <ul>
                <li>DBS check follow-up</li>
                <li>Visa expiry</li>
                <li>Passport expiry</li>
                <li>End of fixed-term contract</li>
                <li>End of probation</li>
                <li>Driving licence expiry</li>
              </ul>
          </div>
         <RadioButtons RadioOption={RadioOption.KeyDatesAccess} name={"KeyDatesAccess"} handleRadioOption={handleRadioOption} title={"Receive notificatios from..."} /> 
        </div>

        <div className="row my-3">
          <div className="col-lg-8">
            <p>
              <b>Document follow up</b>
            </p>
            <p className="mb-2 styleText">
              We can remain you when documents are due a follow up
            </p>
          </div>
           <RadioButtons RadioOption={RadioOption.DocFollowUpAccess} name={"DocFollowUpAccess"} handleRadioOption={handleRadioOption} title={"Document follow up"} />
        </div>

        <div className="row my-3">
          <div className="col-lg-8">
            <p>
              <b>
                Personal and contact information
              </b>
            </p>
            <p className="styleText">
              We can notify you when you employees update their 
              personal or contact information
            </p>
          </div>
           <RadioButtons RadioOption={RadioOption.PersonalInfoAccess} name={"PersonalInfoAccess"} handleRadioOption={handleRadioOption} title={"Personal and contact details"} /> 
        </div>

        <div className="row my-3">
          <div className="col-lg-8">
            <p>
              <b>Special occansions</b>
            </p>
            <p className="mb-2">
              We can remind you about special occansions. such as: 
            </p>
            <ul>
              <li>Work anniversaries</li>
              <li>Birthdays</li>
            </ul>
          </div>
          
         <RadioButtons RadioOption={RadioOption.SpecialOccansionsAccess} name={"SpecialOccansionsAccess"} handleRadioOption={handleRadioOption} title={"Recevie notifications from..."} /> 
        </div> 
    </div>
  )
};

export default Notification;
