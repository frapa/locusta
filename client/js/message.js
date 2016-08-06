var Message = Class.extend({
    init: function (user, conversation, type, data, timestamp) {
        this.user = user;
        this.conversation = conversation;
        this.type = type;
        this.data = data;
        this._id = null;

        if (timestamp === undefined) {
            this.timestamp = new Date().getTime();
        } else {
            this.timestamp = timestamp;
        }
    },

    save: function () {
        var msgObj = {
            user: this.user,
            type: this.type,
            data: this.data,
            timestamp: this.timestamp
        };

        return msgObj;
    },

    load: function (msgObj, conversation) {
        this._id = msgObj._id;
        this.user = msgObj.user;
        this.conversation = conversation;
        this.type = msgObj.type;
        this.data = msgObj.data;
        this.timestamp = msgObj.timestamp;

        return this;
    },

    send: function () {
        var _this = this;
        post('send-message', {
            conversation: this.conversation._id,
            type: this.type,
            data: this.data       
        }, function (res) {
            _this._id = res.messageId;
        });
    },

    generateUi: function () {
        var ui = new MessageView(this.user, this.type, this.timestamp, this.data);
        return ui;
    }
});
