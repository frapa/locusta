var Conversation = Class.extend({
    init: function (other) {
        this.users = [other];
        this.messages = {};
        this._id = null;

        this.button = null;
    },

    start: function (success, error) {
        var _this = this;
        post('start-conversation', {
            users: JSON.stringify(this.users),
            type: 'normal'
        }, function (res) {
            if (res.type == 'success') {
                _this._id = res.conversation._id;
                success(res);
            } else {
                console.error(res.msg);
                if (error) {
                    error(res);
                }
            }
        });
    },

    save: function () {
        var users = this.users;
        var cId = this.getId();

        convObj = {
            users: users,
            messages: []
        };

        var convs = {};
        if (localstore.get('conversations')) {
            convs = localstore.get('conversations');
        }

        for (var i = 0, len = this.messages.length; i < len; i++) {
            var msg = this.messages[i];
            var msgObj = msg.save();
            convObj.messages.push(msgObj);
        }
        convs[cId] = convObj;

        localstore.set('conversations', convs);
    },

    load: function (convId, success, error) {
        var _this = this;
        post('get-conversation', {
            conversation: convId
        }, function (res) {
            if (res.type == 'success') {
                var convObj = res.conversation;

                _this.users = convObj.users;
                _this.lastActivity = convObj.lastActivity;

                _this._id = convObj._id;
                locusta.conversations[_this._id] = _this;

                success(res);
            } else {
                console.error(res.msg);
                error(res);
            }
        });
    },

    pushMessage: function (msg, year, month, day) {
        if (year === undefined) {
            var date = new Date();
            year = date.getFullYear();
            month = date.getMonth() + 1; // zero indexed month
            day = date.getDate();
        }

        var key = [year, month, day].join('-');
        if (!this.messages.hasOwnProperty(key)) {
            this.messages[key] = [];
        }

        this.messages[key].push(msg);
    },

    scrollDown: function (messageList) {
        setTimeout(function () {
            var p = messageList.dom.parentNode;
            p.scrollTop = p.scrollHeight;
        }, 10);
    },

    onMessage: function (msgObj, addFromUser) {
        if (addFromUser === undefined) {
            addFromUser = true;
        }

        if (!addFromUser && msgObj.user == locusta.username) {
            return;
        }

        var msg = new Message();
        msg.load(msgObj, this);
        
        var msgDate = new Date();
        msgDate.setTime(msg.timestamp);
        this.pushMessage(msg, msgDate.getFullYear(), msgDate.getMonth()+1, msgDate.getDate());

        var messageList = getUi(this._id);
        messageList.add(msg.generateUi());
        this.scrollDown(messageList);
    },

    sendMessage: function (data, type)
    {
        if (type === undefined) {
            type = 'text';
        }

        var msg = new Message(locusta.username, this, type, data);
        
        this.pushMessage(msg);
        msg.send();

        var messageList = getUi(this._id);
        messageList.add(msg.generateUi());
        this.scrollDown(messageList);

        return msg;
    },

    loadMessages: function (year, month, day) {
        var _this = this;
        
        if (year === undefined) {
            var date = new Date();
            year = date.getUTCFullYear();
            month = date.getUTCMonth() + 1; // zero indexed month
            day = date.getUTCDate();
        }

        post('get-messages', {
            conversation: this._id,
            year: year,
            month: month,
            day: day,
            timestamp: 0
        }, function (res) {
            if (res.type == 'error') {
                console.error(res.msg);
            } else {
                for (var i = 0, len = res.result.rows.length; i < len; i++) {
                    _this.onMessage(res.result.rows[i].value);
                }
            }
        });
    },

    loadNewMessages: function () {
        var _this = this;

        post('get-messages', {
            conversation: this._id,
            timestamp: this.lastActivity
        }, function (res) {
            if (res.type == 'error') {
                console.error(res.msg);
            } else {
                _this.lastActivity = new Date().getTime();
                
                var messageNum = res.result.rows.length;
                var othersMessageNum = 0;
                var msgObj, otherMsgObj = null;
                for (var i = 0, len = messageNum; i < len; i++) {
                    msgObj = res.result.rows[i].value;

                    if (msgObj.user !== locusta.username) {
                        _this.onMessage(msgObj, false);
                        otherMsgObj = msgObj;
                        othersMessageNum += 1;
                    }
                }
                
                // notify only if not focused and notification enabled
                if (locusta.notificationEnabled && locusta.focus) {
                    if (othersMessageNum == 1) {
                        if (otherMsgObj !== null) {
                            locusta.sendNotification('Locusta: ' + otherMsgObj.user, otherMsgObj.data);
                        }
                    } else if (othersMessageNum > 1) {
                        locusta.sendNotification('Locusta', othersMessageNum.toString()  + ' new messages');
                    }
                }
            }
        }); 
    },

    updateConnectedStatus: function () {
        var _this = this;

        post('is-conversation-connected', {
            conversation: this._id
        }, function (res) {
            if (res.type == 'error') {
                console.error(res.msg);
            } else {
                if (res.connected) {
                    _this.button.setStatus('connected', 'Connected');
                } else {
                    _this.button.setStatus('disconnected',
                        'Last connected ' + vaguize(res.lastActivity));
                }
            }   
        });
    },

    generateUi: function () {
        this.ui = new Box('ver', undefined, 'message-list-container');
        this.ui.add(new Box('ver', this._id, 'message-list'));

        // fill with today's messages
        this.loadMessages();

        return this.ui;
    },

    generateButton: function () {
        this.button = new ConversationButton(this.getOtherUser(), this.open.bind(this));
        this.button.setStatus('unknown', 'Checking...');
        return this.button;
    },

    addToSidebar: function () {
        if (this.button === null) {
            var sidebar = getUi('sidebar');
            sidebar.add(this.generateButton());
        }
    },

    // only works for conversation between two users
    getOtherUser: function () {
        var users = this.users;
        users.splice(users.indexOf(locusta.username), 1);
        return users[0];
    },

    open: function () {
        if (!this.ui) {
            var main = getUi('main');
            this.ui = this.generateUi();
            main.add(this.ui, 1, 0);
        }

        this.ui.show();
        $('#typing-bar')[0].style.display = 'flex';

        locusta.activeConvId = this._id;

        var button = $('.selected-conversation')[0];
        if (button) {
            new Ui().removeClass('selected-conversation', button);
        }
        this.button.addClass('selected-conversation');
    }
});
