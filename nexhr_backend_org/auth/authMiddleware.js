const jwt = require('jsonwebtoken');
const jwtKey = process.env.ACCCESS_SECRET_KEY;

function verifyHR(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: "Unauthorize for this operation" });
      } else {
        if (authData.Account == 2) {
          next();
        } else {
          res.status(401).send({ error: "Unauthorize" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ error: "Unauthorize" });
  }
}


function verifyEmployee(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      console.log(authData);

      if (err) {
        console.log(err);
        res.sendStatus(401);
      } else {
        if (authData._id === req.params.id) {
          // console.log(authData._id, req.params.empId);
          if (authData.Account == 3) {
            next();
          } else {
            res.status(401).send({ error: "No permission for this Account value" });
          }
        }
        else {
          res.status(401).send({ error: "Authorization Error", error: "Mismatch login person ID!" })
        }
      }
    });
  } else {
    // Forbidden
    res.sendStatus(401);
  }
  // next()
}

function verifyTeamHigherAuthority(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      const { isTeamLead, isTeamHead, isTeamManager } = authData;
      if (err) {
        console.log(err);
        res.sendStatus(401);
      } else {
        if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
          next();
        } else {
          res.status(401).send({ error: "No permission for this Action" });
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
          res.status(401).send({ error: "Authorization Error", error: "You has no Authorization!" });
        }
      }
    });
  } else {
    // Forbidden
    res.sendStatus(401);
  }
  // next()
}

async function verifyAdminHREmployeeManagerNetwork(req, res, next) {

  const token = req.headers['authorization'];
  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        console.log(err, "error in verify");
        return res.sendStatus(401);
      } else {
        if ([1, 2, 3, 4, 5, 17].includes(authData.Account)) {
          next();
        }
        else {
          return res.status(401).send({ error: "You has no Authorization!" });
        }
      }
    });
  } else {
    // Forbidden
    return res.status(401).send({ error: "token not not found" });
  }
}

function verifyAdminHR(req, res, next) {
  // Retrieve the token from the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    // If no Authorization header is present
    console.log("Missing authorization token");
    return res.status(401).json({ error: "Authorization token is required" });
  }

  // Extract the token (e.g., "Bearer <token>")
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  // Verify the token
  jwt.verify(token, jwtKey, (err, authData) => {
    if (err) {
      // Handle token verification errors
      console.error("Token verification error:", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Ensure authData is valid and contains the Account field
    if (!authData || typeof authData.Account === 'undefined') {
      console.error("Invalid token payload: Account property missing");
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if the user has admin or HR access
    if (authData.Account === 1 || authData.Account === 2) {
      // User is authorized
      next();
    } else {
      // User is not authorized
      console.warn("Unauthorized access attempt");
      return res.status(403).json({ error: "Access denied" });
    }
  });
}

async function verifyAdminHRTeamHigherAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (typeof token !== "undefined") {

    jwt.verify(token, jwtKey, (err, authData) => {
      const { isTeamLead, isTeamHead, isTeamManager } = authData;
      if (err) {
        console.log("error in verify");
        res.sendStatus(401);
      } else {
        if ([1, 2, 4].includes(authData.Account) || [isTeamLead, isTeamHead, isTeamManager].includes(true)) {
          next();
        }
        else {
          res.status(401).send({ error: "You are not part of any higher authority team." });
        }
      }
    });
  } else {
    // Forbidden
    res.send(401).send({ error: "token not not found" });
  }
}

function verifyAdminHREmployee(req, res, next) {
  const token = req.headers['authorization'];
  if (typeof token !== "undefined") {

    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        console.log("error in verify");
        res.sendStatus(401);
      } else {
        if ([1, 2, 3].includes(authData.Account)) {
          next();
        }
        else {
          res.status(401).send({ error: "You has no Authorization!" });
        }
      }
    });
  } else {
    // Forbidden
    res.send(401).send({ error: "token not not found" });
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
          res.status(401).send({ error: "unAuthorize: Admin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ error: "Can't access Auth token!" });
  }
}

function verifyAdminHrNetworkAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if ([1, 2, 5].includes(authData.Account)) {
          next();
        } else {
          res.status(401).send({ error: "unAuthorize: Admin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ error: "Can't access Auth token!" });
  }
}

function verifyManager(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if (authData.Account == 4) {
          next();
        } else {
          res.status(401).send({ error: "unAuthorize: Manager can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ error: "Can't access Auth token!" });
  }
}

function verifyNetworkAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if (authData.Account == 5) {
          next();
        } else {
          res.status(401).send({ error: "unAuthorize: NetworkAdmin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ error: "Can't access Auth token!" });
  }
}

function verifySuperAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (typeof token !== "undefined") {
    jwt.verify(token, jwtKey, (err, authData) => {
      if (err) {
        res.status(401).send({ error: err.message });
      } else {
        if (authData.Account === 17) {
          next();
        } else {
          res.status(401).send({ error: "unAuthorize: Super Admin can only do this action!" });
        }
      }
    });
  } else {
    // Forbidden
    res.status(401).send({ error: "Can't access Auth token!" });
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
  verifyAdminHrNetworkAdmin,
  verifyAdminHREmployee,
  verifyAdmin,
  verifyAdminHREmployeeManagerNetwork,
  verifySuperAdmin,
  verifyManager,
  verifyNetworkAdmin,
  verifyTeamHigherAuthority,
  verifyAdminHRTeamHigherAuth
}