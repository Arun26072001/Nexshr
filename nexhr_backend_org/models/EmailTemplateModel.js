const mongoose = require("mongoose");

const EmailTempSchema = new mongoose.Schema({
    title: {type: String},
    subject: {type: String},
    
})