# userchrome.js


my own version, its a little different as it loads 

normal userchrome scripts 

and 

sanboxed/bootstrapped scripts 


the whole chrome folder in your profile folder is internally exposed as 

chrome://userchromejs/content/


which makes its very easy to load additional files , just add a subfolder and access its contents öile this for example 

chrome://userchromejs/content/sandboxed/myaddondata/icon.png
