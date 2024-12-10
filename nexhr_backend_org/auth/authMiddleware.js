const jwt = require('jsonwebtoken');
const jwtKey = process.env.ACCCESS_SECRET_KEY;
const axios = require("axios");
const cen_url = process.env.CENTRALIZATION_BASEURL;

function verifyHR(req, res, next) {
  const token = req.headers['authorization'];
  console.log(token);
  
  if (typeof token !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ message: "Unauthorize for this operation" });
      } else {
        // console.log(authData);
        if (authData.Account == 2) {
          next();
        } else {
          res.status(401).send({ message: "Unauthorize" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ message: "Unauthorize" });
  }
}


function verifyEmployee(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(token, jwtKey, (err, authData) => {

      if (err) {
        console.log(err);
        res.sendStatus(401);
      } else {
        if (authData._id === req.params.empId) {
          // console.log(authData._id, req.params.empId);
          if (authData.Account == 3) {
            next();
          } else {
            res.status(401).send({ message: "No permission for this Account value" });
          }
        }
        else {
          res.status(401).send({ message: "Authorization Error", error: "Mismatch login person ID!" })
        }
      }
    });
  } else {
    // Forbidden
    res.sendStatus(401);
  }
  // next()
}

function verifyHREmployee(req, res, next) {
  const token = req.headers['authorization'];
  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        console.log("error in verify");
        res.sendStatus(401);
      } else {
        if (authData.Account == 2 || authData.Account == 3) {
          next();
        }
        else {
          res.status(401).send({ message: "Authorization Error", error: "You has no Authorization!" });
        }
      }
    });
  } else {
    // Forbidden
    res.sendStatus(401);
  }
  // next()
}

async function verifyAdminHREmployee(req, res, next) {
  const token = req.headers['authorization'];
  // // console.log("84", token);
  // const verifytoken = await axios.post(`${cen_url}/refresh`);
  // if(verifytoken.data.status === "false"){
  //   res.status(401).send({error: "token has been expired!"})
  // }else{
  // }
  if (typeof token !== "undefined") {
    
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        console.log("error in verify");
        res.sendStatus(401);
      } else {
        if (authData.Account == 3 || authData.Account == 2 || authData.Account == 1) {
          next();
        }
        //  else if (authData.Account == 3) {
        //   // if (authData._id === req.params.id) {
        //     next();
        //   // }
        //   // else {
        //   //   res.status(401).send({message: "Authorization Error", error: "Mismatch login person ID!"});
        //   // }
        // }
        else {
          res.status(401).send({ message: "Authorization Error", error: "You has no Authorization!" });
        }
      }
    });
  } else {
    // Forbidden
    res.sendStatus(401);
  }
}

function verifyAdminHR(req, res, next) {
  
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.sendStatus(401);
      } else {
        if (authData.Account == 1 || authData.Account == 2) {
          next();
        } else {
          res.sendStatus(401);
        }
      }
    });
  } else {
    // Forbidden
    res.sendStatus(401);
  }
}

function verifyAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if (authData.Account == 1) {
          next();
        } else {
          res.status(401).send({ message: "unAuthorize: Admin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ messsage: "Can't access Auth token!" });
  }
}

function verifyAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if (authData.Account == 1) {
          next();
        } else {
          res.status(401).send({ message: "unAuthorize: Admin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ messsage: "Can't access Auth token!" });
  }
}

function verifySuperAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if (authData.Account == 0) {
          next();
        } else {
          res.status(401).send({ message: "unAuthorize: Super Admin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ messsage: "Can't access Auth token!" });
  }
}

const dynamicPathMiddleware = (type, customPath) => {
  return (req, res, next) => {
      let getPath;

      if (customPath) {
          getPath = path.join(__dirname, '..', customPath);
      } else {
          let basePath = routeToDirectoryMap[type] || 'uploads/images/';
          getPath = path.join(__dirname, '..', basePath);
      }
      req.uploadPath = getPath;
      console.log(`Full Path: ${getPath}`);
      ensureDirectoryExistence(getPath);
      next();
  };
};

module.exports = {
  verifyHR,
  verifyEmployee,
  verifyHREmployee,
  verifyAdminHR,
  verifyAdmin,
  verifyAdminHREmployee,
  verifySuperAdmin
}