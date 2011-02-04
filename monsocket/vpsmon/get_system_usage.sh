#!/bin/sh
disk=`df | awk 'BEGIN{total=0;avl=0;used=0;}NR > 1{total+=$2;used+=$3;avl+=$4;}END{printf"%d", used/total*100}'`
#top -b -n 1 | grep -w Mem | awk '{print"tot_mem: "$2" used_mem: " $4 " free_mem: "$6" left:"$6/$2"%"}'
topout=`top -b -n 1`
mem=`top -b -n 1 | grep -w Mem | awk '{printf"%d",$4/$2*100}'`
#top -b -n 1 | grep -w Cpu | awk '{print"cpu: "$5}' | awk -F '%' {print$1}
cpu=`top -b -n 1 | grep -w Cpu | awk '{print$5}' | awk -F '%' '{printf"%d",$1}'`
declare -i cpu=100-$cpu

today=`date +"%b '%y"`
net=`vnstat -m | grep "$today" | awk '{printf"%.2f",$3}'`

echo "cpu "$cpu" disk "$disk" mem "$mem" net "$net
