import React, { useContext, useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";
import { EssentialValues } from "../App";
import "./Login.css";
import Logo from "../imgs/webnexs_logo.webp";
import { useNavigate } from "react-router-dom";
// icons
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { Input, InputGroup } from "rsuite";

const Login = () => {
  const { handleSubmit, loading, pass, whoIs } = useContext(EssentialValues);
  const isLogin = localStorage.getItem("isLogin");
  const navigate = useNavigate();
  const [isView, setIsView] = useState(false);

  useEffect(() => {
    if (isLogin === "true") return navigate(`/${whoIs}`)
  }, [])

  return (
    <div className="container center-box">
      <div id="main-outer-div">
        {/* If you decide to include the logo later, uncomment the following div */}

        <div id="logo-div">
          <img
            id="logo-img"
            src={Logo}
            width={80}
            height={80}
            alt="Webnexs Logo"
            style={{ objectFit: "cover" }}
          />
        </div>

        <p className="title">Sign in</p>

        <div id="outer-login-form-div">
          <form onSubmit={handleSubmit}>
            <Input type="email" style={{ background: "#e8f0fe" }} className="my-2 border-0" size="lg" placeholder="Email" />
            <InputGroup size="lg" style={{ background: "#e8f0fe" }} inside className="my-2 border-0">
              <Input
                type={isView ? "text" : "password"}
                placeholder="Password"
                style={{ background: "#e8f0fe" }}
              />
              <InputGroup.Button onClick={() => setIsView(!isView)}>
                {isView ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
              </InputGroup.Button>
            </InputGroup>
            <input
              className="login-form-input text-light"
              style={{ padding: "0px" }}
              type="submit"
              value="Sign in"
              id="submitBtn"
            />
            {!pass && <p className="alert">Invalid Username or Password</p>}
          </form>
        </div>
        {loading && (
          <div className="loading">
            <ScaleLoader size={150} color="#123abc" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
