// Convenience
var _ = require('underscore');

// Express Js
var bodyParser = require('body-parser');
var httpProxy = require('http-proxy');
var express = require('express');
var app = express();
var appOptions = {root: __dirname + '/../client/'};

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Database
var nano = require('nano')('http://localhost:5984');
var locusta = nano.db.use('locusta');

// DB extensions ------------------------------------------ 
locusta.sInsert = function (res, obj, name, callback) {
    locusta.insert(obj, name, function (err, body) {
        if (err) {
            console.log(err);
            reportError(res, "Something went wrong.");
        } else {
            if (callback) {
                callback(body);
            } else {
                reportSuccess(res);
            }
        }
    });
}

locusta.sInsertNow = function (res, obj, name, callback) {
    obj.lastActivity = new Date().getTime();
    locusta.sInsert(res, obj, name, callback);
}

// Program logic ------------------------------------------

function authenticate (req, res, callback) {
    var user = req.body.user;
    var password = req.body.password;
    
    var userId = 'user:' + user;
    locusta.get(userId, function (err, body) {
        if (!err) {
            if (password === body.password) {
                callback(body, userId);
            } else {
                reportError(res, "Wrong password.");
            }
        } else {
            reportError(res, "User '" + user + "' does not exists.");
        }
    });
}

function reportSuccess (res, params) {
    var json = {
        type: "success",
    }
    _.extend(json, params || {});
    res.json(json);
}

function reportError (res, msg) {
    var json = {
        type: "error",
        msg: msg
    }
    res.json(json);
}

function guid () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function(c)
    {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function createConversation (res, users, type) {
    var convId = 'conversation:' + guid();
    var conv = {
        type: type,
        lastActivity: 0
    };

    if (type == 'normal') {
        _.extend(conv, {
            users: users,
            messages: []
        });
        locusta.sInsert(res, conv, convId, function () {});
    } else {
        reportError(res, "Invalid conversation type");
    }

    return conv;
}

function createMessage (res, user, conv, type, data) {
    var msgId = 'message:' + guid();
    var msg = {
        user: user,
        conversation: conv._id,
        type: type,
        data: data,
        timestamp: new Date().getTime()
    };

    var responseMsg;
    var answerRequest = _.after(2, function () {
        reportSuccess(res, {messageId: responseMsg.id});
    });

    locusta.sInsert(res, msg, msgId, function (msgRes) {
        responseMsg = msgRes;
        answerRequest();
    });
    conv.messages.push(msgId);
    locusta.sInsertNow(res, conv, conv._id, function () {
        answerRequest();
    });

    return msg;
}

// Actions ------------------------------------------------

app.use(express.static(__dirname + '/../client/'));

app.post('/connect/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (!user.connected) {
            user.connected = 1;
            locusta.sInsertNow(res, user, userId);
        } else {
            reportSuccess(res);
        }
    });
});

app.post('/disconnect/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (user.connected) {
            user.connected = 0;
            locusta.sInsertNow(res, user, userId);
        }
    });
});

app.post('/register/', function (req, res) {
    var user = req.body.user;
    var password = req.body.password;
    
    var userId = 'user:' + user;
    locusta.get(userId, function (err, body) {
        if (err) {
            locusta.sInsert(res, {
                connected: 0,
                user: user,
                lastActivity: 0,
                password: password,
                conversations: {}
            }, userId);
        } else {
            reportError(res, "User already exists.");
        }
    });
});

app.post('/start-conversation/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (user.connected) {
            // should be array of usernames (strings)
            var users = JSON.parse(req.body.users);
            users.push(user.user);

            var userObjs = {};
            var whenUsersChecked = _.after(users.length, function () {
                var conv = createConversation(res, users, req.body.type);

                // update users
                _.each(userObjs, function (u, uId) {
                    u.conversations[conv._id] = { _id: conv._id };
                    locusta.sInsertNow(res, u, uId);
                });

                reportSuccess(res, {conversation: conv});
            });
            
            _.each(users, function (u) {
                var currentUserId = 'user:' + u;
                locusta.get(currentUserId, function (err, body) {
                    if (err) {
                        reportError(res, "Nonexistant user specified.");
                    } else {
                        userObjs[currentUserId] = body;
                        whenUsersChecked();
                    }
                });
            });
        }
    });
});

app.post('/get-conversation-list/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (user.connected) {
            reportSuccess(res, { conversations: user.conversations });
        }
    });
});

app.post('/get-conversation/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (user.connected) {
            var convId = req.body.conversation;
            locusta.get(convId, function (err, body) {
                if (err) {
                    console.log(err);
                    reportError(res, "Conversation does not exists.");
                } else {
                    // check if user in conversation
                    if (body.users.indexOf(user.user) == -1) {
                        reportError(res, "No rights for this conversation.");
                    }

                    reportSuccess(res, { conversation: body });
                    locusta.sInsertNow(body, convId, function () {});
                }
            });
        }
    });
});

app.post('/send-message/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (user.connected) {
            var convId = req.body.conversation;
            var type = req.body.type;
            var data = req.body.data;
            
            locusta.get(convId, function (err, conv) {
                if (err) {
                    console.log(err);
                    reportError(res, "Conversation does not exists.");
                } else {
                    // check if user in conversation
                    if (conv.users.indexOf(user.user) == -1) {
                        reportError(res, "No rights for this conversation.");
                    }

                    createMessage(res, user.user, conv, type, data);
                }
            });
        }
    });
});

app.post('/get-messages/', function (req, res) {
    authenticate(req, res, function (user, userId) {
        if (user.connected) {
            var convId = req.body.conversation;
            var timestamp = req.body.timestamp;

            if (timestamp == 0) {
                var year = req.body.year;
                var month = req.body.month;
                var day = req.body.day;

                var dateKey = [year, month, day].join('-');
            }

            locusta.get(convId, function (err, conv) {
                if (err) {
                    console.log(err);
                    reportError(res, "Conversation does not exists.");
                } else {
                    // check if user in conversation
                    if (conv.users.indexOf(user.user) == -1) {
                        reportError(res, "No rights for this conversation.");
                    }
                    
                    if (timestamp == 0) {
                        // get all messages in the specified day
                        locusta.view('messages', 'by_conv_and_date', {
                            startkey: [convId, dateKey],
                            endkey: [convId, dateKey, {}]
                        }, function (err, body) {
                            if (err) {
                                console.log(err);
                                reportError(res, "Cannot retrieve messages.");
                            } else {
                                reportSuccess(res, { result: body } );
                                locusta.sInsertNow(conv, convId, function () {});
                            }
                        });
                    } else {
                        // get only messages newer than timestamp
                        locusta.view('messages', 'by_conv_and_timestamp', {
                            startkey: [convId, parseInt(timestamp)],
                            endkey: [convId, new Date().getTime()]
                        }, function (err, body) {
                            if (err) {
                                console.log(err);
                                reportError(res, "Cannot retrieve messages.");
                            } else {
                                reportSuccess(res, { result: body } );
                                locusta.sInsertNow(conv, convId, function () {});
                            }
                        });
                    }
                }
            });
        }
    });
});

app.all('/futon/', function (req, res) {
    proxy.proxyRequest(req, res, {
        host: 'http://127.0.0.1',
        port: 8984
    });
});

// Start server
app.listen(3427);
