const postmark = require("postmark");

const client = new postmark.ServerClient("5403b130-ff09-4e7f-bc85-999c75a4413b")
let sendMail = (mailOptions) => {
  client.sendEmail(mailOptions, (err, result) => {
    if (err) {
      console.log("error: ", err.message);
    } else {
      console.log("Email sent successfully.", result);
    }
  })
};

module.exports = sendMail;