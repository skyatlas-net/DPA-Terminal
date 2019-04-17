# DPA-Terminal
这是一个Node.js程序（Node.js可不是只能做网站，server端），连接Oracle数据库，在Terminal窗口中，展示Oracle数据库的性能信息。
## 01. 什么是 DPA-Terminal
Database Performance Analyzer(简称: DPA), 显示、分析Oracle数据库性能问题. 这个程序中, 允许用户在终端（Terminal）环境，尽可能“直观”的展示Oracle数据库的性能问题，也可以用于“回溯”Oracle数据库的历史性能问题.
### 即时 (RAC Supported) 性能分析
[![asciicast](https://asciinema.org/a/241100.svg)](https://asciinema.org/a/241100)
上面链接是使用asciinema录制的终端矿口操作, 在终端窗口中，我们可以做到:
1. 展示Oracle数据库 (support RAC) 概要(such as: 补丁,版本,实例启动时间,DataGuard 切换状态, SCN ...)
2. 在一个“树形”控件中展示所有“激活”会话，支持鼠标操作，通过树形控件特点，直观展示“哪一个会话被哪一个会话”堵塞的场景。
3. 展示当前所有“激活”会话，基于“等待事件”的分布
4. 选定一个会话，展示其当前执行的SQL指标（执行次数，执行时间，buffer gets，SQL消耗在各等待事件上的分布...)
5. 查看选定会话当前执行SQL的执行计划、完整的SQL文本
6. ...
### 历史性能问题“回放”
[![asciicast](https://asciinema.org/a/241103.svg)](https://asciinema.org/a/241103)
1. 使用 "Radar" 按钮, 可以检查一整天的数据库负载变化趋势.
2. 回放指定时间段的性能事件
3. 以”树形控件“直观展示会话堵塞、等待情况
4. 展示基于等待事件分布
5. 展示SQL指标(SQL Exec Wait Events Top 3)

## 02. What's DPA-Terminal Depends on
DPA-Terminal is an Terminal application written in Node.js. To run this application, you need:
1. Node.js Env.
2. Install Oracle Client Software 
3. blessed-contrib

## Installation
### Overview
如果你不能完成Oracle Instant Client，Node.js 安装 , 那还是图形化的GUI程序比较适合你, 不要尝试终端窗口程序，耽误时间.
### Node.js 
([Node.js](https://nodejs.org/en/))

### Oracle Instant Client (Install before node-oracledb)
([Oracle-Instant-Client](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html))

### Oracle node-oracledb
([oracledb](http://oracle.github.io/node-oracledb/))

## Usage
我们还提供了一个bash脚本程序 start.sh
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
我的设想是，在Linux/Unix机器上创建一个用户，完成上述安装, 修改该用户的 .bash_profile, 追加下面一行到 .bash_profile
```
exec start.sh
```
这样，你可以限制这个用户登录后即可以查看Oracle数据库当前性能问题、回放Oracle历史性能事件。你也可以简单修改一下 start.sh ，让用户不需要知道IP、port、username、password等信息也可以查看Oracle性能信息。
### User Interaction
* 程序应运行在 200*66 以上尺寸的终端窗口（ssh client，secureCRT，xterm应该都没问题） -- 只在MacOS 的Terminal.app 和 iTerm2中测试过
* 虽然是终端ascii类型程序，但是支持鼠标
* Ctrl-C q 退出程序
* 输入框使用 "vi"风格 -- 完成输入后，按下 "ESC" ，会切换到命令模式
* 如需在界面中选定 (eg: session), 移动游标或者鼠标滚轮，按下 "Enter"
* 在 gridsess.js中, 如果需要查看SQL Execution Plan, 按下 "p"
* 在 ash.js中, 需要输入时间（格式yyyymmdd hh24:mi:ss)
* 有了时间输入后, 鼠标点击 "Radar" 按钮, 应用程序会展示输入事件所在的一整天的Oracle数据库性能变化趋势
* 有了时间输入后, 鼠标点击 "Submit" 按钮, 程序会展示在事件范围 [input_datestr, input_datestr+10mins]内的Oracle 历史性能事件
* "n" or "Ctrl-f" 查看下一个“镜头”, "p" or "Ctrl-b" 翻回前一个“镜头”.
