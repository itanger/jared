#!/bin/sh
eth="eth0 eth1 "
function get_eth_info()
{
 name=$1
 cat /proc/net/dev | awk -F ':'  '{if(NR>2)print $1" "$2" "$9" "$10}' | awk '{print$1" "$2" "$3" "$5}' | while \
 read line
 do
# echo $line
 data=`echo $name" "$line | awk '{if($1==$2)print $3" "$4" "$5}'`
 if ! [  -z "$data" ]
 then
  echo $data
 fi
 done
}
function sum_eth()
{
 rm -fr 12321.txt.temp
 for name in $eth
 do
  ret=`get_eth_info $name`
  #echo $ret | awk '{bps+=$0;pps+$1;dps+=$2;print bps" "pps" "dps}'
  echo $ret >> 12321.txt.temp
 done
 cat 12321.txt.temp | awk 'BEGIN{bps=0;pps=0;dps=0}{bps+=$1;pps+=$2;dps+=$3}END{print bps" "pps" "dps}'
}
flow=`sum_eth`
disk=`df | awk 'BEGIN{total=0;avl=0;used=0;}NR > 1{total+=$2;used+=$3;avl+=$4;}END{printf"%d", avl/total*100}'`
#top -b -n 1 | grep -w Mem | awk '{print"tot_mem: "$2" used_mem: " $4 " free_mem: "$6" left:"$6/$2"%"}'
mem=`top -b -n 1 | grep -w Mem | awk '{printf"%d",$6/$2*100}'`
 #top -b -n 1 | grep -w Cpu | awk '{print"cpu: "$5}' | awk -F '%' {print$1}
 cpu=`top -b -n 1 | grep -w Cpu | awk '{print$5}' | awk -F '%' '{printf"%d",$1}'`
 tm=`date +%s`
 if ! [ -f "flow.txt.temp" ]
 then
 echo $tm" "$flow >flow.txt.temp
 sleep 1
 tm=`date +%s`
 flow=`sum_eth`
 fi
 old_flow=`cat flow.txt.temp`
 new_flow=`echo $tm $flow`
 echo $new_flow >flow.txt.temp
 #echo $old_flow
 #echo $new_flow
 final_flow=`echo $old_flow $new_flow | awk '{dif_tm=$5-$1;dif_byte=$6-$2;dif_pkt=$7-$3;dif_dpkt=$8-$4;printf"%d %d %d",dif_byte*8/dif_tm, dif_pkt/dif_tm, dif_dpkt/dif_tm}'`
 #final_flow=`echo $old_flow $new_flow | awk '{print$0}'`

 rm -f *.temp

 echo "cpu "$cpu" disk "$disk" mem "$mem" nic "$final_flow
#------------------------en
