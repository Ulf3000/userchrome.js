// Add-on Bar script for Firefox 60+ by Aris
//
// no 'toggle'-key feature (Ctrl+/ or Cmd+/)
// no 'close' button
// no 'Add-on Bar' entry in toolbar context menu
//
// flexible spaces on add-on bar behave like on old Firefox versions


var AddAddonbar = {
	init: function () {
		if (location != 'chrome://browser/content/browser.xul') {
			return
		}
		console.log(window);
		Components.utils.import("resource:///modules/CustomizableUI.jsm");
		var {
			Services
		} = Components.utils.import("resource://gre/modules/Services.jsm", {});
		var appversion = parseInt(Services.appinfo.version);
		var addonbar_label = "Add-on Bar";

		try {

			if (appversion <= 62)
				var tb_addonbar = document.createElement("toolbar");
			else
				var tb_addonbar = document.createXULElement("toolbar");
			tb_addonbar.setAttribute("id", "addonbar");
			tb_addonbar.setAttribute("customizable", "true");
			tb_addonbar.setAttribute("class", "toolbar-primary chromeclass-toolbar customization-target");
			tb_addonbar.setAttribute("mode", "icons");
			tb_addonbar.setAttribute("iconsize", "small");
			tb_addonbar.setAttribute("toolboxid", "navigator-toolbox");
			tb_addonbar.setAttribute("context", "toolbar-context-menu");
			tb_addonbar.setAttribute("toolbarname", addonbar_label);
			tb_addonbar.setAttribute("label", addonbar_label);
			tb_addonbar.setAttribute("lockiconsize", "true");
			tb_addonbar.setAttribute("defaultset", "spring,spring");

			CustomizableUI.registerArea("addonbar", {
				legacy: true
			});

			document.getElementById("browser-bottombox").appendChild(tb_addonbar);

		} catch (e) {}

		var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

		var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent('\
					\
					#addonbar toolbarpaletteitem[place=toolbar][id^=wrapper-customizableui-special-spring],\
					#addonbar toolbarspring {\
					-moz-box-flex: 1 !important;\
					min-width: 100% !important;\
					max-width: unset !important;\
					}\
					\
					'), null, null);

		sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

	}

}

setTimeout(function () {
	AddAddonbar.init();
}, 500);
