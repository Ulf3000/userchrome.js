//
// config.js userchrome loader
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/osfile.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Console.jsm");

let userChromeLoader = {
	init: function () {
		// CANCEL IN SAFEMODE
		if (Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULRuntime).inSafeMode)
			return;

		//  REGISTER CHROME FOLDER AS chrome://userchromejs/content/  ...this makes everything so easy :)
		let cmanifest = FileUtils.getDir('UChrm',true);
		cmanifest.append('chrome.manifest');
		Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar).autoRegister(cmanifest);

		//IMPORT FILES FROM FOLDERS
		let legacyScripts = this.importFolder(FileUtils.getDir("ProfD", ["chrome", "legacy"], true));
		let sandboxedScripts = this.importFolder(FileUtils.getDir("ProfD", ["chrome", "sandboxed"], true));
		let overlays = this.importFolder(FileUtils.getDir("ProfD", ["chrome","overlays"], true));

		//RUN LEGACY SCRIPTS
		let enumerator = Services.wm.getEnumerator("navigator:browser");
		while (enumerator.hasMoreElements()) {
			let win = enumerator.getNext();
			if (win.PrivateBrowsingUtils.isWindowPrivate(win) == false)
				this.loadLegacyScripts(win.document, legacyScripts);
		};
		let windowStartUpObserver = {
			observe: async function (aSubject, aTopic, aData) {
				aSubject.addEventListener('DOMContentLoaded', function (aEvent) {
					let document = aEvent.originalTarget;
					userChromeLoader.loadLegacyScripts(document, legacyScripts);
				}, true);
			}
		}
		Services.obs.addObserver(windowStartUpObserver, 'domwindowopened', false);

		//RUN SANDBOXED/BOOTSTRAPPED SCRIPTS
		this.loadedBootstrapSandboxes = {};
		for (let file of sandboxedScripts) {
			let chromeURI = 'chrome://userchromejs/content/sandboxed/' + file.leafName;
			try {
				this.loadSandboxedScript(chromeURI, file.leafName);
			} catch (err) {
				console.log(err);
			}
		}
	},
	importFolder: function (aFolder) {
		let files = [];
		let dir = aFolder.directoryEntries;
		while (dir.hasMoreElements()) {
			let file = dir.getNext().QueryInterface(Components.interfaces.nsIFile);
			if (!file.isDirectory()) {
				files.push(file);
			}
		}
		return files;
	},
	loadLegacyScripts: function (document, legacyScripts) {
		if (document.location && document.location.protocol == 'chrome:') {
			for (let file of legacyScripts) {
				let chromeURI = 'chrome://userchromejs/content/legacy/' + file.leafName;
				try {
					Services.scriptloader.loadSubScript(chromeURI, document.defaultView, 'UTF-8');
				} catch (err) {
					console.log(err);
				}
			}
		}
	},
	loadSandboxedScript: function (uri, name) {
		// CREATE SANBOX
		let principal = Components.classes["@mozilla.org/systemprincipal;1"].createInstance(Components.interfaces.nsIPrincipal);
		let sandbox = new Components.utils.Sandbox(principal, {
				sandboxName: uri,
				metadata: {
					URI: uri
				}
			});
		XPCOMUtils.defineLazyGetter(// Define a console
			sandbox, "console",
			() => new ConsoleAPI({
				consoleID: "userChrome/" + name
			}));
		sandbox.__SCRIPT_URI_SPEC__ = uri;
		Services.scriptloader.loadSubScript(uri, sandbox);

		//STARTUP
		let runStartup = function (sandbox, reason) {
			try {
				let startupFunction = sandbox["startup"];
				if (!startupFunction) {
					console.log("error: startup() function not present");
				}
				startupFunction.call(sandbox, "ADDON_ENABLE");
			} catch (e) {}
		}
		runStartup(sandbox, "ADDON_ENABLE");
		// SHUTDOWN
		let test = sandbox["shutdown"];
		if (test) {
			this.loadedBootstrapSandboxes[uri] = sandbox;
		}
	}
}
userChromeLoader.init();
