// R Cook
// v1.0.1
// 2017-03-02
// Template script to load a viewport with 5 panels
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    myFetch: [],
    myCols: [],
    // Filter theFetch
    // 0 -> Hide columns
    // 1 -> Add Column
    // 1/0 -> Both will be fetched from the query
    dataList: [
        [1, 'FormattedID'],
        [1, 'Name'],
        [1, 'Project'],
        [1, 'Owner'],
        [1, 'CreatedDate'],
        [1, 'DisplayColor'],
        [1, 'ScheduleState'],
        [1, 'Blocked'],
        [1, 'DirectChildrenCount'],
        [1, 'Defects'],
        [1, 'Iteration'],
        [1, 'PlanEstimate'],
        [1, 'Predecessors'],
        [1, 'Successors'],
        [1, 'Release'],
        [1, 'TestCases'],
    ],
    launch: function () {
        this._mask();
        console.log('\033[2J'); // clear the console
        var me = this;
        for (var j = 0; j < this.dataList.length; j++) {
            if (this.dataList[j][0] === 1) {
                this.myFetch.push(this.dataList[j][1]);
                this.myCols.push(this.dataList[j][1]);
                console.log('@ _launch Filter Fetch (+) ', this.dataList[j][1]);
            }
            if (this.dataList[j][0] === 0) {
                this.myFetch.push(this.dataList[j][1]);
                console.log('@ _launch Filter Fetch (-) ', this.dataList[j][1]);
            }
        }
        this._loadData();
    },
    _getFilters: function () {
        var myFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'Feature',
            operation: '=',
            value: null
        });
        return myFilter;
    },
    _loadData: function () {
        var me = this;
        var myFilters = this._getFilters();
        console.log('my filter', myFilters.toString());
        if (me.userStoryStore) {
            console.log('store exists');
            me.userStoryStore.setFilter(myFilters);
            me.userStoryStore.load();
        } else {
            console.log('creating store');
            me.userStoryStore = Ext.create('Rally.data.wsapi.Store', { // create 
                model: 'User Story',
                limit: 200,
                autoLoad: true,
                filters: myFilters,
                listeners: {
                    load: function (myStore, myData, success) {
                        console.log('got data!', myStore, myData);
                        if (!me.userStoryGrid) {
                            me._createGrid(myStore, myData);
                        }
                    },
                    scope: me
                },
                fetch: this.myFetch
            });
        }
    },

    _mask: function () {
        //this.add(Ext.create('App.Loader')._build('bar'));
    },
    _createGrid: function (myStore, myData) {
        var xData1 = this.getContext().getUser();
        var xData2 = this.getContext().getProject();
        var xData3 = this.getContext().getWorkspace();
        var appVersion = Ext.create('App.System')._this_Application_Details('inapp');
        var myColours_Barclays = Ext.create('App.Config').PbarclaysColours_5
        var bodyStyle = 'font-size:20px;padding:10px; color:' + myColours_Barclays[3] + ';';
        var tabColour_1 = myColours_Barclays[0];
        var tabColour_2 = myColours_Barclays[0];
        var tabColour_3 = myColours_Barclays[0];
        var panelBaseColor = myColours_Barclays[0];
        var colour_Background_Darken = Ext.create('App.Tools')._shadeBlendConvert(panelBaseColor, -20);
        var colour_Background = 'background: repeating-linear-gradient(  -45deg,  ' + panelBaseColor + ',' + panelBaseColor + ' 10px,  ' + colour_Background_Darken + ' 10px,  ' + colour_Background_Darken + ' 20px);';


        //PbarclaysColours_5: ['#145FAC', '#437EA0', '#00AEEF', '#FFF', '#FFA000'],

        var viewport = Ext.create('Ext.container.Viewport', {
            items: [{
                region: 'north',
                collapsible: true,
                items: [{
                    xtype: 'tabpanel',
                    width: '100%',
                    items: [{
                        title: 'About',
                        width: '100%',
                        html: 'This custom page display artifacts that are considered to be orphaned',
                        height: 50,
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: tabColour_1,
                            }
                        },
                        /*
                        buttons: [{
                            text: 'Button 1'
                        }]
                        */
                    }, {
                        title: 'Version',
                        width: '100%',
                        html: appVersion[2] + ' ' + appVersion[4] + ' ' + appVersion[3] + ' ' + appVersion[6],
                        height: 50,
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: tabColour_2,
                            }
                        },
                    }, {
                        title: 'Support',
                        width: '100%',
                        height: 50,
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: tabColour_3,
                            }
                        },
                        items: [{
                            xtype: 'button',
                            text: 'Support',
                            height: 25,
                            style: {
                                backgroundColor: 'red',
                            },
                            listeners: {
                                afterrender: function (v) {
                                    v.el.on('click', function () {
                                        console.log('[ ' + myStore + ' ] Clicked ');
                                        Ext.create('App.Emailer')._emailer(myData, xData1, xData2, xData3);
                                    });
                                },
                                scope: this
                            },
                        }]
                    }]
                }]
            }, {
                region: 'south',
                layout: 'fit',
                flex: 1,
                items: [{

                    xtype: 'tabpanel',
                    width: '100%',
                    items: [{
                        title: 'User Stories',
                        width: '100%',
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: '#808080',
                            }
                        },
                        items: [{
                            xtype: 'rallygrid',
                            store: myStore,
                            height: '100%',
                            columnCfgs: this.myCols,
                        }]
                    }, {
                        title: 'Features',
                        width: '100%',
                        html: 'X',
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: '#808080',
                            }
                        },
                    }, {
                        title: 'Features',
                        width: '100%',
                        html: 'X',
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: '#808080',
                            }
                        },
                    }, {
                        title: 'Business outcomes',
                        width: '100%',
                        html: 'X',
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: '#808080',
                            }
                        },
                    }, {
                        title: 'Portfolio Objectives',
                        width: '100%',
                        html: 'X',
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: '#808080',
                            }
                        },
                    }, {
                        title: 'Strategic Objectives',
                        width: '100%',
                        html: 'X',
                        bodyStyle: colour_Background + bodyStyle,
                        cls: 'fixTabMargins',
                        tabConfig: {
                            style: {
                                background: '#808080',
                            }
                        },
                    }],


                }]
            }]
        });
    },
});




////


Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    _artifacts: [],
    dataList: [
        [1, 'FormattedID'],
        [0, 'Name'],
        [0, 'Project'],
        [0, 'Owner'],
        [0, 'CreatedDate'],
        [0, 'DisplayColor'],
        [0, 'ScheduleState'],
        [1, 'Blocked'],
        [0, 'DirectChildrenCount'],
        [1, 'Defects'],
        [1, 'Iteration'],
        [1, 'PlanEstimate'],
        [1, 'Predecessors'],
        [1, 'Successors'],
        [1, 'Release'],
        [1, 'TestCases'],
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
        var artifacts = Ext.create('Rally.data.wsapi.Store', {
            model: 'User Story',
            limit: 200,
            autoLoad: true,
            filters: this._getFilters(),
            listeners: {
                load: function (myStore, myData, success) {
                    console.log('got data!', myStore, myData);
                    if (!this.artifacts) {
                        this._build(myStore,myData);
                    }
                },
                scope: this
            },
            fetch: ['ObjectID', 'FormattedID', 'Name', 'RevisionHistory', 'Revisions', 'Description', 'User', 'ScheduleState'],
        });
    },
    _build: function (artifacts,data) {
        console.log(1,data);
        this._getRevHistoryModel(data);
        console.log(2,data);
        this._onRevHistoryModelCreated(data);
        console.log(3,data);
        this._onModelLoaded(data);
        console.log(4,data);
        this._stitchDataTogether(data);
        console.log(5,data);
        this._makeGrid(data);
    },
    _getRevHistoryModel: function (artifacts) {
        console.log(1);
        this._artifacts = artifacts;
        return Rally.data.ModelFactory.getModel({
            type: 'RevisionHistory'
        });
    },
    _onRevHistoryModelCreated: function (model) {
        console.log(2);
        var promises = [];
        _.each(this._artifacts, function (artifact) {
            var ref = artifact.get('RevisionHistory')._ref;
            promises.push(model.load(Rally.util.Ref.getOidFromRef(ref)));
        });
        return Deft.Promise.all(promises);
    },

    _onModelLoaded: function (histories) {
        console.log(3);
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
        console.log(4);
        var artifactsWithRevs = [];
        _.each(this._artifacts, function (artifact) {
            artifactsWithRevs.push({
                artifact: artifact.data
            });
        });
        var i = 0;
        _.each(revhistories, function (revisions) {
            artifactsWithRevs[i].revisions = revisions;
            i++;
        });
        return artifactsWithRevs;

    },

    _makeGrid: function (artifactsWithRevs) {
        console.log(5);
        console.log('OUTPUT > ', artifactsWithRevs.length);
        this.add({
            xtype: 'rallygrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: artifactsWithRevs
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

                        if (output.ScheduleState.includes("Backlog") === true) {
                            cssResult = 'Backlog';
                        }
                        if (output.ScheduleState.includes("Defined") === true) {
                            cssResult = 'Defined';
                        }
                        if (output.ScheduleState.includes("In-Progress") === true) {
                            cssResult = 'In-Progress';
                        }
                        if (output.ScheduleState.includes("Completed") === true) {
                            cssResult = 'Completed';
                        }
                        if (output.ScheduleState.includes("Accepted") === true) {
                            cssResult = 'Accepted';
                        }
                        if (output.ScheduleState.includes("Live") === true) {
                            cssResult = 'Live';
                        }
                        html += '<div class="wrapper">';

                        var authorDiv = '<div class="a-t d-' + cssResult + '">' + output.ScheduleState + '</div>';
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
                        var html, cssResult, htmlSymbol;
                        html = '';
                        _.each(value, function (output) {
                            if (output.data.Description.includes("KANBAN") === true) {
                                cssResult = 'kanban';
                                htmlSymbol = '9744';
                            }
                            if (output.data.Description.includes("RANK moved down") === true) {
                                cssResult = 'rank-down';
                                htmlSymbol = '8681';
                            }
                            if (output.data.Description.includes("RANK moved up") === true) {
                                cssResult = 'rank-up';
                                htmlSymbol = '8679';
                            }
                            if (output.data.Description.includes("Recovered from Recycle") === true) {
                                cssResult = 'recycle-removed';
                                htmlSymbol = '9851';
                            }
                            if (output.data.Description.includes("Moved to Recycle") === true) {
                                cssResult = 'recycle-added';
                                htmlSymbol = '9851';
                            }
                            if (output.data.Description.includes("DISCUSSION removed") === true) {
                                cssResult = 'discussion-removed';
                                htmlSymbol = '9990';
                            }
                            if (output.data.Description.includes("DISCUSSION added") === true) {
                                cssResult = 'discussion-added';
                                htmlSymbol = '9990';
                            }
                            if (output.data.Description.includes("REASON removed") === true) {
                                cssResult = 'blocked-reason-removed';
                                htmlSymbol = '2600';
                            }
                            if (output.data.Description.includes("REASON added") === true) {
                                cssResult = 'blocked-reason-added';
                                htmlSymbol = '9998';
                            }
                            if (output.data.Description.includes("BLOCKED changed from [true]") === true) {
                                cssResult = 'blocked-false';
                                htmlSymbol = '9728';
                            }
                            if (output.data.Description.includes("BLOCKED changed from [false]") === true) {
                                cssResult = 'blocked-true';
                                htmlSymbol = '9729';
                            }
                            if (output.data.Description.includes("FEATURE") === true) {
                                cssResult = 'feature';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("TEST CASE") === true) {
                                cssResult = 'test-added';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("OWNER") === true) {
                                cssResult = 'owner';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("READY changed from [false]") === true) {
                                cssResult = 'ready-true';
                                htmlSymbol = '9734';
                            }
                            if (output.data.Description.includes("READY changed from [true]") === true) {
                                cssResult = 'ready-false';
                                htmlSymbol = '9728';
                            }
                            if (output.data.Description.includes("EXPEDITE changed from [false]") === true) {
                                cssResult = 'expedite-true';
                                htmlSymbol = '9734';
                            }
                            if (output.data.Description.includes("EXPEDITE changed from [true]") === true) {
                                cssResult = 'expedite-false';
                                htmlSymbol = '9728';
                            }
                            if (output.data.Description.includes("ITERATION") === true || output.data.Description.includes("RELEASE") === true) {
                                cssResult = 'iter-release';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("PLAN ESTIMATE") === true) {
                                cssResult = 'plan-estimate';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("COLOR") === true) {
                                cssResult = 'colour';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("DESCRIPTION") === true || output.data.Description.includes("NOTES") === true || output.data.Description.includes("ACCEPTANCE CRITERIA") === true || output.data.Description.includes("TAGS") === true) {
                                cssResult = 'desc-added';
                                htmlSymbol = '9758';
                            }
                            if (output.data.Description.includes("Original") === true) {
                                cssResult = 'Original';
                                htmlSymbol = '9827';
                            }
                            if (output.data.Description.includes("to [Backlog]") === true) {
                                cssResult = 'Backlog';
                                htmlSymbol = '9744';
                            }
                            if (output.data.Description.includes("to [Defined]") === true) {
                                cssResult = 'Defined';
                                htmlSymbol = '9744';
                            }
                            if (output.data.Description.includes("to [In-Progress") === true) {
                                cssResult = 'In-Progress';
                                htmlSymbol = '9744';
                            }
                            if (output.data.Description.includes("to [Completed") === true) {
                                cssResult = 'Completed';
                                htmlSymbol = '9744';
                            }
                            if (output.data.Description.includes("to [Accepted") === true) {
                                cssResult = 'Accepted';
                                htmlSymbol = '9744';
                            }
                            if (output.data.Description.includes("to [Live]") === true) {
                                cssResult = 'Live';
                                htmlSymbol = '9745';
                            }
                            html += '<div class="wrapper">';
                            var numberDiv = '<div class="n-t n-' + cssResult + '">' + output.data.RevisionNumber + '</div>';
                            var symbolDiv = '<div class="g-t"><span style="font-family:Wingdings">&#' + htmlSymbol + '</span></div>';
                            var authorDiv = '<div class="a-t d-' + cssResult + '">' + output.data.User._refObjectName + '</div>';
                            var DescriptionDiv = '<div class="d-t d-' + cssResult + '">' + output.data.Description + '</div>';
                            html += numberDiv + symbolDiv + authorDiv + DescriptionDiv;
                            html += '</div>';
                        });
                        return html;
                    },
                }
            ]
        });
    },
});