Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    myStore: undefined,
    myGrid: undefined,
    items: [ // pre-define the general layout of the app; the skeleton (ie. header, content, footer)
        {
            xtype: 'container', // this container lets us control the layout of the pulldowns; they'll be added below
            itemId: 'pulldown-container',
            layout: {
                type: 'hbox', // 'horizontal' layout
                align: 'stretch'
            }
        }
    ],
    launch: function () {
        this._getScheduleState();
    },
    _loadData: function () {
        var me = this;
        var ScheduleState = this.down('#ScheduleStateCombobox').getRecord().get('value'); // remember to console log the record to see the raw data and relize what you can pluck out
        var myFilters = this._getFilters(ScheduleState);
        if (me._myStore) {
            me._myStore.setFilter(myFilters);
            me._myStore.load();
        } else {
            me.myStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'UserStory',
                autoLoad: true,
                filters: myFilters,
                listeners: {
                    load: function (myStore, myData, success) {
                        if (!me.grid) { // only create a grid if it does NOT already exist
                            console.log(myStore, myData, success);
                        }
                    },
                    scope: me
                },
                fetch: ['ObjectID', 'FormattedID', 'Name', 'RevisionHistory', 'Revisions', 'Description', 'User', 'ScheduleState'],
            });
        }
    },
    _getFilters: function (ScheduleState) {
        var f = Ext.create('Rally.data.wsapi.Filter', {
            property: 'ScheduleState',
            operation: '=',
            value: ScheduleState
        });
        console.log(f);
        return f;
    },
    _getScheduleState: function () {
        var ScheduleStateCombobox = Ext.create('Ext.Container', {
            items: [{
                itemId: 'ScheduleStateCombobox',
                fieldLabel: 'Schedule State',
                labelAlign: 'right',
                width: 400,
                xtype: 'rallyfieldvaluecombobox',
                model: 'User Story',
                field: 'ScheduleState',
                listeners: {
                    ready: this._loadData,
                    select: this._loadData,
                    scope: this
                }
            }],

        });
        this.down('#pulldown-container').add(ScheduleStateCombobox); // add the iteration list to the pulldown container so it lays out horiz, not the app!
    },
});