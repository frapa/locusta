var UiElements = {};

var Ui = Class.extend({
    dom: '',
    grow: 0,

    addId: function(id) {
        if (id !== undefined) {
            this.dom.id = id;
            UiElements[id] = this;
        }
    },

    newElement: function (type, klass, html, events)
    {
        var element = document.createElement(type);

        if (klass) {
            element.className = klass;
        }

        if (html) {
            element.innerHTML = html;
        }

        if (events) {
            for (i in events) {
                if (events.hasOwnProperty(i)) {
                    var eventType = i;
                    var callback = events[i];

                    $(element).on(eventType, callback);
                }
            }
        }

        return element;
    },

    remove: function ()
    {
        this.dom.parentNode.removeChild(this.dom);
    },

    hide: function () {
        this.dom.style.display = 'none';
    },

    show: function () {
        this.dom.style.display = 'auto';
    },

    addClass: function (klass, element) {
        if (element == undefined) {
            element = this.dom;
        }

        if (element.className.indexOf(klass) == -1) {
            element.className += ' ' + klass;
        }
    },

    removeClass: function (klass, element) {
        if (element == undefined) {
            element = this.dom;
        }

        if (element.className.indexOf(klass) != -1) {
            var re = new RegExp(klass, 'g');
            element.className = element.className.replace(re, '').trim();
        }
    }
});

var Box = Ui.extend({
    orientation: 'hor',
    uis: [],
    grow: 1,

    // orientation = 'hor' or 'ver'
    init: function (orientation, id, klass, content)
    {
        this.dom = this.newElement('div', 'box' + (klass ? ' ' + klass : ''));
        this.setOrientation(orientation);
        this.addId(id);

        if (content) {
            this.dom.innerHTML = content;
        }
    },

    setOrientation: function (orientation)
    {
        this.orientation = orientation;
        this.dom.style.flexDirection = orientation == 'hor' ? 'row' : 'column';
    },

    add: function (ui, grow, pos)
    {
        ui.dom.style.flexGrow = ui.grow;

        if (grow !== undefined) {
            ui.dom.style.flexGrow = grow;
        }

        this.uis.push(ui);
        if (pos === undefined) {
            this.dom.appendChild(ui.dom);
        } else {
            this.dom.insertBefore(ui.dom, this.dom.childNodes[pos]);
        }
    },       

    setContent: function (content)
    {
        this.dom.innerHTML = content;
    }
});

var Textarea = Ui.extend({
    grow: 1,

    init: function (id)
    {
        this.dom = this.newElement('textarea');
        this.addId(id);
    }
});

var Input = Ui.extend({
    type: null,

    init: function (type, value, id, label)
    {
        this.type = type;

        this.dom = this.newElement('input');
        this.dom.type = type;
        this.dom.value = value;

        this.addId(id);

        if (label) {
            dom = this.dom;
            this.dom = this.newElement('label');
            this.dom.innerHTML = label;
            this.dom.appendChild(dom);
        }
    }
});


var MessageView = Box.extend({
    grow: 0,

    init: function (user, type, timestamp, message)
    {
        klasses = ['message'];
        if (user === locusta.username) {
            klasses.push('own-message');
        }

        this.sup('ver', undefined, klasses.join(' '));

        var html = message.replace('\n', '<br />');
        var messageContent = new Box('hor', undefined, 'message-content', html);
        var formattedDate = strftime('%H:%M - %e %b %Y', new Date(timestamp));
        var time = new Box('hor', undefined, 'message-time', formattedDate);

        this.add(messageContent);
        this.add(time);
    }
});

var Label = Ui.extend({
    text: '',

    init: function (text, id)
    {
        this.text = text;
        this.dom = this.newElement('label', '', '<span>' + text + '</span>');
        this.dom.setAttribute('for', id);
    }
});

var Button = Ui.extend({
    text: '',
    className: 'button',

    init: function (text, callback, id, klass)
    {
        this.text = text;

        klasses = [this.className];
        if (klass) {
            klasses.push(klass);
        }

        this.dom = this.newElement('button', klasses.join(' '), text, {
            click: callback
        });

        this.addId(id);
    }
});

var ConversationButton = Box.extend({
    grow: 0,
    className: 'conversation-button',

    init: function (title, callback)
    {
        this.sup('hor', undefined, this.className);
        $(this.dom).on('click', callback);

        var image = this.newElement('div', 'conversation-image');
        this.dom.insertBefore(image, null);

        var textContainer = new Box('ver', undefined, 'conversation-title-container');
        this.title = new Box('hor', undefined, 'conversation-title', title);
        this.statusText = new Box('hor', undefined, 'conversation-status');
        textContainer.add(this.title);
        textContainer.add(this.statusText);
        this.add(textContainer);

        this.statusIndicator = this.newElement('div', 'conversation-status-indicator');
        var beauty = this.newElement('div', 'conversation-beauty');
        this.dom.insertBefore(this.statusIndicator, null);
        this.dom.insertBefore(beauty, null);
    },

    setTitle: function (title)
    {
        this.title.setContent(title);
    },

    // status can be 'connected', 'disconnected' or 'unknown'
    setStatus: function (status, statusText)
    {
        if (status == 'connected') {
            this.removeClass('user-disconnected', this.statusIndicator);
            this.addClass('user-connected', this.statusIndicator);
        } else if (status == 'disconnected') {
            this.removeClass('user-connected', this.statusIndicator);
            this.addClass('user-disconnected', this.statusIndicator);
        } else {
            this.removeClass('user-connected', this.statusIndicator);
            this.removeClass('user-disconnected', this.statusIndicator);
        }
        
        this.statusText.setContent(statusText);
    }
});

var Checkbox = Box.extend({
    checked: false,
    className: 'checkbox',
    grow: 0,

    init: function (text, callback, id, klass)
    {
        klasses = [this.className];
        if (klass) {
            klasses.push(klass);
        }

        this.sup('hor', undefined, klasses.join(' '));

        this.checkbox = this.newElement('input');
        this.checkbox.type = 'checkbox';
        this.checkbox.id = id;
        this.dom.insertBefore(this.checkbox, null);

        $(this.checkbox).on('change', callback)

        this.label = new Label(text, id);
        this.add(this.label);

        var slider = this.newElement('div', 'slider');
        slider.insertBefore(this.newElement('span', 'knob'), null)
        this.label.dom.insertBefore(slider, null);

        UiElements[id] = this;
    },

    toggle: function () {
        this.checkbox.click();
    }
});

var ContextBox = Box.extend({
    init: function (title, ui, id)
    {
        this.sup('ver', id, 'context');

        var cellBox = new Box('vertical', undefined, 'context-cell');
        var contentBox = new Box('vertical', undefined, 'context-content');
        contentBox.add(ui);
        cellBox.add(contentBox);

        this.add(cellBox);
    },

    show: function ()
    {
        document.body.appendChild(this.dom);
    },

    close: function ()
    {
        this.dom.remove();
    }
});

// -----------------------------------------------------------------------------
function buildUi(jsonUi, _parent)
{
    args = [];

    if (jsonUi.args) {
        jsonUi.args.forEach(function (arg)
        {
            if (typeof arg === 'string') {
                args.push("'" + arg + "'");
            } else {
                args.push(arg);
            }
        });
    }

    var ui = eval('new ' + jsonUi.type + '(' + args.join(', ') + ');'); 

    if (jsonUi.children) {
        for (var i = 0, len = jsonUi.children.length; i < len; i++) {
            var child = jsonUi.children[i];
            var childUi = buildUi(child, ui);
        }
    }

    if (_parent === undefined) {
        return ui;
    } else {
        _parent.add(ui, jsonUi.grow);
    }
}

function getUi(id)
{
    return UiElements[id];
}
