#!/bin/sh

files=$( cat pocjs/all.js |grep require|sed -e 's/.*("\(.*\)").*/\1/'|sed 's/\./\//g' )
for i in dojo/dojo.js.uncompressed zlib png $files
do
    cat $i.js
done | java -jar scripts/compiler.jar > pocjs/combined.js
