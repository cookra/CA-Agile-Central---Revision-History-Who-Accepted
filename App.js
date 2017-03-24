Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    myStore: undefined,
    myGrid: undefined,

    // TODO
    // Look at creation date delta?
    // Fix single grid load from State
    // Fix revision count on next selection

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

    _getFilters: function () {
        var filterAccepted = Ext.create('Rally.data.wsapi.Filter', {
            property: 'ScheduleState',
            operation: '=',
            value: 'Accepted'
        });

        var filterLive = Ext.create('Rally.data.wsapi.Filter', {
            property: 'ScheduleState',
            operation: '=',
            value: 'Live'
        });
        return filterAccepted.or(filterLive);
    },
    launch: function () {
        console.log('\033[2J'); // clear the console
        //var today = new Date().toISOString();
        var that = this;
        var artifacts = Ext.create('Rally.data.wsapi.Store', {
            model: 'UserStory',
            fetch: ['ObjectID', 'FormattedID', 'Name', 'RevisionHistory', 'Revisions', 'Description', 'User', 'ScheduleState'],
            autoLoad: true,
            filters: this._getFilters(),
        });
        artifacts.load().then({
            success: this._getRevHistoryModel,
            scope: this
        }).then({
            success: this._onRevHistoryModelCreated,
            scope: this
        }).then({
            success: this._onModelLoaded,
            scope: this
        }).then({
            success: this._stitchDataTogether,
            scope: this
        }).then({
            success: function (results) {
                that._createGrid(results);
            },
            failure: function () {
                console.log("oh noes!");
            }
        });
    },
    _getRevHistoryModel: function (myStore) {
        this._myStore = myStore;
        return Rally.data.ModelFactory.getModel({
            type: 'RevisionHistory'
        });
    },
    _onRevHistoryModelCreated: function (model) {
        var promises = [];
        _.each(this._myStore, function (artifact) {
            var ref = artifact.get('RevisionHistory')._ref;
            promises.push(model.load(Rally.util.Ref.getOidFromRef(ref)));
        });
        return Deft.Promise.all(promises);
    },

    _onModelLoaded: function (histories) {
        var promises = [];
        _.each(histories, function (history) {
            var revisions = history.get('Revisions');
            revisions.store = history.getCollection('Revisions', {
                fetch: ['User', 'Description', 'CreationDate', 'RevisionNumber']
            });
            promises.push(revisions.store.load());
        });
        return Deft.Promise.all(promises);
    },
    _stitchDataTogether: function (revhistories) {

        var myStoreWithRevs = [];
        _.each(this._myStore, function (artifact) {
            myStoreWithRevs.push({
                artifact: artifact.data
            });
        });
        var i = 0;
        _.each(revhistories, function (revisions) {
            myStoreWithRevs[i].revisions = revisions;
            i++;
        });
        return myStoreWithRevs;

    },

    _createGrid: function (myStoreWithRevs) {
        this.myGrid = Ext.create('Rally.ui.grid.Grid', {
            store: Ext.create('Rally.data.custom.Store', {
                data: myStoreWithRevs
            }),
            columnCfgs: [{
                    text: 'FormattedID',
                    dataIndex: 'artifact',
                    renderer: function (value) {
                        var html;
                        html = '';
                        html += '<div class="wrapper">';
                        var authorDiv = '<div class="name-t"><a href="https://rally1.rallydev.com/#/detail/userstory/' + value.ObjectID + '" target="_blank">' + value.FormattedID + '</a></div>';
                        html += authorDiv;
                        html += '</div>';
                        return html;
                    }
                },
                {
                    text: 'Name',
                    dataIndex: 'artifact',
                    flex: 1,
                    renderer: function (output) {
                        var html;
                        html = '';
                        html += '<div class="wrapper">';
                        var authorDiv = '<div class="name-t">' + output.Name + '</div>';
                        html += authorDiv;
                        html += '</div>';
                        return html;
                    }
                },
                {
                    text: 'Schedule State',
                    dataIndex: 'artifact',
                    renderer: function (output) {
                        var html, cssResult;
                        html = '';
                        switch (true) {
                            case (output.ScheduleState.indexOf("Backlog") !== -1):
                                cssResult = 'Backlog';
                                console.log(' CSS Backlog ', cssResult);
                                break;
                            case (output.ScheduleState.indexOf("Defined") !== -1):
                                cssResult = 'Defined';
                                console.log(' CSS Defined ', cssResult);
                                break;
                            case (output.ScheduleState.indexOf("In-Progress") !== -1):
                                cssResult = 'In-Progress';
                                console.log(' CSS In-Progress ', cssResult);
                                break;
                            case (output.ScheduleState.indexOf("Completed") !== -1):
                                cssResult = 'Completed';
                                console.log(' CSS Completed ', cssResult);
                                break;
                            case (output.ScheduleState.indexOf("Accepted") !== -1):
                                cssResult = 'Accepted';
                                console.log(' CSS Accepted ', cssResult);
                                break;
                            case (output.ScheduleState.indexOf("Live") !== -1):
                                cssResult = 'Live';
                                console.log(' CSS Live ', cssResult);
                                break;
                        }
                        html += '<div class="wrapper">';
                        var authorDiv = '<div class="a-t ' + cssResult + '">' + output.ScheduleState + '</div>';
                        html += authorDiv;
                        html += '</div>';
                        return html; //;
                    }
                },
                /*
                {
                    text: 'Revision author',
                    dataIndex: 'revisions',
                    renderer: function (value) {
                        var html = [];
                        _.each(value, function (rev) {
                            html.push(rev.data.User._refObjectName);
                        });
                        return html.join('</br></br>');
                    }
                },
                */
                {
                    text: 'History',
                    dataIndex: 'revisions',
                    flex: 1,
                    cls: 'test',
                    renderer: function (value) {
                        var html = '';
                        _.each(value, function (output) {
                            html += Ext.create('Builder')._go(output);
                        });
                        return html;
                    }
                }
            ]
        });
        this.add(this.myGrid);
    },
});

Ext.define('Builder', {
    _go: function (output) {
        var html, cssResult, icon;
        html = '';

        cssResult = 'white-black';
        icon = 'icon-info';
        
        switch (true) {
            case (output.data.Description.indexOf("MILESTONE") !== -1):
                cssResult = 'purple-white';
                icon = 'icon-calendar';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("DEFECTS added") !== -1):
                cssResult = 'red-white';
                icon = 'icon-defect';
                break;
            case (output.data.Description.indexOf("DEFECT added") !== -1):
                cssResult = 'red-white';
                icon = 'icon-defect';
                break;
            case (output.data.Description.indexOf("DEFECTS removed") !== -1):
                cssResult = 'yellow-black';
                icon = 'icon-defect';
                break;
            case (output.data.Description.indexOf("DEFECT removed") !== -1):
                cssResult = 'yellow-black';
                icon = 'icon-defect';
                break;
            case (output.data.Description.indexOf("DEFECTS STATUS") !== -1):
                cssResult = 'burnt-orange-black';
                icon = 'icon-defect';
                break;
            case (output.data.Description.indexOf("DEFECT STATUS") !== -1):
                cssResult = 'burnt-orange-black';
                icon = 'icon-defect';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("SUCCESSORS") !== -1):
                cssResult = 'teal-white';
                icon = 'icon-predecessor';
                break;
            case (output.data.Description.indexOf("PREDECESSORS") !== -1):
                cssResult = 'teal-white';
                icon = 'icon-predecessor';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("BLOCKED changed from [false]") !== -1):
                cssResult = 'red-white';
                icon = 'icon-blocked';
                break;
            case (output.data.Description.indexOf("BLOCKED changed from [true]") !== -1):
                cssResult = 'green-black';
                icon = 'icon-thumbs-up';
                break;
            case (output.data.Description.indexOf("BLOCKED REASON removed") !== -1):
                cssResult = 'red-white';
                icon = 'icon-thumbs-up';
                break;
            case (output.data.Description.indexOf("BLOCKED REASON added") !== -1):
                cssResult = 'red-white';
                icon = 'icon-blocked';
                break;
            case (output.data.Description.indexOf("BLOCKED REASON changed") !== -1):
                cssResult = 'red-white';
                icon = 'icon-blocked';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("OWNER") !== -1):
                cssResult = 'light-orange-black';
                icon = 'icon-user';;
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("FEATURE") !== -1):
                cssResult = 'pink-white';
                icon = 'icon-portfolio';
                break;
            case (output.data.Description.indexOf("TEST CASE") !== -1):
                cssResult = 'purple-white';
                icon = 'icon-test';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("READY changed from [false]") !== -1):
                cssResult = 'bad-removed';
                icon = 'icon-thumbs-up';
                break;
            case (output.data.Description.indexOf("READY changed from [true]") !== -1):
                cssResult = 'white-black';
                icon = 'icon-cancel';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("EXPEDITE changed from [false]") !== -1):
                cssResult = 'green-black';
                icon = 'icon-post';
                break;
            case (output.data.Description.indexOf("EXPEDITE changed from [true]") !== -1):
                cssResult = 'red-white';
                icon = 'icon-post';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("ITERATION") !== -1):
                cssResult = 'white-black';
                icon = 'icon-empty';
                break;
            case (output.data.Description.indexOf("RELEASE") !== -1):
                cssResult = 'white-black';
                icon = 'icon-empty';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("PROJECT") !== -1):
                cssResult = 'purple-white';
                icon = 'icon-hierarchy';
                break;
            case (output.data.Description.indexOf("PLAN ESTIMATE") !== -1):
                cssResult = 'white-black';
                icon = 'icon-bars';
                break;
            case (output.data.Description.indexOf("COLOR") !== -1):
                cssResult = 'white-black';
                icon = 'icon-color';
                break;
            case (output.data.Description.indexOf("NAME") !== -1):
                cssResult = 'white-black';
                icon = 'icon-comment';
                break;
            case (output.data.Description.indexOf("DESCRIPTION") !== -1):
                cssResult = 'white-black';
                icon = 'icon-comment';
                break;
            case (output.data.Description.indexOf("DISCUSSION removed") !== -1):
                cssResult = 'yellow-black';
                icon = 'icon-comment';
                break;
            case (output.data.Description.indexOf("DISCUSSION added") !== -1):
                cssResult = 'green-black';
                icon = 'icon-comment';
                break;
            case (output.data.Description.indexOf("NOTES") !== -1):
                cssResult = 'white-black';
                icon = 'icon-comment';
                break;
            case (output.data.Description.indexOf("ACCEPTANCE") !== -1):
                cssResult = 'Accepted';
                icon = 'icon-comment';
                break;
            case (output.data.Description.indexOf("TAGS") !== -1):
                cssResult = 'white-black';
                icon = 'icon-addTag';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("TASK ESTIMATE TOTAL changed") !== -1):
                cssResult = 'white-black';
                icon = 'icon-to-do';
                break;
            case (output.data.Description.indexOf("TASK REMAINING TOTAL changed") !== -1):
                cssResult = 'white-black';
                icon = 'icon-to-do';
                break;
            case (output.data.Description.indexOf("TASK added") !== -1):
                cssResult = 'green-black';
                icon = 'icon-task';
                break;
            case (output.data.Description.indexOf("TASKS added") !== -1):
                cssResult = 'green-black';
                icon = 'icon-task';
                break;
            case (output.data.Description.indexOf("TASK STATUS") !== -1):
                cssResult = 'green-black';
                icon = 'icon-task';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("RANK moved down") !== -1):
                cssResult = 'burnt-orange-black';
                icon = 'icon-arrow-down';
                break;
            case (output.data.Description.indexOf("RANK moved up") !== -1):
                cssResult = 'light-orange-black';
                icon = 'icon-arrow-up';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("Original") !== -1):
                cssResult = 'black-orange';
                icon = 'icon-comment';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("to [Backlog]") !== -1):
                cssResult = 'Backlog';
                icon = 'icon-cone';
                break;
            case (output.data.Description.indexOf("to [Defined]") !== -1):
                cssResult = 'Defined';
                icon = 'icon-cone';
                break;
            case (output.data.Description.indexOf("to [In-Progress]") !== -1):
                cssResult = 'In-Progress';
                icon = 'icon-cone';
                break;
            case (output.data.Description.indexOf("to [Completed]") !== -1):
                cssResult = 'Completed';
                icon = 'icon-cone';
                break;
            case (output.data.Description.indexOf("to [Accepted]") !== -1):
                cssResult = 'Accepted';
                icon = 'icon-ok';
                break;
            case (output.data.Description.indexOf("to [Live]") !== -1):
                cssResult = 'Live';
                icon = 'icon-deploy';
                break;
            case (output.data.Description.indexOf("KANBAN") !== -1):
                cssResult = 'move-white';
                icon = 'icon-board';
                break;
        }
        switch (true) {
            case (output.data.Description.indexOf("Recovered from Recycle") !== -1):
                cssResult = 'white-blue';
                icon = 'icon-recycle';
                break;
            case (output.data.Description.indexOf("Moved to Recycle") !== -1):
                cssResult = 'white-blue';
                icon = 'icon-recycle';
                break;
        }


        html += '<div class="wrapper">';
        var numberDiv = '<div class="n-t ' + cssResult + '">' + output.data.RevisionNumber + '</div>';
        var symbolDiv = '<div class="i-t ' + cssResult + '"><span class="' + icon + '"></span></div>';
        var authorDiv = '<div class="a-t ' + cssResult + '">' + output.data.User._refObjectName + '</div>';
        var DescriptionDiv = '<div class="d-t ' + cssResult + '">' + output.data.Description + '</div>';
        html += numberDiv + symbolDiv + authorDiv + DescriptionDiv;
        html += '</div>';

        return html;
    }
});