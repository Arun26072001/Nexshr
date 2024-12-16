import React from "react";
// import { Link } from "react-router-dom";
import './header.css';
import Bipay from "../../../image/bipay.png"; // Adjust the path accordingly
import { MdLanguage } from "react-icons/md";
import { SlBell } from "react-icons/sl";
import Avatar from "../../../image/avatar.png";

function Header() {
  return (

    <div>
      <section>
        <div className="webnxs">
            <div className="col-lg-12 row">
              <div className="col-lg-6 col-md-6 col-sm-6 col-6">
                <img src={Bipay} className="logo" />
                {/* <span className="logoname"></span> */}
              </div>

              {/* <div className="col-lg-4 col-md-4 col-sm-4 col-4">
                <div className="searchParent">
                  <input type="text" placeholder="Search..." />

                  <div className="searchicon">
                    <img src={Searchicon} className="searchlogo" />
                  </div>
                </div>
              </div> */}

              <div className="profile col-lg-6 col-md-6 col-sm-6 col-6 text-end">
                 <span className="lg ms-5"><MdLanguage /></span>
                 <span className="lang ms-2">EN</span>
                 <span className="bell ms-3"><SlBell /></span>
                 <img src={Avatar} className="avatar ms-3" />
              </div>

            </div>
          </div>
      </section>
    </div>


  );
}

export default Header;


