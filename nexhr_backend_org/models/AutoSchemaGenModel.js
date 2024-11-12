var appFormSchema = new Schema({
    User_id : {type: String},
    LogTime : {type: String},
    feeds : [new Schema({
        Name: {type: String},
        Email : {type: String},
        password: {type: String}
    }, {strict: false})
    ]
}, {strict: false});