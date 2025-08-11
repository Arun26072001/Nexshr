module.exports = {
    email_template: function (req, res) {

        var email_template_id = req.body.email_template_id;
        var servicekey = req.headers.servicekey;
        var inReplyTo = req.body.inReplyTo;
        var ticket_id = req.body.ticket_id;

        var admin_name = req.body.admin_name;
        var user_name = req.body.user_name;
        var to_mail = req.body.to_mail;
        var org_id = req.body.org_id;
        var ticket_table = req.body.ticket_table;
        var password = req.body.password;
        var org_name = req.body.org_name;

        var ticket_name = req.body.ticket_name;
        var message = req.body.message;

        var link_url = req.body.link_url;
        var accept_link = req.body.accept_link;
        var decline_link = req.body.decline_link;

        var email_template = "SELECT * FROM `email_templates` WHERE email_template_id = '" + email_template_id + "' AND status = 1 ";
        connection.query(email_template, function (err, email_template) {
            if (err) {
                res.json({ 'status': false, 'message': 'Wrong Entry, Try with correct email verification template' });
            } else if (email_template.length > 0) {


                var emailapi = baseURL + 'adminapi/email_settings';

                var options = {
                    method: 'POST',
                    url: emailapi,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'servicekey': servicekey
                    },
                    body: JSON.stringify({ org_id: org_id })
                };

                var email_template = email_template[0];
                request(options, function (err, response, body) {
                    var edata = JSON.parse(body);

                    if (edata.email_settings && edata.email_settings.length != 0) {
                        var email_settings = edata.email_settings[0];
                        var transporter = edata.transporter;

                        var sender_mail = email_settings.user;
                        var sender_name = email_settings.sender_name;
                        var transporter = nodemailer.createTransport(transporter);

                        if (email_template_id == 1) {
                            var content = email_template.content.replace(/{{admin_name}}/g, admin_name).replace(/{{user_name}}/g, user_name).replace(/{{website_name}}/g, 'Webnexs');
                        } else if (email_template_id == 2) {
                            var content = email_template.content.replace(/{{admin_name}}/g, admin_name).replace(/{{user_name}}/g, user_name).replace(/{{website_name}}/g, 'Webnexs').replace(/{{ticket_id}}/g, ticket_id);
                        } else if (email_template_id == 3) {
                            var content = email_template.content.replace(/{{org_name}}/g, org_name).replace(/{{user_name}}/g, user_name).replace(/{{ticket_name}}/g, ticket_name).replace(/{{message}}/g, message);
                        } else if (email_template_id == 4) {
                            var content = email_template.content.replace(/{{user_name}}/g, user_name);
                        } else if (email_template_id == 5) {
                            var content = email_template.content.replace(/{{user_name}}/g, user_name).replace(/{{org_name}}/g, org_name).replace(/{{email_id}}/g, to_mail).replace(/{{password}}/g, password).replace(/{{site_link}}/g, link_url);
                        }
                        else if (email_template_id == 6) {
                            var content = email_template.content.replace(/{{user_name}}/g, user_name).replace(/{{org_name}}/g, org_name).replace(/{{email}}/g, to_mail).replace(/{{accept_link}}/g, accept_link).replace(/{{decline_link}}/g, decline_link);
                        }

                        var sql = "INSERT INTO email_reports (email_template_id, email_subject, email_to) VALUES ('" + email_template_id + "','" + email_template.subject + "','" + to_mail + "')";
                        connection.query(sql, function (err, emailstatus) {
                            if (err) {
                                console.log(err);
                            } else {
                                var response_id = emailstatus.insertId;

                                if (email_template_id != 3) {
                                    var dir_path = __dirname + "/email_template.ejs";
                                } else {
                                    var dir_path = __dirname + "/convertations.ejs";
                                }

                                ejs.renderFile(path.join(dir_path), { 'baseURL': baseURL, 'email_id': to_mail, 'content': content, 'org_name': org_name, 'email_template': email_template, 'message': message, 'ticket_name': ticket_name, 'user_name': user_name, 'link_url': link_url, 'moment': moment }, function (err, data) {
                                    if (err) {
                                        var update_query = "UPDATE email_reports SET email_status='Failed',email_status_note='" + err + "' WHERE email_report_id='" + response_id + "'";

                                        connection.query(update_query, function (err, history_response) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                    } else {

                                        if (inReplyTo == undefined || inReplyTo == 0) {
                                            var mainOptions = {
                                                from: sender_name + ' <' + sender_mail + '>',
                                                to: to_mail,
                                                cc: email_template.recipient,
                                                subject: email_template.subject,
                                                html: data
                                            };
                                        } else {
                                            var mainOptions = {
                                                from: sender_name + ' <' + sender_mail + '>',
                                                to: to_mail,
                                                // to: "immanuel@webnexs.in",
                                                cc: email_template.recipient,
                                                subject: email_template.subject,
                                                inReplyTo: inReplyTo,
                                                html: data
                                            };
                                        }

                                        transporter.sendMail(mainOptions, function (err, info) {
                                            if (err) {
                                                var update_query = "UPDATE email_reports SET email_status='Failed',email_status_note='" + err + "' WHERE response_id='" + response_id + "'";

                                                connection.query(update_query, function (err, history_response) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });
                                            } else {
                                                var messageId = info.messageId;
                                                var update_query = "UPDATE email_reports SET email_status='Success',email_status_note='Initiated' WHERE email_report_id='" + response_id + "'";
                                                connection.query(update_query, function (err, history_response) {
                                                    if (err) {
                                                        console.log(err);
                                                    }

                                                    if (inReplyTo == undefined || inReplyTo == 0) {
                                                        if (ticket_id != undefined && ticket_table) {
                                                            var up_query = "UPDATE " + ticket_table + " SET message_id='" + messageId + "' WHERE ticket_id='" + ticket_id + "';";
                                                            connection.query(up_query, function (up_err, up_res) {
                                                                if (up_err) {
                                                                    console.log(up_err);
                                                                }
                                                            })
                                                        }
                                                    }
                                                });
                                                console.log('Message sent: ' + info.response);
                                            };
                                        });
                                    };
                                });
                            }
                        });
                        res.json({ 'status': true, 'message': 'Email Sent Successfully' });
                    } else {
                        res.json({ 'status': false, 'message': 'Email Settings Not Added' });
                    }
                });
            } else {
                res.json({ 'status': 'false', 'message': 'Email Template not available' });
            };
        });
    }
};