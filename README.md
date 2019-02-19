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

why is this important? because chrome uris have no security limitations which mozilla has already or will impose on file uris



which makes its very easy to load additional files in your script , just add a subfolder and access its contents like this for example 

chrome://userchromejs/content/sandboxed/myaddondata/icon.png

this way you can create or port whole addons very easily, not just simple scriptfiles


--------------------------------------------------------------------------

the utils folder contains util files for the loader to work
