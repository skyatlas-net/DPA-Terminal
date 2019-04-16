var blessed = require('blessed')
    , contrib = require('blessed-contrib')
    , screen = blessed.screen()
    // , colors = require('colors/safe')
    , sess = require('./session')
    , connUtil = require('./connectionUtil')
    , _ = require('underscore')
    , utils = require('./utils')
    , CircularJSON = require('circular-json');
var colMap2 = [
    // {
    //     field: 'sampleTimeStr',
    //     displayName: '时间'
    // },
    {
        field: 'INST_ID',
        displayName: 'INST'
    },
    {
        field: 'SID',
        displayName: 'SID',

    },
    // {
    //     field: 'TYPE',
    //     displayName: 'TYPE',


    // },
    {
        field: 'USERNAME',
        displayName: 'USER'
    },
    {
        field: 'SQL_ID',
        displayName: 'SQLID',


    },
    {
        field: 'EVENT',
        displayName: 'EVENT'
    },
    {
        field: 'WAIT_CLASS',
        displayName: 'WCLASS'
    },
    {
        field: 'ROW_WAIT_OBJ#',
        displayName: 'OBJ#'
    },
    {
        field: 'ROW_WAIT_FILE#',
        displayName: 'FILE#'
    },
    {
        field: 'MODULE',
        displayName: 'MODULE'
    },
    // {
    //     field: 'PROGRAM',
    //     displayName: 'Program'
    // },
    {
        field: 'MACHINE',
        displayName: 'Machine'
    },
    // {
    //     field: 'OSUSER',
    //     displayName: 'OS USER'
    // }

];

var ArgumentParser = require('argparse').ArgumentParser;

// 创建Argument Parser，解析输入参数
var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'TERMORCL: View Oracle Perf/Stats in Terminal. '
});
parser.addArgument(
    ['-H', '--host'],
    {
        help: 'Oracle Network Hostname|IP Addr'
    }
);
parser.addArgument(
    ['-p', '--port'],
    {
        help: 'Oracle TNS Listener Port'
    }
);
parser.addArgument(
    ['-s', '--service'],
    {
        help: 'Oracle Service Name'
    }
);
parser.addArgument(
    ['-u', '--username'],
    {
        help: 'Oracle UserName'
    }
);
parser.addArgument(
    ['-k', '--passwd'],
    {
        help: 'Oracle Password'
    }
);
var args = parser.parseArgs();
// console.dir(args);
// console.log(args['host']);
// console.log(args['port']);
// console.log(args['service']);
// console.log(args['username']);
// console.log(args['passwd']);
async function getConnection() {
    var conn = await connUtil.getConnection(args['host']||'192.168.0.201', args['port']||'1521',
        args['service']||'orcl', args['username']||'perfstat', args['passwd']||'perfstatdb');
    return conn;
}

var sessions;

var grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

var box = grid.set(1, 0, 5, 12, blessed.box,
    { title: '{red-fg}Title{/red-fg}', content: 'My Box', tags: true });

var tree = contrib.tree({
    parent: box,
    fg: 'green',
    tags: true,
    mouse: true,
    style: { text: "red" }
    , template: { lines: true }

});

// Setup Grid Head Line
var headLine = {};
headLine['version'] = grid.set(0, 0, 1, 1, blessed.box, {
    label: 'VERSION:',
    tags: true,
}),
    headLine['patch'] = grid.set(0, 1, 1, 2, blessed.box, {
        label: 'PATCH',
        tags: true
    }),
    headLine['archivelog'] = grid.set(0, 3, 1, 1, blessed.box, {
        label: 'LOG Mode',
        tags: true,
    }),
    headLine['isRAC'] = grid.set(0, 4, 1, 1, blessed.box, {
        label: 'RAC',
        tags: true,
    }),
    headLine['uptime'] = grid.set(0, 5, 1, 2, blessed.box, {
        label: 'Uptime',
        tags: true,
    }),
    headLine['openMode'] = grid.set(0, 7, 1, 1, blessed.box, {
        label: 'Open Mode',
        tags: true,
    }),
    headLine['scn'] = grid.set(0, 8, 1, 2, blessed.box, {
        label: 'Current SCN',
        tags: true,
    }),
    headLine['flashback'] = grid.set(0, 10, 1, 1, blessed.box, {
        label: 'FlashBack ON',
        tags: true,
    }),
    headLine['dataguard'] = grid.set(0, 11, 1, 1, blessed.box, {
        label: 'Dataguard SwitchOver',
        tags: true,
    });



var eventDistrBox = [];
eventDistrBox[0] = grid.set(6, 0, 1, 3, blessed.box, {
    label: 'Wait Event Distribution ',
    content: 'Blank',
    tags: true
});
eventDistrBox[1] = grid.set(7, 0, 1, 3, blessed.box, {
    label: 'Wait Event Distribution ',
    content: 'Blank',
    tags: true
});
eventDistrBox[2] = grid.set(8, 0, 1, 3, blessed.box, {
    label: 'Wait Event Distribution ',
    content: 'Blank',
    tags: true
});

var waitClassDistrBox = [];
waitClassDistrBox[0] = grid.set(9, 0, 1, 3, blessed.box, {
    label: 'Wait Class Distribution ',
    content: 'Blank',
    tags: true,
});
waitClassDistrBox[1] = grid.set(10, 0, 1, 3, blessed.box, {
    label: 'Wait Class Distribution ',
    content: 'Blank',
    tags: true,
});
waitClassDistrBox[2] = grid.set(11, 0, 1, 3, blessed.box, {
    label: 'Wait Class Distribution ',
    content: 'Blank',
    tags: true,
});

var sqlidDistrBox = [];
sqlidDistrBox[0] = grid.set(6, 3, 1, 3, blessed.box, {
    label: 'Wait Class Distribution ',
    content: 'Blank',
    tags: true,
});
sqlidDistrBox[1] = grid.set(7, 3, 1, 3, blessed.box, {
    label: 'Wait Class Distribution ',
    content: 'Top 1',
    tags: true,
});
sqlidDistrBox[2] = grid.set(8, 3, 1, 3, blessed.box, {
    label: 'Wait Class Distribution ',
    content: 'Top 1',
    tags: true,
});

var userMachineDistrBox = [];
userMachineDistrBox[0] = grid.set(9, 3, 1, 3, blessed.box, {
    label: 'User Machine Distribution ',
    content: 'Blank',
    tags: true,
});
userMachineDistrBox[1] = grid.set(10, 3, 1, 3, blessed.box, {
    label: 'User Machine Distribution ',
    content: 'Blank',
    tags: true,
});
userMachineDistrBox[2] = grid.set(11, 3, 1, 3, blessed.box, {
    label: 'User Machine Distribution ',
    content: 'Blank',
    tags: true,
});

var table = grid.set(6, 6, 1, 6, contrib.table,
    {
        keys: true
        , fg: 'green'
        , label: 'Session Wait Detail'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 6]
    });

var table2 = grid.set(7, 6, 1, 6, contrib.table,
    {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 6]
    });

var table3 = grid.set(8, 6, 1, 6, contrib.table,
    {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 15]
    });

var table4 = grid.set(9, 6, 1, 6, contrib.table,
    {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 15]
    });

var table5 = grid.set(10, 6, 1, 6, contrib.table,
    {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 15]
    });

var table6 = grid.set(11, 6, 1, 6, contrib.table, {
    label: 'Last 10 minitues SQL Wait Event Distribution... ',
    content: 'Blank',
    tags: true,
    fg: 'green',
    columnWidth: [50, 50, 50],
});

// table.focus();

let connection;
let interval;



// tree.on('select',function(node){
//     console.log('tree.select:'+JSON.stringify(node,true,2));
// });


// on Key-Press Event, Re-query Oracle DB
async function onRefresh(ch, key) {

    try {
        if (!connection) {
            // console.log(' create connection in onRefresh...');
            connection = await getConnection();
        }
        sessions = await sess.getCurrActSessions(connection);
        // console.log(sessions);
        var explorer = {
            name: '   ' + utils.pad(' '.repeat(10), 'SID|SER#')
                + utils.pad(' '.repeat(8), 'INST_ID')
                + utils.pad(' '.repeat(15), 'SQL_ID')
                + utils.pad(' '.repeat(40), 'EVENT')
                + utils.pad(' '.repeat(30), 'MACHINE')
                + utils.pad(' '.repeat(30), 'MODULE')
                + utils.pad(' '.repeat(30), 'PROGRAM') + '{red-fg}{blink}[S]...{/}'
            , extended: true
            // Child generation function
            , children: function (self) {
                var result = {};
                var selfUid = self['_uid'];
                // console.log('>>>>>>>>' + selfUid);
                try {
                    // List files in this directory
                    var children;
                    if (selfUid) {
                        children = _.filter(sessions, function (sess) {
                            return sess['_pid'] == selfUid;
                        });
                    }
                    else {
                        children = _.filter(sessions, function (sess) {
                            return !sess['BLOCKING_SESSION'];
                        });
                    }
                    // console.log('>>>>>>>>>>' + JSON.stringify(JSON.stringify(children)) + '<<<<<<<<<<<');

                    // childrenContent is a property filled with self.children() result
                    // on tree generation (tree.setData() call)
                    // console.log('Got children len:'+children.length);
                    if (!self.childrenContent) {
                        for (var child in children) {
                            child = children[child];
                            var hasChild = _.some(sessions, function (sess) {
                                return sess['_pid'] == child['_uid'];
                            });
                            if (hasChild) {
                                //result[child] = {
                                result[child['INST_ID'] + '_' + child['SID']] = {
                                    name: utils.generateSessionDisplay(child),
                                    // getPath: self.getPath,
                                    sid: [child['SID'], child['SERIAL#']],
                                    sqlid: [child['SQL_ID'], child['SQL_CHILD_NUMBER']],
                                    objId: child['ROW_WAIT_OBJ#'],
                                    fileBlock: [child['ROW_WAIT_FILE#'], child['ROW_WAIT_BLOCK#']],
                                    eventParameter: [[child['P1TEXT'], child['P2TEXT'], child['P3TEXT']], [child['P1'], child['P2'], child['P3']]],
                                    extended: true,
                                    children: self.children,
                                    '_uid': child['INST_ID'] + '_' + child['SID'],
                                    '_pid': selfUid,
                                };
                            }
                            else {
                                result[child['INST_ID'] + '_' + child['SID']] = {
                                    name: utils.generateSessionDisplay(child),
                                    // getPath: self.getPath,
                                    sid: [child['SID'], child['SERIAL#']],
                                    sqlid: [child['SQL_ID'], child['SQL_CHILD_NUMBER']],
                                    objId: child['ROW_WAIT_OBJ#'],
                                    fileBlock: [child['ROW_WAIT_FILE#'], child['ROW_WAIT_BLOCK#']],
                                    eventParameter: [[child['P1TEXT'], child['P2TEXT'], child['P3TEXT']], [child['P1'], child['P2'], child['P3']]],
                                    extended: false,
                                    '_uid': child['INST_ID'] + '_' + child['SID'],
                                    '_pid': selfUid,
                                };
                            }

                        }
                    } else {
                        // console.log('xxxx'+JSON.stringify(self.childrenContent));
                        result = self.childrenContent;
                    }
                } catch (e) {
                    console.log('>>>>>>>>>>>>>>>>>> ex:' + e);
                    throw e;
                }
                // console.log('------->' + CircularJSON.stringify(result));

                return result;
            }
        };

        let tab_data = [];

        for (const session of sessions) {
            let row = [];
            for (const col of colMap2) {
                var v = session[col['field']] || '';

                row.push(v);
            }
            tab_data.push(row);
        }

        tree.setData(explorer);
        var arr_evt_dist = utils.get_sess_distribution(sessions, ['EVENT']);

        var active_session_count = sessions.length;
        for (var idx = 0; idx < arr_evt_dist.length && idx <= 2; idx++) {
            var evt = arr_evt_dist[idx];
            var gauge_evt = contrib.gauge({
                label: 'Event%: ' + evt['dist_name'] + evt['session_count'],
                stroke: utils.randomColor(),
                fill: utils.randomColor()
            });
            eventDistrBox[idx].append(gauge_evt);
            gauge_evt.setPercent(evt['session_count'] * 100 / active_session_count);

        }
        arr_evt_dist = utils.get_sess_distribution(sessions, ['WAIT_CLASS']);
        for (var idx = 0; idx < arr_evt_dist.length && idx <= 2; idx++) {
            var evt = arr_evt_dist[idx];
            var gauge_evt = contrib.gauge({
                label: 'WaitClas%: ' + evt['dist_name'] + evt['session_count'],
                stroke: utils.randomColor(),
                fill: utils.randomColor()
            });
            waitClassDistrBox[idx].append(gauge_evt);
            gauge_evt.setPercent(evt['session_count'] * 100 / active_session_count);
        }
        //sqlidDistrBox
        arr_evt_dist = utils.get_sess_distribution(sessions, ['SQL_ID']);
        for (var idx = 0; idx < arr_evt_dist.length && idx <= 2; idx++) {
            var evt = arr_evt_dist[idx];
            var gauge_evt = contrib.gauge({
                label: 'SQL ID%: ' + evt['dist_name'] + evt['session_count'],
                stroke: utils.randomColor(),
                fill: utils.randomColor()
            });
            sqlidDistrBox[idx].append(gauge_evt);
            gauge_evt.setPercent(evt['session_count'] * 100 / active_session_count);
        }

        //userMachineDistrBox
        arr_evt_dist = utils.get_sess_distribution(sessions, ['USERNAME', 'MACHINE']);
        for (var idx = 0; idx < arr_evt_dist.length && idx <= 2; idx++) {
            var evt = arr_evt_dist[idx];
            var gauge_evt = contrib.gauge({
                label: 'USER Machine%: ' + evt['dist_name'] + evt['session_count'],
                stroke: utils.randomColor(),
                fill: utils.randomColor()
            });
            userMachineDistrBox[idx].append(gauge_evt);
            gauge_evt.setPercent(evt['session_count'] * 100 / active_session_count);
        }
        tree.focus();
        plan_info = undefined;
        // initActionInConn();
        screen.render();
    }
    catch (err) {
        console.log(err);
        if (connection) {
            connUtil.closeConnection(connection);
        }
        process.exit(-2);
    }



}

var plan_info = undefined;

// Event Handler: Select Specific Session (Enter)
async function onSessionSelected(node) {
    plan_info = {};
    table.setData({
        headers: ['p1:' + node['eventParameter'][0][0], 'p2:' + node['eventParameter'][0][1], 'p3:' + node['eventParameter'][0][2], 'File#:Block#', 'Object#'],
        data: [
            [node['eventParameter'][1][0], node['eventParameter'][1][1], node['eventParameter'][1][2], node['fileBlock'], node['objId']]
        ]
    });
    var _sqlid = node['sqlid'][0], _sql_child_number = node['sqlid'][1];

    if (_sqlid && connection) {
        plan_info = await sess.getSqlPlanInfo2(connection, _sqlid, _sql_child_number);
        if (plan_info && plan_info.length > 0) {
            plan_info = plan_info[0];
        }
        if (plan_info) {
            table2.setData({
                headers: ['OPTIM Mode', 'OPTIM Cost', 'Module', 'Action', 'EXEC#'],
                data: [
                    [
                        utils.NVL(plan_info['OPTIMIZER_MODE'], ''),
                        utils.NVL(plan_info['OPTIMIZER_COST'], ''),
                        utils.NVL(plan_info['MODULE'], ''),
                        utils.NVL(plan_info['ACTION'], ''),
                        utils.NVL(plan_info['EXECUTIONS_TOTAL'], '')
                    ]
                ]
            });
            table3.setData({
                headers: ['PX EXEC', 'LOADS', 'PARSE', 'Fetchs/Exec', 'Sorts/Exec'],
                data: [
                    [
                        utils.NVL(plan_info['PX_SERVERS_EXECS_TOTAL'], ''),
                        utils.NVL(plan_info['LOADS_TOTAL'], ''),
                        utils.NVL(plan_info['PARSE_CALLS_TOTAL'], ''),
                        utils.NVL(plan_info['FETCHESPE'], ''),
                        utils.NVL(plan_info['SORTSPE'], '')
                    ]
                ]
            });
            table4.setData({
                headers: ['DReads/Exec', 'Buffs/Exec', 'Rows/Exec', 'cpu time/Exec', 'elps time/Exec'],
                data: [
                    [
                        utils.NVL(plan_info['DISKREADPE'], ''),
                        utils.NVL(plan_info['BUFFERGETPE'], ''),
                        utils.NVL(plan_info['ROWPROCESSEDPE'], ''),
                        utils.NVL(plan_info['CPUTIMEPE'], ''),
                        utils.NVL(plan_info['ELAPSETIMEPE'], '')
                    ]
                ]
            });
            table5.setData({
                headers: ['io wait/Exec', 'clst wait/Exec', 'app wait/Exec', 'concurr wait/Exec', 'pl/sql wait/Exec'],
                data: [
                    [
                        utils.NVL(plan_info['IOWAITPE'], ''),
                        utils.NVL(plan_info['CLWAITPE'], ''),
                        utils.NVL(plan_info['APWAITPE'], ''),
                        utils.NVL(plan_info['CCWAITPE'], ''),
                        utils.NVL(plan_info['PLEXECTIMEPE'], '')
                    ]
                ]
            });
            var event_distr = {};
            _.forEach(plan_info['event_wait_secs'], function (item) {
                var event_name = item['EVENT'];
                if (event_name in event_distr) {
                    event_distr[event_name] += item['TIMESECS'];
                }
                else {
                    event_distr[event_name] = item['TIMESECS'];
                }
            });
            var event_distr_arr = [];
            for (var item in event_distr) {
                event_distr_arr.push({
                    'EVENT_NAME': item,
                    'TIMESECS': event_distr[item] * 100 / 600,
                });
            }
            event_distr_arr = _.sortBy(event_distr_arr, 'TIMESECS').reverse();


            if (event_distr_arr.length > 2) {
                event_distr_arr.splice(3, event_distr_arr.length - 3);
            }
            var event_header = [];
            var event_data = [];
            for (var _item of event_distr_arr) {
                event_header.push(_item['EVENT_NAME']);
                event_data.push(Math.round(_item['TIMESECS'] > 100 ? 100 : _item['TIMESECS']) + '%');
            }
            table6.setData({
                headers: event_header,
                data: [
                    event_data
                ]
            });
        }


    }
    screen.render();
}

// ModalForm
var form = undefined;

// Event Handler: key "P" or "Ctrl+P" pressed, show sql exec plan
async function showSqlPlan() {
    if (!plan_info) {
        // console.log('Plan Not Selected!!!');
        return;
    }
    if (!form) {
        // console.log('new form...');
        form = blessed.form({
            parent: screen,
            keys: true,
            tags: true,
            left: 'center',
            top: 'center',
            width: '80%',
            height: '90%',
            bg: 'green',
            label: '{blink}  Press [X] close{/}',
            style: {
                focused: {
                    bg: utils.randomColor(),
                }
            }
        });
    }
    var form_grid = new contrib.grid({ rows: 12, cols: 12, screen: form });

    var closeButton = form_grid.set(0, 0, 1, 12, blessed.button, {
        mouse: true,
        keys: true,
        shrink: true,
        padding: {
            left: 1,
            right: 1
        },
        left: 'center',
        top: 'center',
        shrink: true,
        tags: true,
        name: 'close',
        content: '{center}Close{/}',
        style: {
            bg: 'yellow',
            focus: {
                bg: 'red'
            },
            hover: {
                bg: 'red'
            }
        }
    });
    var sqltext_tab = form_grid.set(1, 0, 6, 12, contrib.table, {
        label: 'SQL Text',
        content: 'sql statement',
        fg: 'green',
        columnSpacing: 2,
        columnWidth: ['120',]
    });
    var plan_tree = form_grid.set(7, 0, 6, 12, contrib.tree, {
        parent: form,
        fg: 'blue',
        tags: true,
        mouse: true,
        border: {
            type: 'line',
            bold: true,
        },

        left: 'center',
        top: 1,
        width: '100%',
        height: '90%',
        style: {
            text: "red",
            focused: {
                bg: utils.randomColor(),
            }
        }
        , template: { lines: true }

    });
    // contrib.tree();
    var explorer = {
        name: utils.pad(' '.repeat(20), 'OPERATION')       // OPERATION varchar2(30)
            + utils.pad(' '.repeat(20), 'OPTIONS')
            + utils.pad(' '.repeat(15), 'SCHEMA')
            + utils.pad(' '.repeat(30), 'OBJECT')
            + utils.pad(' '.repeat(8), 'CARD')
            + utils.pad(' '.repeat(8), 'COST')
            + utils.pad(' '.repeat(10), 'CPU_COST')
            + utils.pad(' '.repeat(10), 'IO_COST')
        , extended: true


        // Child generation function
        , children: function (self) {

            var result = {};
            // var selfPath = self.getPath(self);
            var selfUid = self['ID'];
            // console.log('>>>>>>>>' + selfUid);
            try {
                // List files in this directory
                var children;
                if (selfUid) {
                    children = _.filter(plan_info['items'], function (item) {
                        return item['PARENT_ID'] == selfUid;
                    });
                }
                else {
                    // console.log('   HERE    !!!!'+JSON.stringify(sessions));
                    children = _.filter(plan_info['items'], function (item) {
                        return item['ID'] == 0;
                    });
                }
                // childrenContent is a property filled with self.children() result
                // on tree generation (tree.setData() call)
                // console.log('Got children len:'+children.length);
                if (!self.childrenContent) {
                    for (var child in children) {
                        child = children[child];
                        var hasChild = _.some(plan_info['items'], function (item) {
                            return item['PARENT_ID'] == child['ID'];
                        });
                        if (hasChild) {
                            //result[child] = {
                            result[child['ID'] + ''] = {
                                name: utils.print_plan_item(child),
                                // getPath: self.getPath,
                                ID: child['ID'] + '',
                                PARENT_ID: child['PARENT_ID'],
                                // objId: child['ROW_WAIT_OBJ#'],
                                // fileBlock: [child['ROW_WAIT_FILE#'],child['ROW_WAIT_BLOCK#']],
                                // eventParameter: [[child['P1TEXT'],child['P2TEXT'],child['P3TEXT']],[child['P1'],child['P2'],child['P3']]],
                                extended: true,
                                children: self.children,
                                // '_uid': child['INST_ID']+'_'+child['SID'],
                                // '_pid': selfUid,
                            };
                        }
                        else {
                            result[child['ID'] + ''] = {
                                name: utils.print_plan_item(child),
                                // getPath: self.getPath,
                                ID: child['ID'] + '',
                                PARENT_ID: child['PARENT_ID'],
                                // objId: child['ROW_WAIT_OBJ#'],
                                // fileBlock: [child['ROW_WAIT_FILE#'],child['ROW_WAIT_BLOCK#']],
                                // eventParameter: [[child['P1TEXT'],child['P2TEXT'],child['P3TEXT']],[child['P1'],child['P2'],child['P3']]],
                                extended: false,
                                // '_uid': child['INST_ID']+'_'+child['SID'],
                                // '_pid': selfUid,
                            };
                        }

                    }
                } else {
                    // console.log('xxxx'+JSON.stringify(self.childrenContent));
                    result = self.childrenContent;
                }
            } catch (e) {
                console.log(e);
            }
            // console.log('------->' + CircularJSON.stringify(result));

            return result;
        }
    };

    plan_tree.setData(explorer);
    // form.insertBottom('{yellow-fg}{blink}Press X Close Window.{/}');

    var sqltexts = await sess.getSqlText(connection, plan_info['SQL_ID']);

    sqltext_tab.setData({
        headers: ['SQL TEXT',],
        data: sqltexts
    });

    form.on('submit', function (data) {
        form.setContent('Submitted.');
        screen.render();
    });

    form.on('reset', function (data) {
        form.setContent('Canceled.');
        setTimeout(function () {
            if (form) {
                form.detach();
                form = undefined;
            }

            screen.render();
        }, 300);
        screen.render();
    });

    form.on('focus', function () {
        plan_tree.focus();
    });
    closeButton.on('press', function () {
        form.reset();
    });
    plan_tree.focus();

    screen.render();

}

screen.key(['tab'], function (ch, key) {
    // console.log('focused'+CircularJSON.stringify(screen.focused));
    if (screen.focused == tree.rows) {
        // tree.setLabel('');
        // table.focus();
        if (form) {
            console.log('form focus...');
            form.focus();
        }
    }
    else {
        // tree.border = {
        //     type: 'bg',
        //     ch: '#'
        // };
        console.log('session tree focus...');
        // tree.setLabel('## Move Up & Down Inspect Session ##');
        tree.focus();
    }
    // screen.render();
});
screen.key(['s', 'S', 'C-s'], function (ch, key) {
    tree.focus();
});


// Select One Active Session...
tree.on('select', onSessionSelected);

function cleanElementLines(element) {
    let tot_lines = element.getLines();
    for (let _idx=0; _idx<tot_lines; _idx++) {
        element.clearLine(_idx+1);
    }
}

async function initActionInConn() {
    try {
        if (!connection) {
            // console.log('create new connection...');
            connection = await getConnection();
        }
        let db_overview = await sess.getDbOverview(connection);
        var instance_info = db_overview['instance_info'];
        var version_str = [];
        var uptime_arr = [];

        for (var inst of instance_info) {
            version_str.push(inst['INSTANCE_NAME'] + ':' + inst['VERSION']);
            uptime_arr.push(inst['INSTANCE_NAME'] + ':' + inst['STARTUP_TIME']);
            // console.log(inst);
        }
        var database_info = db_overview['database_info'][0];
        var last_patch = db_overview['last_patch'][0]['PATCH'];
        // cleanElementLines(headLine['version']);
        // headLine['version'].setLine(1,'{center}{white-fg} VERSION: {/}');
        for (let _idx=0; _idx<version_str.length;_idx++) {
            let str = version_str[_idx];
            headLine['version'].setLine(_idx+1, '{green-bg}' + str + '{/}');
        }
        // headLine['patch'].setLine(1, '{center}{white-fg}PATCH:{/}');
        headLine['patch'].setLine(1, '{red-bg}' + last_patch + '{/}');
        var archive_log = database_info['LOG_MODE'];
        if (archive_log == 'NOARCHIVELOG') {
            headLine['archivelog'].style.bg = 'red';
        }
        else {
            headLine['archivelog'].style.bg = 'green';
        }
        // headLine['archivelog'].setLine(1, '{center}{white-fg}LOG Mode:' + '{/}');
        headLine['archivelog'].setLine(1, '{center}' + archive_log + '{/}');
        // headLine['isRAC'].setLine(1, '{center}{white-fg}RAC:{/}');
        headLine['isRAC'].setLine(1, '{center}' + db_overview['israc'][0]['ISRAC'] + '{/}');
        // cleanElementLines(headLine['isRAC']);
        // headLine['uptime'].setLine(1, '{center}{white-fg}Uptime:{/}');
        for (let _idx=0; _idx<uptime_arr.length; _idx++) {
            let uptime = uptime_arr[_idx];
            headLine['uptime'].setLine(_idx+1, uptime);
        }
        // headLine['openMode'].setLine(1, '{center}{white-fg}OPEN Mode:{/}');
        headLine['openMode'].setLine(1, '{center}' + database_info['OPEN_MODE'] + '{/}');
        // headLine['scn'].setLine(1, '{center}{white-fg}Current SCN:{/}');
        headLine['scn'].setLine(1, '{center}{blink}' + database_info['CURRENT_SCN'] + '{/}');
        // headLine['flashback'].setLine(1, '{center}{white-fg}FlashBack ON:{/}');
        headLine['flashback'].setLine(1, '{center}' + database_info['FLASHBACK_ON'] + '{/}');
        // headLine['dataguard'].setLine(1, '{center}{white-fg}DG Switchover:{/}');
        headLine['dataguard'].setLine(1, '{center}' + database_info['SWITCHOVER_STATUS'] + '{/}');
        screen.render();
    }
    catch (err) {
        console.log(err);
    }

}

initActionInConn();

screen.key(['p', 'C-p'], showSqlPlan);

screen.key(['r', 'C-r'], onRefresh);

// Close Modal Form...
screen.key(['x', 'C-x'], function (ch, key) {
    // console.log('X pressed. Modal Form closing...');
    if (form) {
        form.reset();
    }
    delete form;
});
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    if (connection) {
        connUtil.closeConnection(connection);
    }
    if (interval) {
        clearInterval(interval);
    }
    return process.exit(0);
});
screen.render();

setInterval(function(){
    if (!form) {
        onRefresh();
        initActionInConn();
    }
}, 1000*15);