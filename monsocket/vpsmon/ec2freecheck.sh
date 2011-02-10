#!/bin/bash
thismonth=`date +"%b '%y"`
usage=`vnstat -m | grep "$thismonth" | awk '{print $9}'`
usage=`echo $usage | awk '{printf "%d",$usage}' `
# max traffic monthly is 20G
max=$((20*1024)) 
echo $usage" of "$max
if [ $usage -gt $max ]; then
	echo "Warning: exceed max traffic"
	echo "Force to shutdown the VPN Service"
	/etc/init.d/pptpd stop
	echo "Completed"
	
else
	echo "It's OK"
fi
