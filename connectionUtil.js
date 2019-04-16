var oracledb = require('oracledb')
oracledb.fetchAsString = [oracledb.CLOB,]
// Create Connection to Oracle RDBMS
async function getConnection(host, port, svc, username, password) {
    host = host || process.env.NODE_ORACLE_HOST;
    port = port || process.env.NODE_ORACLE_PORT || '1521';
    svc = svc || process.env.NODE_ORACLE_SERVICE;
    username = username || process.env.NODE_ORACLE_USER;
    password = password || process.env.NODE_ORACLE_PASSWORD;

    if (!host || !port || !svc || !username || !password) {
        console.error('Invalid connection infomation, corrrect and retry.');
        throw Error('Connect DB Parameter Error.');
    }
    connOption = {
        user: username,
        password: password,
        connectString: host+':'+port+'/'+svc
    };
    let connection;
    try{
        connection = await oracledb.getConnection(connOption);
    }
    catch(err) {
        console.error(err);
        throw Error(err);

    }
    return connection;
};

// Close Oracle RDBMS Connection
async function closeConnection(connection) {
    if (connection) {
        try {
            await connection.close();
        }
        catch(err) {
            console.error('Close Connection err.');
            console.error(err);
        }
    }
};

// Transform Result to [{obj},]
function resultToObjArr(result) {
    let alRet = [];
    let metaData = result.metaData;
    result.rows.forEach(row => {
        let sessObj = {};
        metaData.forEach(function(meta, index) {
            sessObj[meta['name']] = row[index];
        });
        alRet.push(sessObj);
    });
    return alRet;
};

module.exports = {
    getConnection: getConnection,
    closeConnection: closeConnection,
    resultToObjArr: resultToObjArr,
    sql4_4: `select /*+  rule */ INST_ID,SID,SERIAL#,USERNAME,
            command,
                STATUS,
                SERVER,
                SCHEMANAME,
                OSUSER,
                PROCESS,
                MACHINE,
                TERMINAL,
                PROGRAM,
                TYPE,
                SQL_ID,
                SQL_CHILD_NUMBER,
                MODULE,
                ACTION,
                CLIENT_INFO,
                ROW_WAIT_OBJ#,
                ROW_WAIT_FILE#,
                ROW_WAIT_BLOCK#,
                LOGON_TIME,
                RESOURCE_CONSUMER_GROUP,
                BLOCKING_SESSION_STATUS,
                BLOCKING_INSTANCE,
                BLOCKING_SESSION,
                EVENT,
                P1TEXT,
                P1,
                P2TEXT,
                P2,
                P3TEXT,
                P3,
                WAIT_CLASS,
                SERVICE_NAME
                from gv$session
                where USERNAME IS NOT NULL 
                        AND (status='ACTIVE')`,
    sql4_4_app: "select /*+  rule */ INST_ID,SID,SERIAL#,USERNAME,\n" +
                "	command,\n" +
                "		STATUS,\n" +
                "		SERVER,\n" +
                "		SCHEMANAME,\n" +
                "		OSUSER,\n" +
                "		PROCESS,\n" +
                "		MACHINE,\n" +
                "		TERMINAL,\n" +
                "		PROGRAM,\n" +
                "		TYPE,\n" +
                "		SQL_ID,\n" +
                "		SQL_CHILD_NUMBER,\n" +
                "		MODULE,\n" +
                "		ACTION,\n" +
                "		CLIENT_INFO,\n" +
                "		ROW_WAIT_OBJ#,\n" +
                "		ROW_WAIT_FILE#,\n" +
                "		ROW_WAIT_BLOCK#,\n" +
                "		LOGON_TIME,\n" +
                "		RESOURCE_CONSUMER_GROUP,\n" +
                "		BLOCKING_SESSION_STATUS,\n" +
                "		BLOCKING_INSTANCE,\n" +
                "		BLOCKING_SESSION,\n" +
                "		EVENT,\n" +
                "		P1TEXT,\n" +
                "		P1,\n" +
                "		P2TEXT,\n" +
                "		P2,\n" +
                "		P3TEXT,\n" +
                "		P3,\n" +
                "		WAIT_CLASS,\n" +
                "		SERVICE_NAME\n" +
                "		 from gv$session\n" +
                "		 where inst_id = :inst_id and sid = :sid",
    sql_childnumber_plan: `SELECT distinct PLAN_HASH_VALUE FROM GV$SQL
                        WHERE SQL_ID = :sqlid AND CHILD_NUMBER = :sqlchild
    `,
    /* get sql plan from memory. */
    sql1_9: `select sql_id,plan_hash_value,OPTIMIZER_COST,OPTIMIZER_MODE,MODULE,ACTION,
    round(FETCHES/EXECUTIONS,2) fetchespe,
    round(SORTS/EXECUTIONS,2) sortspe,
    EXECUTIONS EXECUTIONS_TOTAL,
    PX_SERVERS_EXECUTIONS PX_SERVERS_EXECS_TOTAL,
    LOADS LOADS_TOTAL,
    PARSE_CALLS PARSE_CALLS_TOTAL,
    round(DISK_READS/EXECUTIONS,2)	diskreadpe,
    round(BUFFER_GETS/EXECUTIONS,2)	bufferGetpe,
    round(ROWS_PROCESSED/EXECUTIONS,2) rowprocessedpe,
    round(CPU_TIME/EXECUTIONS,2)	cputimepe,
    round(ELAPSED_TIME/EXECUTIONS,2)	elapsetimepe,
    round(USER_IO_WAIT_TIME/EXECUTIONS,2)	iowaitpe,
    round(CLUSTER_WAIT_TIME/EXECUTIONS,2)	clwaitpe,
    round(APPLICATION_WAIT_TIME/EXECUTIONS,2)	apwaitpe,
    round(CONCURRENCY_WAIT_TIME/EXECUTIONS,2)	ccwaitpe,
    round(DIRECT_WRITES/EXECUTIONS,2)	directwritepe,
    round(PLSQL_EXEC_TIME/EXECUTIONS,2)		plexectimepe,
    round(JAVA_EXEC_TIME/EXECUTIONS,2)		javaexectimepe
    from gv$sqlarea
    where sql_id = :sqlid and plan_hash_value = :plan_hash
    and EXECUTIONS > 0`,
    sql1_8: `select sql_id,plan_hash_value,max(OPTIMIZER_COST) OPTIMIZER_COST,max(OPTIMIZER_MODE) OPTIMIZER_MODE,max(MODULE) MODULE,max(ACTION) ACTION,
        max(round(FETCHES_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2)) fetchespe,
        max(round(SORTS_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2)) sortspe,
        max(EXECUTIONS_TOTAL) EXECUTIONS_TOTAL,
        max(PX_SERVERS_EXECS_TOTAL) PX_SERVERS_EXECS_TOTAL,
        max(LOADS_TOTAL) LOADS_TOTAL,
        max(PARSE_CALLS_TOTAL) PARSE_CALLS_TOTAL,
        max(round(DISK_READS_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	diskreadpe,
        max(round(BUFFER_GETS_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	bufferGetpe,
        max(round(ROWS_PROCESSED_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2)) rowprocessedpe,
        max(round(CPU_TIME_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	cputimepe,
        max(round(ELAPSED_TIME_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	elapsetimepe,
        max(round(IOWAIT_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	iowaitpe,
        max(round(CLWAIT_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	clwaitpe,
        max(round(APWAIT_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	apwaitpe,
        max(round(CCWAIT_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	ccwaitpe,
        max(round(DIRECT_WRITES_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))	directwritepe,
        max(round(PLSEXEC_TIME_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))		plexectimepe,
        max(round(JAVEXEC_TIME_TOTAL/decode(EXECUTIONS_TOTAL,0,1,EXECUTIONS_TOTAL),2))		javaexectimepe
        from dba_hist_sqlstat
        where dbid = (select dbid from v$database) and sql_id = :sqlid and plan_hash_value = :plan_hash
        and EXECUTIONS_TOTAL >= 0 
        and snap_id in (select snap_id from dba_hist_snapshot where BEGIN_INTERVAL_TIME <= :btime
        and END_INTERVAL_TIME >= :btime union select snap_id from dba_hist_snapshot where begin_interval_time <= :etime and end_interval_time >= :etime)
        group by sql_id,plan_hash_value`,
    sql1_11: `select * from gv$sql_plan 
            where sql_id = :sqlid and plan_hash_value = :planhash order by sql_id,plan_hash_value,id`,
    sql1_10: `select * from dba_hist_sql_plan where dbid = (select dbid from v$database) and sql_id = :sqlid and plan_hash_value = :sql_plan order by sql_id,plan_hash_value,id`,
    sql1_6: `select Event, sum(timesecs) timesecs from (
        select NVL(EVENT, 'Null Event') Event, 1 timesecs from gv$active_session_history
        where sql_id = :sql_id1
        and SQL_PLAN_HASH_VALUE = :plan1
        and sample_time >= sysdate - (:minutes1 * 1/24/60)
        union all
        select NVL(EVENT, 'Null Event') Event, 10 timesecs from dba_hist_active_sess_history
        where SQL_ID = :sql_id2
        and SQL_PLAN_HASH_VALUE = :plan2
        and sample_time >= sysdate - (:minutes1 * 1/24/60))
        group by Event`,
    sql1_6_2: `select Event, sum(timesecs) timesecs from (
        select NVL(EVENT, 'Null Event') Event, 1 timesecs from gv$active_session_history
        where sql_id = :sql_id1
        and SQL_PLAN_HASH_VALUE = :plan1
        and sample_time >= :btime
        union all
        select NVL(EVENT, 'Null Event') Event, 10 timesecs from dba_hist_active_sess_history
        where SQL_ID = :sql_id2
        and SQL_PLAN_HASH_VALUE = :plan2
        and sample_time >= :etime )
        group by Event`,
    sql_inst_version: `select instance_name,version from gv$instance`,
    sql_lastpatch: `select ACTION||':'||NAMESPACE||':'||VERSION||':'||ID||':'||COMMENTS PATCH from sys.registry$history
        where action_time = (select max(action_time) from sys.registry$history)`,
    sql_inst_uptime: `select instance_name , (sysdate -startup_time)*60*60*24 up_secs from gv$instance`,
    sql_db_openmode: `select name, decode(open_mode,'MOUNTED',1,'READ ONLY',2,'READ WRITE',3,0) open_mode from v$database`,
    sql_current_scn: `select current_scn from v$database`,
    sql_israc: `select parallel israc from v$instance`,
    sql_flashback_on: `select flashback_on from v$database`,
    sql_log_mode: `select log_mode from v$database`,
    sql_switchover_status: `select switchover_status from v$database`,
    sql_database_info: `select * from v$database`,
    sql_instance_info: `select * from gv$instance`,
    sql_4_3_2: `select to_char(sample_time,'YYYY-MM-DD HH24:MI:SS') datestr, INST_ID,session_id,session_serial#, username,
                sql_id, SQL_PLAN_HASH_VALUE
                ,SQL_OPCODE,
                session_type, session_state,blocking_session,BLOCKING_SESSION_SERIAL#,'' blocking_inst_id,
                event,wait_class,CURRENT_OBJ#,CURRENT_FILE#,
                module,program,action,client_id
                from gv$active_session_history s, dba_users u
                where   s.user_id = u.user_id
                and sample_time >= :begin_time
                and sample_time <= :end_time 
                union all
                select to_char(sample_time,'YYYY-MM-DD HH24:MI:SS') datestr, instance_number inst_id,session_id,session_serial#, username,
                sql_id, SQL_PLAN_HASH_VALUE
                ,SQL_OPCODE,
                session_type, session_state,blocking_session,BLOCKING_SESSION_SERIAL#,'' blocking_inst_id, 
                event,wait_class,CURRENT_OBJ#,CURRENT_FILE#,
                module,program,action,client_id
                from dba_hist_active_sess_history s, dba_users u
                where s.user_id = u.user_id
                and sample_time >= :begin_time2
                and sample_time <= :end_time2`,
sql_4_1: `with sess_count_grpby_sec as (
    select to_char(sample_time,'YYYY-MM-DD HH24:MI:SS') sample_time_str, count(*) sess_count 
    from gv$active_session_history  
    where 1 = 1
      and sample_time >= :bdate
      and sample_time <= :edate
    group by to_char(sample_time,'YYYY-MM-DD HH24:MI:SS')
    union all
    select to_char(sample_time,'YYYY-MM-DD HH24:MI:SS') sample_time_str, count(*) sess_count 
    from dba_hist_active_sess_history 
    where 1 = 1
      and sample_time >= :bdate
      and sample_time <= :edate
      and dbid = (select dbid from v$database)
      group by  to_char(sample_time,'YYYY-MM-DD HH24:MI:SS')
    )
    select substr(sample_time_str,1,15)||'0' ten_min_timestr, max(sess_count) sess_count
    from sess_count_grpby_sec
    group by substr(sample_time_str,1,15)||'0' 
    order by substr(sample_time_str,1,15)||'0' `,
sql1_3: `select sql_text from dba_hist_sqltext where sql_id = :sqlid`,
sql1_4: `select sql_text,piece from gv$SQLTEXT_WITH_NEWLINES where sql_id = :sqlid order by piece`
};