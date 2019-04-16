# DPA-Terminal
Node.js Program, connect to Oracle RDBMS, do performance Analyzing Job...
## 01. What is DPA-Terminal
Database Performance Analyzer(Aka: DPA), show Oracle RDBMS's performance issue. In DPA-Terminal, we use Terminal program(ncurses like app) display Current performance view, and we also recall the past performance issue.
### Current System-Wide (RAC Supported) Performance Analyze
[![asciicast](https://asciinema.org/a/241100.svg)](https://asciinema.org/a/241100)
If you click above Picture and watch the screen cast, you'll find in the terminal application, you can:
1. Show Database (support RAC) Overview info(such as: patch,version,uptime,dataguard switchover status, scn ...)
2. Display all active sessions in a tree like widget which support mouse click, "Enter" selection... the tree like widget can show "who block who" diagram
3. Show current system-wide "Wait Event" distribution
4. Show selected session's SQL Execution statistics
5. Show selected session's SQL Execution Plan and full Text
6. ...
### History Performance Recall
[![asciicast](https://asciinema.org/a/241103.svg)](https://asciinema.org/a/241103)
1. Using "Radar" button, check whole day Database Load high water mark.
2. Recall History Performance Issure...
3. Session Blocking Tree Diagram and 
4. Wait Events distribution
5. SQL statistics(SQL Exec Wait Events Top 3)

## 02. What's DPA-Terminal Depends on
DPA-Terminal is an Terminal application written in Node.js. To run this application, you need:
1. Node.js Env.
2. Install Oracle Client Software 
3. blessed-contrib

## Installation
### Overview
If you cannot do yourself installation of Oracle Instant Client SDK, Node.js , you should use GUI application, not Terminal ascii application like this.
### Node.js 
([Node.js](https://nodejs.org/en/))

### Oracle Instant Client (Install before node-oracledb)
([Oracle-Instant-Client](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html))

### Oracle node-oracledb
([oracledb](http://oracle.github.io/node-oracledb/))

## Usage
We provide a bash script named start.sh
``````
#! /bin/bash
echo ''
echo ''
echo '**************************************************************************************'
echo '*              Database Performance Analyzer For Oracle Terminal Version 0.10        *'
echo '*                                                                                    *'
echo '* ================================================================================== *'
echo '* 1)  Show Currently Active Session                                                  *'
echo '* 2)  Active Session History Analyzer                                                *'
echo '* 3)  To Be Continued...                                                             *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '*                                                                                    *'
echo '**************************************************************************************'
read -n1 -p  'Please Input Your Choice:' choice

case $choice in
1)
    echo ''
    read -p 'Input Oracle DB Host(IP or DNS Name):' host
    read -p 'Input Oracle DB Connect Port:' port
    read -p 'Input Oracle DB Connect Service:' servicename
    read -p 'Input Oracle User Name:' username
    read -s -p 'Input Oracle User Password:' password

    node gridsess.js --host $host --port $port --service $servicename --username $username --passwd $password
    ;;
2)
    echo ''
    read -p 'Input Oracle DB Host(IP or DNS Name):' host
    read -p 'Input Oracle DB Connect Port:' port
    read -p 'Input Oracle DB Connect Service:' servicename
    read -p 'Input Oracle User Name:' username
    read -s -p 'Input Oracle User Password:' password

    node ash.js --host $host --port $port --service $servicename --username $username --passwd $password
    ;;
*)
    echo ''
    echo 'error choice'
    ;;
esac
``````
You can create a Linux/Unix user, Changed the user's .bash_profile, Add next line to the .bash_profile
```
exec start.sh
```
By doing this, you can jail user inside these two node.js applications: View Current Oracle RDBMS Performance or Recall History Oracle RDBMS Performance events.
### User Interaction
* The Application should run in 200*66 Terminal Window -- Only Test in MacOS Terminal.app & iTerm2
* Support Mouse 
* Ctrl-C q should Exit
* Input widget action like "vi" -- when you complete your input, press "ESC" mark the input completion
* If you want to select something (eg: session), you move the cursor then press "Enter"
* In gridsess.js, if you want view SQL Exec Plan, Press "P"
* In ash.js, you should input a Date time string in specific format
* after Date time String input, Mouse Click "Radar" button, application should display you a line chart means the whole day RDBMS performance load usage
* after Date time String input, Mouse click "Submit" button, application should recall RDBMS in time range [input_datestr, input_datestr+10mins]
* "n" or "Ctrl-f" looks forward the recall, "p" or "Ctrl-b" looks backward the recall.
