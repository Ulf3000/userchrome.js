# userchrome.js


works from waterfox56 up to firefox nightly 66

------------------------------------------------------------------------

my own version, its a little different as it loads 

normal userchrome scripts from chrome/legacy

and 

sanboxed(bootstrapped) scripts from chrome/sandboxed

and 

xul overlays from chrome/xul (im using the jsm files from thunderbird 61, overlays were removed from firefox)

------------------------------------------------------------------------


the whole chrome folder in your profile folder is internally exposed as 

chrome://userchromejs/content/



which makes its very easy to load additional files in your script , just add a subfolder and access its contents like this for example 

chrome://userchromejs/content/sandboxed/myaddondata/icon.png

why is this important? because chrome uris have no security limitations which mozilla has already or will impose on file uris

--------------------------------------------------------------------------

the modules folder is just a folder where we can put usefull jsm files and other libraries , the files could be copied anywhere in the chrome folder obviously , but i think its nice to have a place to collect them.

import like this for example
Components.utils.import("chrome://userchromejs/content/modules/Overlays.jsm");

i prepackaged the files Overlays.jsm and ChromeManifest.jsm in modules, these are important for overlay loading , they are "stolen" from thunderbird 61

