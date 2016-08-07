var Conversation = Class.extend({
    init: function (other) {
        this.users = [other];
        this.messages = {};
        this._id = null;
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
                error(res);
            }
        })
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

        this.ui.add(msg.generateUi());
    },

    sendMessage: function (data, type)
    {
        if (type === undefined) {
            type = 'text';
        }

        var msg = new Message(locusta.username, this, type, data);
        
        this.pushMessage(msg);
        msg.send();
        this.ui.add(msg.generateUi());

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
                for (var i = 0, len = res.result.rows.length; i < len; i++) {
                    _this.onMessage(res.result.rows[i].value, false);
                }
            }
        }); 
    },

    getMessages: function (year, month, day) {
    },

    generateUi: function () {
        this.ui = new Box('ver', this._id, 'message-list');

        // fill with today's messages
        this.loadMessages();

        return this.ui;
    },

    generateButton: function () {
        this.buttonGenerated = true;
        var button = new Button(this.users[0], this.open.bind(this), null, 'conversation-button');
        return button;
    },

    addToSidebar: function () {
        if (!this.hasOwnProperty('buttonGenerated')) {
            var sidebar = getUi('sidebar');
            sidebar.add(this.generateButton());
        }
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
    }
});
