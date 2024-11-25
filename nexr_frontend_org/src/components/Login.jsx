import React, { useEffect, useContext } from "react";
import Logo from "../imgs/webnexs_logo.png";
import { css } from "@emotion/react"; // Update the import for emotion
import { ScaleLoader } from "react-spinners";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { EssentialValues } from "../App";
import "./Login.css";
// import Cookies from "universal-cookie";
// import { jwtDecode } from "jwt-decode";

const override = css`
  display: block;
  margin: 0 auto; 
  border-color: red;
`;

const Login = ({ isLogin }) => {
  const navigate = useNavigate();
  const { handleSubmit, loading, pass, data } = useContext(EssentialValues);
  // const cookies = new Cookies();
  // console.log(Account, isLogin);

  // useEffect(() => {
  //   // localStorage.setItem("orgId", id)
  //   if (Account === 1 && isLogin) {
  //     navigate("/admin")
  //   }
  //   else if (Account === 2 && isLogin) {
  //     navigate("/hr")
  //   } else if (Account === 3 && isLogin) {
  //     navigate("/emp")
  //   }
  // }, []);

  // useEffect(() => {
  //   async function checkNetworkConnection() {
  //     try {
  //       const connectionMsg = await axios.get(`${url}/`);
  //       console.log(connectionMsg?.data?.message);
  //       console.log(isLogin && window.location.pathname);
  //       if (isLogin && window.location.pathname === "/") {

  //         if (account === '1') {
  //           navigate("/admin")
  //         } else if (account === '2') {
  //           navigate("/hr")
  //         } else if (account === '3') {
  //           navigate("/emp")
  //         }
  //       }
  //     } catch (error) {
  //       navigate("/no-internet-connection");
  //     }
  //   }
  //   checkNetworkConnection();
  // }, []);

  return (
    <div>
      {data.Account === 1 && isLogin
        ? <Navigate to={"/admin"} />
        : data.Account === 2 && isLogin ? <Navigate to={"/hr"} />
          : data.Account === 3 && isLogin ? <Navigate to={"/emp"} />
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
