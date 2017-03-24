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
            value: 'Accepted'
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
                that._makeGrid(results);
            },
            failure: function () {
                console.log("oh noes!");
            }
        });
    },
    _getRevHistoryModel: function (artifacts) {
        this._artifacts = artifacts;
        return Rally.data.ModelFactory.getModel({
            type: 'RevisionHistory'
        });
    },
    _onRevHistoryModelCreated: function (model) {
        var that = this;
        var promises = [];
        _.each(this._artifacts, function (artifact) {
            var ref = artifact.get('RevisionHistory')._ref;
            console.log(artifact.get('FormattedID'), ref);
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
        var that = this;
        var artifactsWithRevs = [];
        _.each(that._artifacts, function (artifact) {
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

        this.add({
            xtype: 'rallygrid',
            showPagingToolbar: true,
            showRowActionsColumn: true,
            editable: true,
            store: Ext.create('Rally.data.custom.Store', {
                data: artifactsWithRevs
            }),
            viewConfig: {
                plugins: {
                    ddGroup: 'people-group',
                    ptype: 'gridviewdragdrop',
                    enableDrop: true
                }
            },
            columnCfgs: [{
                    text: 'FormattedID',
                    dataIndex: 'artifact',
                    renderer: function (value) {
                        return '<a href="https://rally1.rallydev.com/#/detail/userstory/' + value.ObjectID + '" target="_blank">' + value.FormattedID + '</a>';
                    }
                },
                {
                    text: 'Name',
                    dataIndex: 'artifact',
                    flex: 1,
                    renderer: function (value) {
                        return value.Name;
                    }
                },
                {
                    text: 'Schedule State',
                    dataIndex: 'artifact',
                    renderer: function (value) {
                        return value.ScheduleState;
                    }
                },
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
                {
                    text: 'Revision # and description',
                    dataIndex: 'revisions',
                    flex: 1,
                    cls: 'test',
                    renderer: function (value) {
                        var html, cssResult;
                        html = '';
                        _.each(value, function (output) {

                            if (output.data.Description.includes("Original") === true) {
                                cssResult = 'Original';
                            }
                            html += '<div class="wrapper">';

                            var numberDiv      = '<div class="n-t n-'+cssResult+'">' + output.data.RevisionNumber + '</div>';
                            var DescriptionDiv = '<div class="d-t d-'+cssResult+'">' + output.data.Description + '</div>';
                            html += numberDiv + DescriptionDiv;

                            html += '</div>';


                        });
                        return html;
                    },
                }
            ]
        });

    },
    _cssRowFilter: function (output) {
        console.log('llll');
        var myColour = 'darkgrey';
        if (output.data.Description.includes("Original") === true) {
            myColour = 'purple';
        }
        if (output.data.Description.includes("Accepted") === true) {
            myColour = 'green';
        }
        if (output.data.Description.includes("Live") === true) {
            myColour = 'darkgreen';
        }
        if (output.data.Description.includes("In-Progress") === true) {
            myColour = 'orange';
        }
        if (output.data.Description.includes("Completed") === true) {
            myColour = 'blue';
        }

        var html = '<span style="color:' + myColour + ' !important">ghdfgdfghdfg' + output.data.RevisionNumber + " " + output.data.Description + '</span></br></br>'
        console.log(html);
        return html;

    },
});


                    that.myStore.load().then({
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
                            that._makeGrid(results); // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
                        },
                        failure: function () {
                            console.log("There's a rattle in the manifold...");
                        },
                    });