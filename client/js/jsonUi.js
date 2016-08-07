var jsonUi = {
  type: 'Box',
  args: ['ver'],
  children: [
    {
      type: 'Box',
      args: ['hor', 'header', 'header'],
      grow: 0,
      children: [
        {
          type: 'Button',
          args: ['New contact', function () { newContact(); }, 0, 'toolbar-action']
        },
        {
          type: 'Button',
          args: ['New conversation', function () { newConversation(); }, 0, 'toolbar-action']
        },
        {
          type: 'Box',
          args: ['hor'],
          grow: 1
        },
        {
          type: 'Checkbox',
          args: ['Notifications', function (event) { locusta.notificationEnabled = event.target.checked; }, 'notification-enabled']
        },
      ]
    },
    {
      type: 'Box',
      args: ['hor'],
      children: [
        {
          type: 'Box',
          grow: 0,
          args: ['ver', 'sidebar', 'sidebar'],
          children: []
        },
        {
          type: 'Box',
          args: ['ver', 'main', 'main'],
          children: [
            /*{
              type: 'Box',
              args: ['ver', 'message-list', 'message-list']
            },*/
            {
              type: 'Box',
              grow: 0,
              args: ['hor', 'typing-bar', 'typing-bar'],
              children: [
                {
                  type: 'Textarea',
                  args: ['message-text']
                },
                {
                  type: 'Button',
                  args: ['Send', function () { sendMessage(); }]
                }
              ]
            }
          ]
        }
      ]
    },
  ]
};

var jsonLogin = {
  type: 'Box',
  args: ['hor', 'login-hor'],
  children: [
    {
      type: 'Box',
      args: ['ver', 'login-ver'],
      children: [
        {
          type: 'Input',
          args: ['text', '', 'username']
        },
        {
          type: 'Input',
          args: ['password', '', 'password']
        },
        {
          type: 'Button',
          args: ['Login', function () { login(); }]
        }
      ]
    }
  ]
};

var jsonNewContactUi = {
  type: 'Box',
  args: ['ver', 'new-contact-dialog'],
  children: [
    {
      type: 'Input',
      args: ['text', '', 'contact_username', 'Username']
    },
    {
      type: 'Input',
      args: ['text', '', 'first_name', 'First name']
    },
    {
      type: 'Input',
      args: ['text', '', 'last_name', 'Last name']
    },
    {
      type: 'Button',
      args: ['Save', function () { saveContact(); }]
    },
    {
      type: 'Button',
      args: ['Cancel', function () { dismiss('new-contact-dialog'); }]
    }
  ]
};

var jsonContactListUi = {
  type: 'Box',
  args: ['ver', 'new-contact'],
  children: [
    {
      type: 'Box',
      args: ['hor']
    },
    {
      type: 'Box',
      args: ['ver', 'contact-list']
    }
  ]
};

/*
{
  type: 'Box',
  args: [],
  children: []
}
*/
