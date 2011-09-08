#!/bin/sh

#echo 'dojo.provide("pocjs.combined");' > pocjs/combined.js
files=$( cat pocjs/all.js |grep require|sed -e 's/.*("\(.*\)").*/\1/'|sed 's/\./\//g' )
for i in dojo/dojo.js.uncompressed zlib png $files
do
    cat $i.js
done > pocjs/combined.js
