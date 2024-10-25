import React, { useEffect, useContext } from "react";
import Logo from "../imgs/webnexs_logo.png";
import { css } from "@emotion/react"; // Update the import for emotion
import { ScaleLoader } from "react-spinners";
import { Navigate, useNavigate } from "react-router-dom";
import { EssentialValues } from "../App";
import "./Login.css";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

const Login = () => {
  const Account = localStorage.getItem("Account");
  const navigate = useNavigate();
  const { handleSubmit, loading, pass } = useContext(EssentialValues);

  useEffect(() => {
    if (Account === "1") {
      navigate("/admin")
    }
    else if (Account === "2") {
      navigate("/hr")
    } else if (Account === "3") {
      navigate("/emp")
    }
  }, [])

  return (
    <div>
      {Account === 1
        ? <Navigate to={"/admin"} />
        : Account === 2 ? <Navigate to={"/hr"} />
          : Account === 3 ? <Navigate to={"/emp"} />
            : ""}
      <div className="container">
        <div id="main-outer-div">
          <div id="logo-div">
            <img id="logo-img" src={Logo} alt="Webnexs Logo" />
          </div>
          <div id="title-div">
            <h4 className="title">Sign in</h4>
          </div>
          <div id="outer-login-form-div">
            <form action="" method="" onSubmit={handleSubmit}>
              <input
                className="login-form-input"
                type="text"
                placeholder="Email"
                required="required"
                name="email"
              />
              <input
                className="login-form-input"
                type="password"
                name="password"
                placeholder="Password"
                required="required"
              />
              <input
                className="login-form-input"
                type="submit"
                value="Sign in"
                id="submitBtn"
              />
              {!pass ? (
                <p className="alert">Invalid UserName or Password</p>
              ) : (
                ""
              )}
            </form>
          </div>
          <div className="loading">
            <ScaleLoader
              css={override}
              size={150}
              color={"#123abc"}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
