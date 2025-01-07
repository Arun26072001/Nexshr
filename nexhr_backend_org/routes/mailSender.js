const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.FROM_MAIL,
        pass: process.env.MAILPASSWORD
    }
});

let sendMail = (mailOptions)=>{
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }else{
        console.log(info);
        
        return console.log("Email has been sent successfully!");
    }
  });
};

module.exports = sendMail;