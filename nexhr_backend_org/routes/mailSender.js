const nodemailer = require("nodemailer");
const postmark = require("postmark");

const client = new postmark.ServerClient("5403b130-ff09-4e7f-bc85-999c75a4413b")
// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.FROM_MAIL,
//         pass: process.env.MAILPASSWORD
//     }
// });
let sendMail = (mailOptions)=>{
  client.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }else{
        return console.log("Email has been sent successfully!");
    }
  });
};

module.exports = sendMail;