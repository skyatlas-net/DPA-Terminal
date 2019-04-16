var CircularJSON = require('circular-json')
    , _ = require('underscore');

function NVL(str, default_str) {
    if (str) return str;
    return default_str;
};
function pad (pad, str, padLeft) {
        if (typeof str === 'undefined')
            return pad;
        if (padLeft) {
            return (pad + str).slice(-pad.length);
        } else {
            return (str + pad).substring(0, pad.length);
        }
    };
/* transform a session object to whole width string line. */
function generateSessionDisplay(session) {
    return pad(' '.repeat(10), session['SID'] + '|' + session['SERIAL#'])
        + pad(' '.repeat(8), session['INST_ID'])
        + NVL(pad(' '.repeat(15), session['SQL_ID']), ' ')
        + NVL(pad(' '.repeat(40), session['EVENT']), ' ')
        + NVL(pad(' '.repeat(30), session['USERNAME']+'@'+session['MACHINE']), ' ')
        + NVL(pad(' '.repeat(30), session['MODULE']), ' ')
        + NVL(pad(' '.repeat(30), session['PROGRAM']), ' ');
    
};
/* transform ash session object to whole width string line. */
function generateSessionDisplay2(session) {
    return pad(' '.repeat(10), session['SESSION_ID'] + '|' + session['SESSION_SERIAL#'])
        + pad(' '.repeat(8), session['INST_ID'])
        + NVL(pad(' '.repeat(15), session['SQL_ID']), ' ')
        + NVL(pad(' '.repeat(40), session['EVENT']), ' ')
        + NVL(pad(' '.repeat(30), session['USERNAME']+'@'+session['MACHINE']), ' ')
        + NVL(pad(' '.repeat(30), session['MODULE']), ' ')
        + NVL(pad(' '.repeat(30), session['PROGRAM']), ' ');
    
};
function randomColor() {
    return [Math.random() * 255, Math.random() * 255, Math.random() * 255]
};
/* sessions is [{},{}...], props is [prop_name1,prop_name2...]
    Like : select ':'.join(props),count(*) from sessions group by ':':join(props)
*/
function get_sess_distribution(sessions, props) {

    var _distribution = _.countBy(sessions, function (session) {
        var str = '';
        for (var key of props) {
            str = str + session[key] + ':';
        }
        return str;
    });
    var arr_evt_dist = [];
    for (const evt_name in _distribution) {
        arr_evt_dist.push({
            'dist_name': evt_name,
            'session_count': _distribution[evt_name],
        });
    }
    arr_evt_dist = _.sortBy(arr_evt_dist, 'session_count');
    arr_evt_dist = arr_evt_dist.reverse();
    return arr_evt_dist;
};

function print_plan_item (plan_item) {
    return pad(' '.repeat(20), plan_item['OPERATION'])       // OPERATION varchar2(30)
        + pad(' '.repeat(20), NVL(plan_item['OPTIONS'], ' '))
        + pad(' '.repeat(15), NVL(plan_item['OBJECT_OWNER'], ' '))
        + pad(' '.repeat(30), NVL(plan_item['OBJECT_NAME'], ' '))
        + pad(' '.repeat(8), NVL(plan_item['CARDINALITY'], ' ') + '')
        + pad(' '.repeat(8), NVL(plan_item['COST'], ' ') + '')
        + pad(' '.repeat(10), NVL(plan_item['CPU_COST'], ' ') + '')
        + pad(' '.repeat(10), NVL(plan_item['IO_COST'], ' ') + '');
};
/* parse yyyymmdd hh24:mi:ss str to date obj */
function parseDate (datestr) {
    var reg = /(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
    if (!reg.test(datestr)) {
        return undefined;
    }
    var result = reg.exec(datestr);
    // console.log('>>>>>>'+result+'<<<<<<<<');
    var tdate = new Date();
    try {
        tdate.setFullYear(result[1]);
        tdate.setMonth(result[2]-1);
        tdate.setDate(result[3]);
        tdate.setHours(result[4]);
        tdate.setMinutes(result[5]);
        tdate.setSeconds(result[6]);
        // console.log('>>>>>>>>>>>>>>>>> datestr:'+datestr+' <<<<<<<<<<<<<< date: >>>>>>>>>'+tdate+' <<<<<<<<<<<<<<<<');
        return tdate;
    }
    catch (err) {
        return undefined;
    }
};
var commandType = {
    '1': 'CREATE TABLE',
    '10': 'DROP INDEX',
    '100': 'LOGON',
    '101': 'LOGOFF',
    '102': 'LOGOFF BY CLEANUP',
    '103': 'SESSION REC',
    '104': 'SYSTEM AUDIT',
    '105': 'SYSTEM NOAUDIT',
    '106': 'AUDIT DEFAULT',
    '107': 'NOAUDIT DEFAULT',
    '108': 'SYSTEM GRANT',
    '109': 'SYSTEM REVOKE',
    '11': 'ALTER INDEX',
    '110': 'CREATE PUBLIC SYNONYM',
    '111': 'DROP PUBLIC SYNONYM',
    '112': 'CREATE PUBLIC DATABASE LINK',
    '113': 'DROP PUBLIC DATABASE LINK',
    '114': 'GRANT ROLE',
    '115': 'REVOKE ROLE',
    '116': 'EXECUTE PROCEDURE',
    '117': 'USER COMMENT',
    '118': 'ENABLE TRIGGER',
    '119': 'DISABLE TRIGGER',
    '12': 'DROP TABLE',
    '120': 'ENABLE ALL TRIGGERS',
    '121': 'DISABLE ALL TRIGGERS',
    '122': 'NETWORK ERROR',
    '123': 'EXECUTE TYPE',
    '13': 'CREATE SEQUENCE',
    '14': 'ALTER SEQUENCE',
    '15': 'ALTER TABLE',
    '157': 'CREATE DIRECTORY',
    '158': 'DROP DIRECTORY',
    '159': 'CREATE LIBRARY',
    '16': 'DROP SEQUENCE',
    '160': 'CREATE JAVA',
    '161': 'ALTER JAVA',
    '162': 'DROP JAVA',
    '163': 'CREATE OPERATOR',
    '164': 'CREATE INDEXTYPE',
    '165': 'DROP INDEXTYPE',
    '167': 'DROP OPERATOR',
    '168': 'ASSOCIATE STATISTICS',
    '169': 'DISASSOCIATE STATISTICS',
    '17': 'GRANT OBJECT',
    '170': 'CALL METHOD',
    '171': 'CREATE SUMMARY',
    '172': 'ALTER SUMMARY',
    '173': 'DROP SUMMARY',
    '174': 'CREATE DIMENSION',
    '175': 'ALTER DIMENSION',
    '176': 'DROP DIMENSION',
    '177': 'CREATE CONTEXT',
    '178': 'DROP CONTEXT',
    '179': 'ALTER OUTLINE',
    '18': 'REVOKE OBJECT',
    '180': 'CREATE OUTLINE',
    '181': 'DROP OUTLINE',
    '182': 'UPDATE INDEXES',
    '183': 'ALTER OPERATOR',
    '19': 'CREATE SYNONYM',
    '2': 'INSERT',
    '20': 'DROP SYNONYM',
    '21': 'CREATE VIEW',
    '22': 'DROP VIEW',
    '23': 'VALIDATE INDEX',
    '24': 'CREATE PROCEDURE',
    '25': 'ALTER PROCEDURE',
    '26': 'LOCK',
    '27': 'NO-OP',
    '28': 'RENAME',
    '29': 'COMMENT',
    '3': 'SELECT',
    '30': 'AUDIT OBJECT',
    '31': 'NOAUDIT OBJECT',
    '32': 'CREATE DATABASE LINK',
    '33': 'DROP DATABASE LINK',
    '34': 'CREATE DATABASE',
    '35': 'ALTER DATABASE',
    '36': 'CREATE ROLLBACK SEG',
    '37': 'ALTER ROLLBACK SEG',
    '38': 'DROP ROLLBACK SEG',
    '39': 'CREATE TABLESPACE',
    '4': 'CREATE CLUSTER',
    '40': 'ALTER TABLESPACE',
    '41': 'DROP TABLESPACE',
    '42': 'ALTER SESSION',
    '43': 'ALTER USER',
    '44': 'COMMIT',
    '45': 'ROLLBACK',
    '46': 'SAVEPOINT',
    '47': 'PL/SQL EXECUTE',
    '48': 'SET TRANSACTION',
    '49': 'ALTER SYSTEM',
    '5': 'ALTER CLUSTER',
    '50': 'EXPLAIN',
    '51': 'CREATE USER',
    '52': 'CREATE ROLE',
    '53': 'DROP USER',
    '54': 'DROP ROLE',
    '55': 'SET ROLE',
    '56': 'CREATE SCHEMA',
    '57': 'CREATE CONTROL FILE',
    '59': 'CREATE TRIGGER',
    '6': 'UPDATE',
    '60': 'ALTER TRIGGER',
    '61': 'DROP TRIGGER',
    '62': 'ANALYZE TABLE',
    '63': 'ANALYZE INDEX',
    '64': 'ANALYZE CLUSTER',
    '65': 'CREATE PROFILE',
    '66': 'DROP PROFILE',
    '67': 'ALTER PROFILE',
    '68': 'DROP PROCEDURE',
    '7': 'DELETE',
    '70': 'ALTER RESOURCE COST',
    '71': 'CREATE MATERIALIZED VIEW LOG',
    '72': 'ALTER MATERIALIZED VIEW LOG',
    '73': 'DROP MATERIALIZED VIEW LOG',
    '74': 'CREATE MATERIALIZED VIEW',
    '75': 'ALTER MATERIALIZED VIEW',
    '76': 'DROP MATERIALIZED VIEW',
    '77': 'CREATE TYPE',
    '78': 'DROP TYPE',
    '79': 'ALTER ROLE',
    '8': 'DROP CLUSTER',
    '80': 'ALTER TYPE',
    '81': 'CREATE TYPE BODY',
    '82': 'ALTER TYPE BODY',
    '83': 'DROP TYPE BODY',
    '84': 'DROP LIBRARY',
    '85': 'TRUNCATE TABLE',
    '86': 'TRUNCATE CLUSTER',
    '9': 'CREATE INDEX',
    '91': 'CREATE FUNCTION',
    '92': 'ALTER FUNCTION',
    '93': 'DROP FUNCTION',
    '94': 'CREATE PACKAGE',
    '95': 'ALTER PACKAGE',
    '96': 'DROP PACKAGE',
    '97': 'CREATE PACKAGE BODY',
    '98': 'ALTER PACKAGE BODY',
    '99': 'DROP PACKAGE BODY'};
module.exports = {
    parseDate: parseDate,
    NVL: NVL,
    print_plan_item: print_plan_item,
    get_sess_distribution: get_sess_distribution,
    randomColor: randomColor,
    generateSessionDisplay: generateSessionDisplay,
    pad: pad,
    generateSessionDisplay2: generateSessionDisplay2,
    sqlOperation: commandType,
};