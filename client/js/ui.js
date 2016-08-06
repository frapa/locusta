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
    init: function (user, type, timestamp, message)
    {
        klasses = ['message'];
        if (user === locusta.username) {
            klasses.push('own-message');
        }

        this.sup('ver', undefined, klasses.join(' '));

        var messageContent = new Box('hor', undefined, 'message-content', message);
        var formattedDate = strftime('%H:%M - %e %b %Y', new Date(timestamp));
        var time = new Box('hor', undefined, 'message-time', formattedDate);

        this.add(messageContent);
        this.add(time);
    }
});

var Button = Ui.extend({
    text: '',
    className: 'button',

    init: function (text, callback, id, klass)
    {
        this.text = text;

        klassen = [this.className];
        if (klass) {
            klassen.push(klass);
        }

        this.dom = this.newElement('button', klassen.join(' '), text, {
            click: callback
        });

        this.addId(id);
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
