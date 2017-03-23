Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    _artifacts: [],

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
    launch: function () {
        this._getScheduleState();
    },

    // create and load iteration pulldown 
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
    _loadData: function (artifacts) {
        console.log(Rally.ui.notify.Notifier.show({
            message: 'Notification Message'
        }));
        console.log('\033[2J'); // clear the console
        console.log(this.down('#ScheduleStateCombobox').getRecord());
        var myFilters = this._getFilters(this.down('#ScheduleStateCombobox').getRecord().get('value'));
        artifacts = Ext.create('Rally.data.wsapi.Store', {
            model: 'User Story',
            autoLoad: true,
            filters: myFilters,
            limit: Infinity,
            fetch: ['ObjectID', 'FormattedID', 'Name', 'RevisionHistory', 'Revisions', 'Description', 'User', 'ScheduleState'],
            listeners: {
                load: function () {},
                scope: this
            }
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
            },
        });

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
        console.log(5, revhistories.length, ' ', revhistories);

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
        console.log('@ G');
        this.grid = Ext.create('Rally.ui.grid.Grid', {
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
                        for (var x = 0; x < value.length; x++) {
                            return Ext.create('Builder')._go(value[x]);
                        }
                    }
                }
            ]
        });
        this.add(this.grid);
    },
});

Ext.define('Builder', {

    _icons: function (x) {
        var icon = ['icon-add', 'icon-add-column', 'icon-addTag', 'icon-admin', 'icon-archive', 'icon-arrow-down', 'icon-arrow-left', 'icon-arrow-right', 'icon-arrow-up', 'icon-attachment', 'icon-back', 'icon-bars', 'icon-bell', 'icon-blocked', 'icon-board', 'icon-box', 'icon-calendar', 'icon-cancel', 'icon-change-set', 'icon-chat', 'icon-chevron-down', 'icon-chevron-left', 'icon-chevron-right', 'icon-chevron-up', 'icon-children', 'icon-circle', 'icon-close', 'icon-collapse', 'icon-color', 'icon-comment', 'icon-cone', 'icon-cross', 'icon-dashboard', 'icon-defect', 'icon-defectSuite', 'icon-delete', 'icon-deploy', 'icon-donut', 'icon-dots', 'icon-down', 'icon-down_full', 'icon-down_hollow', 'icon-download', 'icon-drag', 'icon-dropdown', 'icon-edit', 'icon-embed', 'icon-empty', 'icon-enlarge', 'icon-expand', 'icon-export', 'icon-favorite', 'icon-feedback', 'icon-file', 'icon-filter', 'icon-fiveDots', 'icon-flag', 'icon-folder', 'icon-full-arrow-down', 'icon-full-arrow-left', 'icon-full-arrow-right', 'icon-full-arrow-up', 'icon-gear', 'icon-graph', 'icon-grid', 'icon-help', 'icon-hierarchy', 'icon-history', 'icon-home', 'icon-hourglass', 'icon-idea', 'icon-images', 'icon-infinity', 'icon-info', 'icon-info-circle', 'icon-leaf', 'icon-leave', 'icon-left', 'icon-line', 'icon-link', 'icon-lock', 'icon-lock-open', 'icon-mail', 'icon-minus', 'icon-more', 'icon-next', 'icon-none', 'icon-not-favorite', 'icon-ok', 'icon-partial', 'icon-pie', 'icon-plus', 'icon-popup', 'icon-portfolio', 'icon-post', 'icon-predecessor', 'icon-previous', 'icon-print', 'icon-program', 'icon-progress', 'icon-question', 'icon-ready', 'icon-recycle', 'icon-refresh', 'icon-reply-all', 'icon-right', 'icon-right_full', 'icon-right_hollow', 'icon-rss', 'icon-save', 'icon-scope-down', 'icon-scope-up', 'icon-scope-up-down', 'icon-search', 'icon-setup', 'icon-share', 'icon-shrink', 'icon-small-chevron-down', 'icon-small-chevron-left', 'icon-small-chevron-right', 'icon-small-chevron-up', 'icon-snapshot', 'icon-split', 'icon-square', 'icon-story', 'icon-successor', 'icon-tag', 'icon-task', 'icon-test', 'icon-test-run', 'icon-testCase', 'icon-testSet', 'icon-threeDots', 'icon-thumbs-down', 'icon-thumbs-up', 'icon-to-do', 'icon-triangle', 'icon-up', 'icon-upload', 'icon-user', 'icon-user-add', 'icon-users', 'icon-visible', 'icon-warning', 'icon-workspace'];
       
        return icon[x];
    },
    _go: function (output) {
        var html, cssResult, icon;
        html = '';
        if (output.data.Description.includes("LIVE") === true) {
            cssResult = 'live-date';
            icon = 'icon-deploy';
        }
        if (output.data.Description.includes("KANBAN") === true) {
            cssResult = 'kanban';
            icon = 'icon-board';
        }
        if (output.data.Description.includes("RANK moved down") === true) {
            cssResult = 'rank-down';
            icon = 'icon-arrow-down';
        }
        if (output.data.Description.includes("RANK moved up") === true) {
            cssResult = 'rank-up';
            icon = 'icon-arrow-up';
        }
        if (output.data.Description.includes("Recovered from Recycle") === true) {
            cssResult = 'recycle-removed';
            icon = 'icon-recycle';
        }
        if (output.data.Description.includes("Moved to Recycle") === true) {
            cssResult = 'recycle-added';
            icon = 'icon-recycle';
        }
        if (output.data.Description.includes("DISCUSSION removed") === true || output.data.Description.includes("NAME") === true) {
            cssResult = 'discussion-removed';
            icon = 'icon-comment';
        }
        if (output.data.Description.includes("DISCUSSION added") === true) {
            cssResult = 'discussion-added';
            icon = 'icon-comment';
        }
        if (output.data.Description.includes("REASON removed") === true) {
            cssResult = 'blocked-reason-removed';
            icon = 'icon-thumbs-up';
        }
        if (output.data.Description.includes("REASON added") === true || output.data.Description.includes("BLOCKED REASON") === true) {
            cssResult = 'blocked-reason-added';
            icon = 'icon-blocked';
        }
        if (output.data.Description.includes("BLOCKED changed from [true]") === true) {
            cssResult = 'blocked-false';
            icon = 'icon-thumbs-up';
        }
        if (output.data.Description.includes("BLOCKED changed from [false]") === true) {
            cssResult = 'blocked-true';
            icon = 'icon-blocked';
        }
        if (output.data.Description.includes("FEATURE") === true) {
            cssResult = 'feature';
            icon = 'icon-portfolio';
        }
        if (output.data.Description.includes("TEST CASE") === true) {
            cssResult = 'test-added';
            icon = 'icon-test';
        }
        if (output.data.Description.includes("OWNER") === true || output.data.Description.includes("NAMM") === true) {
            cssResult = 'owner';
            icon = 'icon-user';
        }
        if (output.data.Description.includes("READY changed from [false]") === true) {
            cssResult = 'ready-true';
            icon = 'icon-thumbs-up';
        }
        if (output.data.Description.includes("READY changed from [true]") === true) {
            cssResult = 'ready-false';
            icon = 'icon-cancel';
        }
        if (output.data.Description.includes("EXPEDITE changed from [false]") === true) {
            cssResult = 'expedite-true';
            icon = 'icon-post';
        }
        if (output.data.Description.includes("EXPEDITE changed from [true]") === true) {
            cssResult = 'expedite-false';
            icon = 'icon-post';
        }
        if (output.data.Description.includes("ITERATION") === true || output.data.Description.includes("RELEASE") === true) {
            cssResult = 'iter-release';
            icon = 'icon-empty';
        }
        if (output.data.Description.includes("PLAN ESTIMATE") === true) {
            cssResult = 'plan-estimate';
            icon = 'icon-bars';
        }
        if (output.data.Description.includes("COLOR") === true || output.data.Description.includes("TASK") === true) {
            cssResult = 'colour';
            icon = 'icon-color';
        }
        if (output.data.Description.includes("DESCRIPTION") === true || output.data.Description.includes("NOTES") === true || output.data.Description.includes("ACCEPTANCE CRITERIA") === true || output.data.Description.includes("TAGS") === true) {
            cssResult = 'desc-added';
            icon = 'icon-comment';
        }
        if (output.data.Description.includes("Original") === true) {
            cssResult = 'Original';
            icon = 'icon-idea';
        }
        if (output.data.Description.includes("to [Backlog]") === true) {
            cssResult = 'Backlog';
            icon = 'icon-cone';
        }
        if (output.data.Description.includes("to [Defined]") === true) {
            cssResult = 'Defined';
            icon = 'icon-cone';
        }
        if (output.data.Description.includes("to [In-Progress") === true) {
            cssResult = 'In-Progress';
            icon = 'icon-cone';
        }
        if (output.data.Description.includes("to [Completed") === true) {
            cssResult = 'Completed';
            icon = 'icon-cone';
        }
        if (output.data.Description.includes("to [Accepted") === true) {
            cssResult = 'Accepted';
            icon = 'icon-ok';
        }
        if (output.data.Description.includes("to [Live]") === true) {
            cssResult = 'Live';
            icon = 'icon-deploy';
        }
        html += '<div class="wrapper">';
        var numberDiv = '<div class="n-t n-' + cssResult + '">' + output.data.RevisionNumber + '</div>';
        var symbolDiv = '<div class="g-t"><span class="'+icon+'"></span></div>';
        var authorDiv = '<div class="a-t d-' + cssResult + '">' + output.data.User._refObjectName + '</div>';
        var DescriptionDiv = '<div class="d-t d-' + cssResult + '">' + output.data.Description + '</div>';
        html += numberDiv + symbolDiv + authorDiv + DescriptionDiv;
        html += '</div>';

        return html;
    }
});