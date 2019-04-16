# DPA-Terminal
Node.js Program, connect to Oracle RDBMS, do performance Analyzing Job...
## 01. What is DPA-Terminal
Database Performance Analyzer(Aka: DPA), show Oracle RDBMS's performance issure. In DPA-Terminal, we use Terminal program(ncurses like app) display Current performance view, and we also recall the past performance issure.
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
If you cannot do yourself installation of Oracle Instant Client SDK, Node.js , you should use GUI application, not Terminal ascii like application like this.
### Node.js 
[![Node.js](https://nodejs.org/en/)](https://nodejs.org/en/)

### Oracle Instant Client (Install before node-oracledb)
[![Oracle-Instant-Client](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html)](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html)

### Oracle node-oracledb
[![oracledb](http://oracle.github.io/node-oracledb/)](http://oracle.github.io/node-oracledb/)

## Usage
