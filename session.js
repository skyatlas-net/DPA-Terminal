var connUtil = require('./connectionUtil'),
    _ = require('underscore'),
    utils = require('./utils');

async function getSqlPlanHash(conn, sqlid, child_number) {
    let plan_hash_value = undefined;
    try {
        let result = await conn.execute(connUtil.sql_childnumber_plan, [sqlid, child_number]);
        if (result.rows.length>0) {
            plan_hash_value = result.rows[0][0];
        }
    }
    catch(err) {
        console.log('getSqlPlanHash error:'+err);
    }
    return plan_hash_value;
};

async function getSqlPlanItems(conn, sqlid, plan_hash_value){
    let alRet = [];
    try {
        let result = undefined;
        result = await conn.execute(connUtil.sql1_11, [sqlid,plan_hash_value]);
        
        if (result.rows.length == 0){
            // cannot find plan items in memory, try to find it in AWR.
            result = await conn.execute(connUtil.sql1_10, [sqlid,plan_hash_value])
        }
        alRet = connUtil.resultToObjArr(result);
    }
    catch(err) {
        console.log('getSqlPlanItems error:'+err);
    }
    return alRet;
};

/* Return SQL Text as [[sql_line,],] */
async function getSqlText(conn, sqlid) {
    let alRet = [];
    try {
        let result = undefined;
        result = await conn.execute(connUtil.sql1_3, [sqlid,]);
        if (result.rows.length == 0) {
            // not found in awr, get it from memory
            result = await conn.execute(connUtil.sql1_4, [sqlid,]);
        }
        for (var row of result.rows) {
            let sqlpiece = row[0];
            for (var line of sqlpiece.split('\n')) {
                alRet.push([line]);
            }
        }
    }
    catch(err) {
        console.log('getSqlText error :'+err);
    }
    return alRet;
}

/* Get specific sqlid Wait Event Distribution in [SYSDATE - 10mins, SYSDATE] */
async function getEventsWaitedSecs(conn, sqlid, plan_hash_value) {
    let alRet = [];
    try {
        let result = await conn.execute(connUtil.sql1_6, [sqlid,plan_hash_value,10,sqlid,plan_hash_value,10]);
        alRet = connUtil.resultToObjArr(result);
    }
    catch(err) {
        console.log('getEventsWaitedSecs error:'+err);
    }
    return alRet;
}

/* Get specific sqlid Wait Event Distribution in [btime, etime] */
async function getEventsWaitedSecs2(conn,sqlid,plan_hash_value,btime,etime) {

    let alRet = [];
    try {
        let result = await conn.execute(connUtil.sql1_6_2, [sqlid,plan_hash_value,btime,sqlid,plan_hash_value,etime]);
        alRet = connUtil.resultToObjArr(result);
    }
    catch(err) {
        console.log('getEventsWaitedSecs2 error:'+err);
        console.log('>>>>>>>>>>>>>>>>> '+btime);
        console.log('>>>>>>>>>>>>>>>>> '+etime);
    }
    return alRet;
}

async function getSqlPlanInfo2(conn, sqlid, child_number) {
    let plan_hash_value = await getSqlPlanHash(conn, sqlid, child_number);
    return await getSqlPlanInfo(conn, sqlid, plan_hash_value);
}

async function getSqlPlanInfo(conn, sqlid, plan_hash_value, btime=undefined, etime=undefined) {
    let alRet = [];
    try {
        let result = undefined;
        if (btime && etime) {
            result = await conn.execute(connUtil.sql1_8, [sqlid, plan_hash_value, btime, btime, etime, etime]);
        }
        else {
            result = await conn.execute(connUtil.sql1_9, [sqlid, plan_hash_value]);
        }
            
        // alRet size should be ONE
        alRet = connUtil.resultToObjArr(result);
        for (var plan of alRet){
            plan['items'] = await getSqlPlanItems(conn, sqlid, plan_hash_value);
            if (btime && etime) {
                plan['event_wait_secs'] = await getEventsWaitedSecs2(conn, sqlid, plan_hash_value,btime,etime);
            }
            else {
                plan['event_wait_secs'] = await getEventsWaitedSecs(conn, sqlid, plan_hash_value);
            }
            
        };
    }
    catch(err){
        console.log('getSqlPlanInfo error:'+err);
    }
    return alRet;
};

async function getCurrActSessions(conn) {
    let alRet = [];
    try {
        let result = await conn.execute(connUtil.sql4_4);
        alRet = connUtil.resultToObjArr(result);
        
        let storedActSess = new Set();
        alRet.forEach(function(sessObj) {
            storedActSess.add(sessObj['INST_ID']+':'+sessObj['SID']);
        });

        let alRetNew = [];
        for (const sessObj of alRet) {
            // console.log('======='+sessObj+'========');
            if (! storedActSess.has(sessObj['BLOCKING_INSTANCE']+':'+sessObj['BLOCKING_SESSION']) && 
            sessObj['BLOCKING_INSTANCE'] && sessObj['BLOCKING_SESSION']) {
                // Blocking Session Not Active.
                // console.log(sessObj['BLOCKING_INSTANCE']+':'+sessObj['BLOCKING_SESSION']);
                let rsult = await conn.execute(connUtil.sql4_4_app, [sessObj['BLOCKING_INSTANCE'],sessObj['BLOCKING_SESSION']]);
                sessions = connUtil.resultToObjArr(rsult);
                blockingSession = sessions.length>0 ? sessions[0] : undefined;
                
                if (blockingSession) {
                    storedActSess.add(sessObj['BLOCKING_INSTANCE']+':'+sessObj['BLOCKING_SESSION']);
                    alRetNew.push(blockingSession);
                }
                // console.log('Found Inactive Blocking Session:'+sessObj['BLOCKING_INSTANCE']+':'+sessObj['BLOCKING_SESSION']);
            }
            else {
                // console.log('Cannot Found session: '+sessObj['BLOCKING_INSTANCE']+':'+sessObj['BLOCKING_SESSION']);
            }
        }
        alRet = alRet.concat(alRetNew);
    }
    catch(err){
        console.log(err);
    }
    for (var session of alRet){
        session['_uid'] = utils.NVL(session['INST_ID'],'0')+'_'+utils.NVL(session['SID'],'0');
        session['_pid'] = utils.NVL(session['BLOCKING_INSTANCE'],'0')+'_'+utils.NVL(session['BLOCKING_SESSION'],'0');

        if (session['_pid'] == '0_0') {
            session['_pid'] = undefined;
        }
    }
    return alRet;
};

// Every 10 mins, Calc the maximum value of Acitive Session Counts in [begin_date, end_date]
async function ashPeakCountRadar(conn,begin_date, end_date) {
    var alRet = [];
    try {
        let result = await conn.execute(connUtil.sql_4_1, {
            bdate: begin_date,
            edate: end_date
        });
        alRet = connUtil.resultToObjArr(result);
    }
    catch(err) {
        console.log('ashPeakCountRadar SQL ex:'+err);
    }
    return alRet;
}

// Get ASH Data in [begin_date, end_date]
async function getAshinHist(conn,begin_date,end_date) {
    
    var alRet = [];
    try {
        conn.execute('insert into logtab (c1,c2,c3) values (sysdate, :c2,:c3)',
        [begin_date,end_date],
        function(err,result){
            
            if (err) {
                console.log('INSERT ERROR:'+err);
            }
            
        });
        let result = await conn.execute(connUtil.sql_4_3_2, {
            begin_time: begin_date,
            end_time: end_date,
            begin_time2: begin_date,
            end_time2: end_date
        });
        alRet = connUtil.resultToObjArr(result);
        conn.commit();
    }
    catch(err) {
        console.log('###########################'+err);
    }
    for (var session of alRet){
        session['_uid'] = utils.NVL(session['INST_ID'],'0')+'_'+utils.NVL(session['SESSION_ID'],'0');
        if (session['BLOCKING_SESSION'] && !session['BLOCKING_INST_ID']) {
            session['BLOCKING_INST_ID'] = session['INST_ID'];
        }
        session['_pid'] = utils.NVL(session['BLOCKING_INST_ID'],'0')+'_'+utils.NVL(session['BLOCKING_SESSION'],'0');

        if (session['_pid'] == '0_0') {
            session['_pid'] = undefined;
        }
    }
    return alRet;
};

async function getCurrActSessFolded(conn) {
    let sessions = await getCurrActSessions(conn);
    for (var session of sessions){
        session['_uid'] = session['INST_ID']+'_'+session['SID'];
        session['_pid'] = session['BLOCKING_INSTANCE']+'_'+session['BLOCKING_SESSION'];

        if (session['_pid'] == '0_0') {
            session['_pid'] = undefined;
        }
    }
    return getTreeForDueToAnalysis(sessions, '_uid','_pid');
}

async function test() {
    let connection = await connUtil.getConnection('192.168.0.201','1521','orcl','perfstat','perfstatdb');
    let sessions = await getCurrActSessions(connection);
    
    for (var session of sessions){
        session['_uid'] = session['INST_ID']+'_'+session['SID'];
        session['_pid'] = session['BLOCKING_INSTANCE']+'_'+session['BLOCKING_SESSION'];

        if (session['_pid'] == '0_0') {
            session['_pid'] = undefined;
        }
    }
    // console.log(sessions);
    // console.log('+++++++++++++++++++++ folded sessions +++++++++++++++++++++++++++++++++++++++++++++++++');
    sessions = getTreeForDueToAnalysis(sessions, '_uid','_pid');
    console.log(JSON.stringify('?????????'+sessions));

}
// let connection = connUtil.getConnection('192.168.0.201','1521','orcl','perfstat','perfstatdb');
// console.log(connection);
// let result = getCurrActSessions(connection);
// console.log(result);



function getTreeForDueToAnalysis2(data, primaryIdName, parentIdName) {
    if (!data || data.length == 0 || !primaryIdName || !parentIdName)
        return [];

    var tree = [],
    rootIds = [],
    item = data[0],
    primaryKey = item[primaryIdName],
    treeObjs = {},
        tempChildren = {},
    parentId,
    parent,
    len = data.length,
    i = 0;

    while (i < len) {
        item = data[i++];
        primaryKey = item[primaryIdName];

        if (tempChildren[primaryKey]) {
            item.children = tempChildren[primaryKey];
            delete tempChildren[primaryKey];
        }

        treeObjs[primaryKey] = item;
        parentId = item[parentIdName];

        if (parentId) {
            parent = treeObjs[parentId];

            if (!parent) {
                var siblings = tempChildren[parentId];
                if (siblings) {
                    siblings.push(item);
                }
                else {
                    tempChildren[parentId] = [item];
                }
            }
            else if (parent.children) {
                parent.children.push(item);
            }
            else {
                parent.children = [item];
            }
        }
        else {
            rootIds.push(primaryKey);
        }
    }

    for (var i = 0; i < rootIds.length; i++) {
        tree.push(treeObjs[rootIds[i]]);
    };


    for (var k in tempChildren) {
        if (tempChildren[k] instanceof Array) {
            // console.log('----- concat array ------');
            tree = tree.concat(tempChildren[k]);
        }
        else {
            // console.log('------ push object ------');
            tree. push(tempChildren[k]);
        }

    }
    // console.dir(tree);

    return tree;
}


    
function getTreeForDueToAnalysis(data, primaryIdName, parentIdName) {
    // Find Session deadlock chain
    var deadlock = false;
    var sessionid_list = [];
    var traceBackBlockingSess = function(sessions, session) {
        // all sessions in data, if we have found deadlock, we did not need anymore check.
        if (deadlock) {
            return;
        }
        if (session.blockingSession) {
            var findBlocking = false;
            _.forEach(sessions, function(item){
                if (!findBlocking && item.sessionID == session.blockingSession) {
                    findBlocking = true;
                    if (_.contains(sessionid_list, item.sessionID)) {
                        deadlock = true;
                        sessionid_list.push(item.sessionID);

                    }
                    else {
                        sessionid_list.push(item.sessionID);
                    }
                    traceBackBlockingSess(sessions, item);
                }

            });
        }
    };
    _.forEach(data, function(item) {
        traceBackBlockingSess(data, item);   
        // Every time traceBack called, if no deadlock found, we clear the sessionid_list to be used in next traceBack call.
        if (!deadlock) 
            sessionid_list = [];
    });
    if (deadlock) {
        console.log('Dead Lock Sessions Detected ...');
        return data;
    }
    if (!data || data.length == 0 || !primaryIdName || !parentIdName)
        return [];

    var tree = [], tempData = [];

    // Create new Array, which store the same data as input data array.
    _.forEach(data, function(item, index) {
        item.children = [];
        tempData[index] = item;

    });

    // found root node ( no parent , or cannot found parent in input data array)
    _.forEach(tempData, function(item, index) {
        var parentID = item[parentIdName];
        if (! parentID) {   // no parent
            item.children = [];
            tree.push(item);
        }
        else {
            var haveParent = _.find(tempData,
                function(_item) {
                    return _item[primaryIdName] == parentID;
            });
            if (!haveParent) {
                // cannot found parent in input data array.
                item.children = [];
                tree.push(item);
            }
        }
    });
    // now, tree store all root node.

    /* set item['children']  */
    var foundChildren = function(item) {
        _.each(tempData, function(_obj, _idx) {
            if (_obj[parentIdName] && _obj[parentIdName] == item[primaryIdName]) {
                // _obj is item's son
                foundChildren(_obj);
                item.children.push(_obj);
            }
        });
    }

    _.each(tree, function(_item, index) {
        foundChildren(_item);
    });

    return tree;
}

async function getDbOverview(conn) {
    let db_overview = {};
    try {
        let result = await conn.execute(connUtil.sql_instance_info);
        db_overview['instance_info'] = connUtil.resultToObjArr(result);
        result = await conn.execute(connUtil.sql_lastpatch);
        // Last Patch {}  registry$
        db_overview['last_patch'] = connUtil.resultToObjArr(result);
        result = await conn.execute(connUtil.sql_database_info);
        db_overview['database_info'] = connUtil.resultToObjArr(result);
        
        result = await conn.execute(connUtil.sql_israc);
        db_overview['israc'] = connUtil.resultToObjArr(result); // {} inst
        

    }
    catch(err) {
        console.log('getDbOverview error:'+err);
    }
    return db_overview;
}

async function getDbSCN(conn) {
    let scn = 0;
    try {
        let result = await conn.execute(connUtil.sql_current_scn);
        scn = result.rows[0][0];
    }
    catch(err) {
        console.log('getDbSCN error:'+err);
    }
}

module.exports = {
    getCurrActSessions: getCurrActSessions,
    // getCurrActSessFolded: getCurrActSessFolded,
    getSqlPlanInfo: getSqlPlanInfo,
    getSqlPlanInfo2: getSqlPlanInfo2,
    getDbSCN: getDbSCN,
    getDbOverview: getDbOverview,
    getAshinHist: getAshinHist,
    ashPeakCountRadar: ashPeakCountRadar,
    getEventsWaitedSecs2: getEventsWaitedSecs2,
    getSqlText: getSqlText,
};



// test();