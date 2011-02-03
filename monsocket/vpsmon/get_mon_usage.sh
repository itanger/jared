#!/bin/bash
# Read internet usage from vnstat and store value of download in file.txt
vnstat -m | grep "`date +"%b '%y"`" | awk '{print $3}' > file.temp
usage=`cat file.temp`
# Store the value in file.txt as a variable usage
# Calculate the usage percentage with two decimal points and store the value in file1.txt
echo "scale=2; ($usage/1024)*100" | bc
