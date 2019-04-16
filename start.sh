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
