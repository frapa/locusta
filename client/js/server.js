var Server = Class.extend({
    url: null,

    init: function (url)
    {
        this.url = url;

        emitonoff(this);
    },

    authenticate: function (username, password)
    {
        var _this = this;

        getParams(S.server.url, {
            action: 'login',
            username: username,
            password: password
        }, function (response)
        {
            if (response != '0') {
                _this.username = username;
                _this.userId = response;
                _this.emit('logged in');
            } else {
                _this.emit('error', 'logging in');
            }
        });
    },

    disconnect: function ()
    {
        // Syncronious request
        getParams(S.server.url, {
            action: 'logout',
            userId: this.userId,
            psw: this.password
        }, function (response) {
            console.log(response);
        }, false);
    }
});
