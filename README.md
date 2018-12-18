# userchrome.js


works from waterfox56 up to firefox nightly 66

------------------------------------------------------------------------

my own version, its a little different as it loads 

normal userchrome scripts from chrome/legacy

and 

sanboxed/bootstrapped scripts from chrome/sandboxed

------------------------------------------------------------------------


the whole chrome folder in your profile folder is internally exposed as 

chrome://userchromejs/content/



which makes its very easy to load additional files , just add a subfolder and access its contents like this for example 

chrome://userchromejs/content/sandboxed/myaddondata/icon.png

--------------------------------------------------------------------------

the modules folder is just a folder where we can put usefull jsm files and other libraries , the files could be copied anywhere in the folder obviously , but i think its to have a place to collect them.

import like this for example
Components.utils.import("chrome://userchromejs/content/modules/Overlays.jsm");
