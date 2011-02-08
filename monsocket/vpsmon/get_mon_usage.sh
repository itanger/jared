#!/bin/bash
thismonth=`date +"%b '%y"`
usage=`vnstat -m | grep "$thismonth" | awk '{print $9}'`
usage=`echo $usage | awk '{printf "%d",$usage}' `
# max traffic monthly is 20G
#max=$((20*1024)) 
max=$((20*1)) 
echo $usage" of "$max
if [ $usage -gt $max ]; then
	echo "Warning: exceed max traffic"
	echo "Force to close the VPN Service"
	
else
	echo "It's OK"
fi
#echo "scale=4; ($usage/$max)*100" | bc
