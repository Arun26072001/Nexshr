import React, { useContext } from "react";
import Logo from "../imgs/webnexs_logo.webp";
import { ScaleLoader } from "react-spinners";
import { EssentialValues } from "../App";
import "./Login.css";

const Login = () => {
  const { handleSubmit, loading, pass } = useContext(EssentialValues);

  return (
    <div className="container">
      <div id="main-outer-div">
        <div id="logo-div">
          <img
            id="logo-img"
            src={Logo}
            loading="eager"
            width={100}
            height={100}
            style={{ objectFit: "cover" }}
            alt="Webnexs Logo"
          />
        </div>
        <div id="title-div">
          <h4 className="title">Sign in</h4>
        </div>
        <div id="outer-login-form-div">
          <form onSubmit={handleSubmit}>
            <input
              className="login-form-input"
              type="email"
              placeholder="Email"
              required
              name="email"
            />
            <input
              className="login-form-input"
              type="password"
              name="password"
              placeholder="Password"
              required
            />
            <input
              className="login-form-input text-light"
              type="submit"
              value="Sign in"
              id="submitBtn"
            />
            {!pass && (
              <p className="alert">Invalid Username or Password</p>
            )}
          </form>
        </div>
        {loading && (
          <div className="loading">
            <ScaleLoader size={150} color={"#123abc"} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;