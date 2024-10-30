const jwt = require('jsonwebtoken');
const jwtKey = process.env.ACCCESS_SECRET_KEY;

function verifyHR(req, res, next) {
  console.log(req.headers["authorization"]);
  const Header = req.headers["authorization"];

  if (typeof Header !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(Header, jwtKey, (err, authData) => {
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
  // console.log(req.headers["authorization"]);
  const Header = req.headers["authorization"];

  if (typeof Header !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(Header, jwtKey, (err, authData) => {

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
}

function verifyHREmployee(req, res, next) {
  const Header = req.headers["authorization"];


  if (typeof Header !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(Header, jwtKey, (err, authData) => {
      if (err) {
        console.log("error in verify");
        res.sendStatus(401);
      } else {
        if (authData.Account == 2 || authData.Account == 3) {
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

function verifyAdminHREmployee(req, res, next) {
  const Header = req.headers["authorization"];
  console.log(Header);


  if (typeof Header !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(Header, jwtKey, (err, authData) => {
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
  const Header = req.headers["authorization"];

  if (typeof Header !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(Header, jwtKey, (err, authData) => {
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
    console.log("camel case");

    res.sendStatus(401);
  }
}

function verifyAdmin(req, res, next) {
  const Header = req.headers["authorization"];

  if (typeof Header !== "undefined") {
    // decodedData = jwt.decode(req.headers['authorization']);
    // if(decodedData.Account)
    jwt.verify(Header, jwtKey, (err, authData) => {
      if (err) {
        res.sendStatus(401);
      } else {
        if (authData.Account == 1) {
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

module.exports = {
  verifyHR,
  verifyEmployee,
  verifyHREmployee,
  verifyAdminHR,
  verifyAdmin,
  verifyAdminHREmployee
}