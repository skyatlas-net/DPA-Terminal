var blessed = require('blessed')
    , contrib = require('blessed-contrib')
    , sess = require('./session')
    , connUtil = require('./connectionUtil')
    , utils = require('./utils')
    , _ = require('underscore')
    , screen = blessed.screen({
        autoPadding: true,
    });

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
    var conn = await connUtil.getConnection(args['host'] || '192.168.0.201', args['port'] || '1521',
        args['service'] || 'orcl', args['username'] || 'perfstat', args['passwd'] || 'perfstatdb');
    return conn;
}

var modalForm = undefined;

var form = blessed.form({
    keys: true,
    tags: true, padding: 0, margin: 0,
    left: 'center',
    top: 'center',
    width: '80%',
    height: '90%',
    bg: 'green',
    label: 'select Time Window...',

});
var connection = undefined;
var grid = new contrib.grid({
    rows: 12, cols: 12, screen: screen, style: {
        border: 'line'
    }
});
// var line1 = grid.set(0,0,1,12, blessed.box, {
//     content: 'Line1',
//     tags: true,padding:0,margin:0,
// });
var headline = {};
headline['begDateLabel'] = grid.set(0, 0, 1, 2, blessed.box, {
    tags: true,
    content: 'From[{red-fg}yyyymmdd hh24:mi:ss{/}]:'
});
var boxBegDate = grid.set(0, 2, 1, 2, blessed.box, {
    content: 'Input Begin Time...',
})
headline['begDate'] = blessed.Textarea({
    parent: boxBegDate,
    mouse: true,
    inputOnFocus: true,
    vi: true
    // border: {
    // type: 'line',
    // },
});
headline['endDateLabel'] = grid.set(0, 4, 1, 6, blessed.box, {
    content: 'Press "submit" , show history active session of time window [begin, begin+10mins], ',
});

headline['endDateLabel'].insertBottom('Press "radar" button, show  begin date(whole day) trends...');

headline['submitBtn'] = grid.set(0, 10, 1, 1, blessed.button, {
    mouse: true,
    keys: true,
    shrink: true,
    padding: {
        left: 1,
        right: 1
    },
    left: 10,
    top: 0,
    shrink: true,
    tags: true,
    name: 'submit',
    content: '{underline}S{/}ubmit',
    style: {
        bg: 'blue',
        focus: {
            bg: 'red'
        },
        hover: {
            bg: 'red'
        }
    }
});
headline['radarBtn'] = grid.set(0, 11, 1, 1, blessed.button, {
    mouse: true,
    keys: true,
    shrink: true,
    tags: true,
    padding: {
        left: 1,
        right: 1
    },
    left: 10,
    top: 0,
    shrink: true,
    name: 'radar',
    content: '{underline}R{/}adar',
    style: {
        bg: 'blue',
        focus: {
            bg: 'red'
        },
        hover: {
            bg: 'red'
        }
    }
});

/* Radar button pressed, Show whole day's Database Load High Water Mark Line Chart. */
headline['radarBtn'].on('press', async function () {
    var beg_date = headline['begDate'].value;
    beg_date = utils.parseDate(beg_date);
    if (!beg_date) {
        var messageBox = new blessed.message({
            screen: screen,
            parent: screen,
        });
        messageBox.error('Please input valid date time format : yyyymmdd hh24:mi:ss', 2);
        screen.render();
        return;
    }
    var bdate = new Date(), edate = new Date();
    bdate.setFullYear(beg_date.getFullYear());
    bdate.setMonth(beg_date.getMonth());
    bdate.setDate(beg_date.getDate());
    bdate.setHours(0, 0, 0, 1);

    edate.setFullYear(beg_date.getFullYear());
    edate.setMonth(beg_date.getMonth());
    edate.setDate(beg_date.getDate());
    edate.setHours(23, 59, 59);
    if (!connection) {
        connection = await getConnection();
    }
    var radar_sessions = await sess.ashPeakCountRadar(connection, bdate, edate);
    if (radar_sessions.length == 0) {
        return;
    }
    if (!modalForm) {
        // console.log('new form...');
        modalForm = blessed.form({
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
    var closeBtn = blessed.button({
        mouse: true,
        keys: true,
        shrink: true,
        padding: {
            left: 1,
            right: 1
        },
        left: 'center',
        top: '100%-1',
        shrink: true,
        tags: true,
        name: 'close',
        content: 'Close',
        style: {
            bg: 'yellow',
            focus: {
                bg: 'red'
            },
            hover: {
                bg: 'red'
            }
        }
    }
    );
    modalForm.append(closeBtn);
    closeBtn.on('press', function () {
        setTimeout(function () {
            modalForm.detach();
            modalForm = undefined;
            screen.render();
        }, 500);
    });
    // console.log(' >>>>>>>>>>>>>>>>>>>>>>radar_sessions:'+radar_sessions.length);
    var radarLine = contrib.line({
        top: 'center',
        left: 'center',
        width: '90%',
        height: '80%',
        style:
        {
            line: "yellow"
            , text: "green"
            , baseline: "black"
        }
        , xLabelPadding: 3
        , xPadding: 5
        , showLegend: true
        , wholeNumbersOnly: false //true=do not show fraction in y axis
        , label: 'DB load ...',
    });
    var series1 = {
        title: 'Load High Warter Mark #',
        // x: ['1','2','3','4','5'],
        // y: [10,20,15,30,50],
        x: _.map(radar_sessions, function (item) {
            return item['TEN_MIN_TIMESTR'].substring(11);
        }),
        y: _.map(radar_sessions, function (item) {
            return item['SESS_COUNT'];
        }),
    };
    modalForm.append(radarLine);
    radarLine.setData([series1,]);
    screen.render();
});

var window_sessions = undefined;
var current_frame_index = 0;
headline['submitBtn'].on('press', async function () {
    var beg_date = headline['begDate'].value;
    beg_date = utils.parseDate(beg_date);
    if (!beg_date) {
        var messageBox = new blessed.message({
            screen: screen,
            parent: screen,
        });
        messageBox.error('Please input valid date time format : yyyymmdd hh24:mi:ss', 2);
        screen.render();
        return;
    }
    // plus 10 mins
    var end_date = new Date();
    end_date.setTime(beg_date.getTime() + 1000 * 60 * 10);
    if (!connection) {
        connection = await getConnection();
    }

    window_sessions = await sess.getAshinHist(connection, beg_date, end_date);
    var length = window_sessions.length;
    if (length == 0) {
        var messageBox = new blessed.message({
            screen: screen,
            parent: screen,
        });
        messageBox.error('Specified time window no data found!!', 2);
        screen.render();
        return;
    }
    if (length > 0) {
        let origin_window_sessions = window_sessions;
        window_sessions = _.groupBy(window_sessions, function (item) {
            return item['DATESTR'];
        });
        current_frame_index = 0;
        var frame_sessions = window_sessions[_.keys(window_sessions)[current_frame_index]];
        showGroupSessions(frame_sessions);
        // show 10 mins DB Load Line Chart.
        var series1 = {
            title: 'session #',
            x: _.keys(window_sessions),
            y: _.map(window_sessions, function (sessions, datestr) {
                return sessions.length;
            })
        };
        dbloadLine.setData([series1,]);
        var objdistr = utils.get_sess_distribution(origin_window_sessions, ['CURRENT_OBJ#']);
        waitObjTotTab.setData({
            headers: ['WAIT OBJ_ID', 'TOTAL COUNT'],
            data:
                _.map(objdistr, function (value) {
                    return [value['dist_name'], value['session_count']];
                }),

        });
        var sqliddistr = utils.get_sess_distribution(origin_window_sessions, ['SQL_ID']);
        sqlIdTotTab.setData({
            headers: ['SQL_ID', 'TOTAL COUNT'],
            data: _.map(sqliddistr, function (value) {
                return [value['dist_name'], value['session_count']];
            })
        });
    }

    screen.render();
});

function showMessageBox(content, timeout) {
    var messageBox = new blessed.message({
        screen: screen,
        parent: screen,
    });
    messageBox.error(content, timeout);
    screen.render();
    return;
}

// One-time sessions
var showGroupSessions = function (sessions) {
    // OBJ Distr.
    if (!waitObjTable) {
        waitObjTable = contrib.table({
            keys: true
            , fg: 'green'
            , title: 'Wait Obj# Distribution.'
            , parent: waitObjDistr
            , tags: true
            , columnWidth: [20, 15]
        });
    }
    var objdistr = utils.get_sess_distribution(sessions, ['CURRENT_OBJ#']);
    waitObjTable.setData({
        headers: ['SESSION WAIT OBJ_ID', 'COUNT'],
        data:
            _.map(objdistr, function (value) {
                return [value['dist_name'], value['session_count']];
            }),

    });
    // SQL_ID Distr.
    if (!sqlIdTable) {
        sqlIdTable = contrib.table({
            keys: true
            , fg: 'green'
            , title: 'SQL_ID Distribution.'
            , parent: sqlIdDistr
            , tags: true
            , columnWidth: [20, 15]
        })
    }
    var sqliddistr = utils.get_sess_distribution(sessions, ['SQL_ID']);
    sqlIdTable.setData({
        headers: ['SESSION EXEC SQL_ID', 'COUNT'],
        data: _.map(sqliddistr, function (value) {
            return [value['dist_name'], value['session_count']];
        })
    });
    // user-machine Distr.
    if (!userTable) {
        userTable = contrib.table({
            keys: true
            , fg: 'green'
            , title: 'User Distribution.'
            , parent: userDistr
            , tags: true
            , columnWidth: [40, 15]
        });
    }
    var usermachinedistr = utils.get_sess_distribution(sessions, ['USERNAME', 'PROGRAM']);
    userTable.setData({
        headers: ['USERNAME@PROG', 'COUNT'],
        data: _.map(usermachinedistr, function (value) {
            return [value['dist_name'], value['session_count']];
        })
    });
    // wait event distr.
    var event_distr = utils.get_sess_distribution(sessions, ['EVENT']);
    if (!eventTable) {
        eventTable = contrib.table({
            keys: true
            , fg: 'green'
            , title: 'Wait Event Distribution.'
            , parent: eventDistr
            , tags: true
            , columnWidth: [40, 15]
        })
    }
    eventTable.setData({
        headers: ['WAIT EVENT', 'COUNT'],
        data: _.map(event_distr, function (value) {
            return [value['dist_name'], value['session_count']];
        })
    })

    if (!session_tree) {
        session_tree = contrib.tree({
            parent: sessionTree,
            fg: 'green',
            tags: true,
            mouse: true,
            style: { text: "red" }
            , template: { lines: true }
        });
        session_tree.on('select', onSessionSelect);
    }
    var explorer = {
        name: '   ' + utils.pad(' '.repeat(10), 'SESS|SER#')
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
            // var selfPath = self.getPath(self);
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
                    /*
                        if ash session blocking by inactive session,
                        the blocking session should not in sessions
                    */
                    children = _.filter(sessions, function (sess) {
                        return !sess['BLOCKING_SESSION'] || !sess['_pid'] || sess['_pid'] == '0_0';
                    });
                    for (var sess of sessions) {
                        if (!_.some(sessions, function (_item) {
                            return _item['_uid'] == sess['_pid'];
                        })) {
                            children.push(sess);
                        }
                    }
                    // console.log('>>>>>>>>>>>>>>>'+JSON.stringify(children));
                }
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
                            result[child['INST_ID'] + '_' + child['SESSION_ID']] = {
                                name: utils.generateSessionDisplay2(child),
                                // getPath: self.getPath,
                                sid: [child['SESSION_ID'], child['SESSION_SERIAL#']],
                                sqlid: [child['SQL_ID'], child['SQL_PLAN_HASH_VALUE']],
                                objId: child['CURRENT_OBJ#'],
                                fileBlock: child['CURRENT_FILE#'],
                                blocking: [child['BLOCKING_INST_ID'], child['BLOCKING_SESSION']],
                                wait: [child['EVENT'], child['WAIT_CLASS']],
                                datestr: child['DATESTR'],
                                inst: child['INST_ID'],
                                user: child['USERNAME'],
                                oper: child['SQL_OPCODE'],
                                module: child['MODULE'],
                                extended: true,
                                children: self.children,
                                '_uid': child['_uid'],
                                '_pid': child['_pid'],
                            };
                        }
                        else {
                            result[child['INST_ID'] + '_' + child['SESSION_ID']] = {
                                name: utils.generateSessionDisplay2(child),
                                // getPath: self.getPath,
                                sid: [child['SESSION_ID'], child['SESSION_SERIAL#']],
                                sqlid: [child['SQL_ID'], child['SQL_PLAN_HASH_VALUE']],
                                objId: child['CURRENT_OBJ#'],
                                fileBlock: child['CURRENT_FILE#'],
                                blocking: [child['BLOCKING_INST_ID'], child['BLOCKING_SESSION']],
                                wait: [child['EVENT'], child['WAIT_CLASS']],
                                datestr: child['DATESTR'],
                                inst: child['INST_ID'],
                                user: child['USERNAME'],
                                oper: child['SQL_OPCODE'],
                                module: child['MODULE'],
                                extended: false,
                                '_uid': child['_uid'],
                                '_pid': child['_pid'],
                            };
                        }

                    }
                } else {
                    // console.log('xxxx'+JSON.stringify(self.childrenContent));
                    result = self.childrenContent;
                }
            } catch (e) {
                throw e;
            }
            // console.log('------->' + CircularJSON.stringify(result));

            return result;
        }
    };

    // let tab_data = [];

    session_tree.setData(explorer);
    screen.render();
}

headline['begDate'].focus();
var dbloadLine = grid.set(1, 0, 2, 12, contrib.line, {
    style:
    {
        line: "yellow"
        , text: "green"
        , baseline: "black"
    }
    , xLabelPadding: 3
    , xPadding: 5
    , showLegend: true
    , wholeNumbersOnly: false //true=do not show fraction in y axis
    , label: 'DB load in 10 mins...',
});
// var dbloadLine = undefined;
var waitObjDistr = grid.set(3, 0, 2, 3, blessed.box, {
    content: 'Object Distr.',
    tags: true, padding: 0, margin: 0,
});
var waitObjTable = undefined;
var waitObjTotTab = grid.set(3, 3, 2, 3, contrib.table, {
    keys: true
    , fg: 'green'
    , title: 'Wait Obj# Distribution.'
    , tags: true
    , columnWidth: [20, 15]
});
var sqlIdDistr = grid.set(3, 6, 2, 3, blessed.box, {
    content: 'SQL ID Distr.',
    tags: true, padding: 0, margin: 0,
});
var sqlIdTotTab = grid.set(3, 9, 2, 3, contrib.table, {
    keys: true
    , fg: 'green'
    , title: 'SQL_ID Distribution.'
    , tags: true
    , columnWidth: [20, 15]
});
var sqlIdTable = undefined;
// user-machine
var userDistr = grid.set(5, 0, 2, 6, blessed.box, {
    content: 'User-Machine Distr',
    tags: true, padding: 0, margin: 0,
});
var userTable = undefined;
var eventDistr = grid.set(5, 6, 2, 6, blessed.box, {
    content: 'Event Distr',
    tags: true, padding: 0, margin: 0,
});
var eventTable = undefined;

var sessionTree = grid.set(7, 0, 5, 12, blessed.box, {
    content: 'Session Tree',
    tags: true, padding: 0, margin: 0,
    mouse: true,
});
var session_tree = undefined;

// Select(Key:Enter) specific session, show session|sql stats
async function onSessionSelect(node) {
    if (!modalForm) {
        // console.log('new form...');
        modalForm = blessed.form({
            parent: screen,
            keys: true,
            tags: true,
            left: 'center',
            top: 'center',
            width: '98%',
            height: '95%',
            bg: 'green',
            label: 'Session Statistics.',
            style: {
                focused: {
                    bg: utils.randomColor(),
                },
                border: {
                    type: 'line', fg: 'cyan', bold: true,
                }

            }
        });
    }
    var form_grid = new contrib.grid({ rows: 12, cols: 12, screen: modalForm });
    // var box = form_grid.set(0,0,2,12,blessed.box, {
    //      title: '{red-fg}Title{/red-fg}', content: 'My Box', tags: true 
    // });

    var closeBtn = form_grid.set(0, 0, 1, 12, blessed.button, {
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

    closeBtn.on('press', function () {
        setTimeout(function () {
            if (modalForm) {
                modalForm.detach();
                modalForm = undefined;
            }

            screen.render();
        }, 500);
    });
    // show ash detail info.
    var session_detail_tab = form_grid.set(1, 0, 1, 12, contrib.table, {
        keys: true
        , fg: 'green'
        , width: '100%'
        , height: 5
        , title: 'Session Detail.'
        , tags: true
        , columnSpacing: 2
        , top: 0
        , left: 0
        , style: {
            border: {
                type: 'line', fg: 'cyan'
            }
        }
        // datestr, inst_id, sessid/ser#, username, sql_id, sql_plan_hash_value,sql_opcode,blocking_sess,blocking_inst
        // event,wait_class, obj#, file#, module
        , columnWidth: [8, 4, 7, 10, 13, 15, 8, 6, 6, 30, 15, 4, 4]
    });

    var series1 = {
        title: 'Session Detail',
        headers: ['TIME', 'INST', 'SESSION', 'USER', 'SQL_ID', 'SQL_PLAN', 'OPER',
            'B_SESS', 'B_INST', 'EVENT', 'W_CLASS', 'OBJ#', 'FILE#'],
        data: [
            [
                utils.NVL(node['datestr'].substring(11), ''),
                utils.NVL(node['inst'], ''),
                utils.NVL(node['sid'].join('|'), ''),
                utils.NVL(node['user'], ''),
                utils.NVL(node['sqlid'][0], ''),
                utils.NVL(node['sqlid'][1], ''),
                utils.NVL(utils.sqlOperation[node['oper']], ''),
                utils.NVL(node['blocking'][1], ''),
                utils.NVL(node['blocking'][0], ''),
                utils.NVL(node['wait'][0], ''),
                utils.NVL(node['wait'][1], ''),
                utils.NVL(node['objId'], ''),
                utils.NVL(node['fileBlock'][0], ''),
                // utils.NVL(node['module'],'')
            ]
        ]
    }
    session_detail_tab.setData(series1);
    var table2 = form_grid.set(2, 0, 1, 6, contrib.table, {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 6]
    });
    var table3 = form_grid.set(2, 6, 1, 6, contrib.table, {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 6]
    });
    var table4 = form_grid.set(3, 0, 1, 6, contrib.table, {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 15]
    });
    var table5 = form_grid.set(3, 6, 1, 6, contrib.table, {
        keys: true
        , fg: 'green'
        , label: 'SQL Statistics'
        , tags: true
        , columnWidth: [15, 15, 15, 11, 15]
    });
    var table6 = form_grid.set(4, 0, 1, 12, contrib.table, {
        label: 'Last 10 minitues SQL Wait Event Distribution... ',
        content: 'Blank',
        tags: true,
        fg: 'green',
        columnWidth: [50, 50, 50],
    });
    var table7 = form_grid.set(5, 0, 3, 12, contrib.table, {
        label: 'SQL Text',
        content: 'sql statement',
        fg: 'green',
        columnSpacing: 2,
        columnWidth: ['120',]
    });

    // show sql/sqlplan stats
    let plan_info = {};
    var _sqlid = node['sqlid'][0], _sql_plan_hash = node['sqlid'][1];

    if (_sqlid && connection) {
        var dstr = node['datestr'];
        dstr = dstr.replace(/-/g, '');
        var btime = new Date();

        btime = utils.parseDate(dstr);
        btime.setTime(btime.getTime() - 60 * 1000 * 60);

        var etime = new Date();
        etime.setTime(btime.getTime() + 60 * 1000 * 60);
        plan_info = await sess.getSqlPlanInfo(connection, _sqlid, _sql_plan_hash, btime, etime);
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
            var sqltexts = await sess.getSqlText(connection, _sqlid);

            table7.setData({
                headers: ['SQL TEXT',],
                data: sqltexts
            });
            /* Show SQL PLAN */
            var plan_tree = form_grid.set(8, 0, 4, 12, contrib.tree, {
                parent: form,
                fg: 'blue',
                tags: true,
                mouse: true,
                // scrollable: true,
                border: {
                    type: 'line',
                    bold: true,
                },
                // focus: {
                //     border: {
                //         type: 'line',
                //         bold: true,
                //     }
                // },
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
            /* Show SQL PLAN End. */
        }



    }
    screen.render();
}

screen.render();
// trigger query action
screen.key(['s', 'C-s'], function (ch, key) {
    headline['submitBtn'].press();
    setTimeout(function () {
        if (session_tree) {
            session_tree.focus();
        }
    }, 1);
});

//Next frame
screen.key(['n', 'C-n', 'C-f'], function (ch, key) {
    if (window_sessions) {
        current_frame_index += 1;
        if (current_frame_index == _.keys(window_sessions).length) {
            current_frame_index -= 1;
            showMessageBox('Last data frame accessed, no more data...', 2);
        }
        var dstr = _.keys(window_sessions)[current_frame_index];
        session_tree.setLabel({
            text: dstr,
        });
        showGroupSessions(window_sessions[dstr]);
    }

});
//Previous frame
screen.key(['p', 'C-p', 'C-b'], function (ch, key) {
    if (window_sessions) {
        current_frame_index -= 1;
        if (current_frame_index == -1) {
            current_frame_index = 0;
            showMessageBox('First data frame accessed, no earlier data...', 2);
        }
        var dstr = _.keys(window_sessions)[current_frame_index];
        session_tree.setLabel({
            text: dstr,
        });
        showGroupSessions(window_sessions[dstr]);
    }

});
// Close Modal Form...
screen.key(['x', 'C-x'], function (ch, key) {
    // console.log('X pressed. Modal Form closing...');
    if (modalForm) {
        modalForm.detach();
        modalForm = undefined;
        screen.render();
    }
    delete modalForm;
});
// Exit program.
screen.key(['q', 'C-c'], function (ch, key) {
    if (connection) {
        connUtil.closeConnection(connection);
    }
    return process.exit(0);
});