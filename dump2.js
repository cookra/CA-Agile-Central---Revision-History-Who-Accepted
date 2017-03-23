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


              if (this.artifacts) {
        console.log('store exists');
        me.defectStore.setFilter(myFilters);
        me.defectStore.load();

      // create store
    } else {
        

        console.log('\033[2J'); // clear the console
        //var today = new Date().toISOString();
        var artifacts = Ext.create('Rally.data.wsapi.Store', {
            model: 'User Story',
            limit: Infinity,
            autoLoad: true,
            filters: this._getFilters(),
            fetch: ['ObjectID', 'FormattedID', 'Name', 'RevisionHistory', 'Revisions', 'Description', 'User', 'ScheduleState'],
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
                this._makeGrid(results);
            },
            scope: this,
            failure: function () {
                console.log("There's a rattle in the manifold...");
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
        var promises = [];
        _.each(this._artifacts, function (artifact) {
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
        console.log('OUTPUT > ',artifactsWithRevs.length);
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