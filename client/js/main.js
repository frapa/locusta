var Class = chic.Class;

var locusta = {
    waitTime: 5000,
    username: null,
    password: null,
    conversations: {},
    activeConvId: null,
    getActiveConv: function () {
        return locusta.conversations[locusta.activeConvId];
    }
}

// This starts it all!
$(function () {
    if (localstore.get('connected')) {
        var Ui = buildUi(jsonUi);
        $('body')[0].appendChild(Ui.dom);

        locusta.username = localstore.get('username');
        locusta.password = localstore.get('password');

        init();
    } else {
        var loginUi = buildUi(jsonLogin);
        $('body')[0].appendChild(loginUi.dom);
    }
});

function init () {
    loadConversations(function () {
        setInterval(loop, locusta.waitTime);
    });
}

function loop () {
    var convs = locusta.conversations;
    for (convId in convs) {
        if (convs.hasOwnProperty(convId)) {
            var conv = convs[convId];
            conv.loadNewMessages();
        }
    }
}

function login () {
    locusta.username = $('#username')[0].value;
    locusta.password = $('#password')[0].value;

    post('connect', {}, function (r) {
        if (r.type === 'error') {
            console.error(r.msg);
        } else {
            localstore.set('connected', 1);
            localstore.set('username', locusta.username);
            localstore.set('password', locusta.password);

            getUi('login-hor').remove();
            var Ui = buildUi(jsonUi);
            $('body')[0].appendChild(Ui.dom);

            init();
        }
    });
}

function newContact () {
    var contactsUi = buildUi(jsonNewContactUi);
    var context = new ContextBox('New contact',
        contactsUi, 'new-contact-dialog');
    context.show();
}

function saveContact () {
    var contact = {
        user: $('#contact_username')[0].value,
        first_name: $('#first_name')[0].value,
        last_name: $('#last_name')[0].value,
        conversation: null
    };

    var contacts = localstore.get('contacts');
    if (!contacts) {
        contacts = {};
    }
    contacts[contact.user] = contact;

    localstore.set('contacts', contacts);

    dismiss('new-contact-dialog');
}

function dismiss (id) {
    var ui = getUi(id);
    ui.remove();
}

function newConversation () {
    var contactsUi = buildUi(jsonContactListUi);

    function startConversation (user, contact) {
        var conv;
        
        function showConversation (conv, res) {
            conv.addToSidebar();
            conv.open();
        }

        if (contact.conversation) {
            conv = locusta.conversations[contact.conversation];
            showConversation(conv);
        } else {
            conv = new Conversation(user);
            conv.start(showConversation.bind(null, conv));
            //conv.save();
        }

        dismiss('select-contact-dialog');
    }

    var listUi = getUi('contact-list');
    var contacts = localstore.get('contacts');
    for (key in contacts) {
        if (contacts.hasOwnProperty(key)) {
            var c = contacts[key];
            var completeName = c.first_name + ' ' + c.last_name;

            var callback = startConversation.bind(null, key, c);
            var button = new Button(completeName, callback);
            listUi.add(button);
        }
    }

    var context = new ContextBox('Select contact',
        contactsUi, 'select-contact-dialog');
    context.show();
}

function sendMessage ()
{
    var text = $('#message-text')[0].value;
    var conv = locusta.getActiveConv();
    conv.sendMessage(text);

    $('#message-text')[0].value = '';
}

function loadConversations (callback)
{
    post('get-conversation-list', {}, function (res) {
        var count = Object.keys(res.conversations).length;

        for (key in res.conversations) {
            if (res.conversations.hasOwnProperty(key)) {
                var conv = new Conversation();
                conv.load(key, function () {
                    conv.addToSidebar();

                    count -= 1;
                    if (count === 0) {
                        callback();
                    }
                });
            }
        }
    });
}
