//
// config.js userchrome loader
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/osfile.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Console.jsm");
Components.utils.import('resource:///modules/CustomizableUI.jsm');
Components.utils.import("resource://gre/modules/BrowserUtils.jsm");

let userChromeLoader = {
	init: function () {
		// CANCEL IN SAFEMODE
		if (Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULRuntime).inSafeMode)
			return;

		//  REGISTER CHROME FOLDER AS chrome://userchromejs/content/  ...this makes everything so easy :)
		let cmanifest = FileUtils.getDir('UChrm', true);
		cmanifest.append('chrome.manifest');
		Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar).autoRegister(cmanifest);

		// ADD BOOTSTRAPPED EXTENSION support for ff65+  (real extensions as in xpi files)
/* 		if (Services.appinfo.version.split(".")[0] > 64) {
			Components.utils.import('resource://gre/modules/AddonManager.jsm');
			if (AddonManager.addExternalExtensionLoader) {
				Components.utils.import('chrome://userchromejs/content/modules/BootstrapLoader.jsm');
				AddonManager.addExternalExtensionLoader(BootstrapLoader);
			}
		}
 */
		//IMPORT FILES FROM FOLDERS
		let legacyScripts = this.importFolder(FileUtils.getDir("ProfD", ["chrome", "legacy"], true), ".js");
		let sandboxedScripts = this.importFolder(FileUtils.getDir("ProfD", ["chrome", "sandboxed"], true), ".js");
		let overlays = this.importFolder(FileUtils.getDir("ProfD", ["chrome", "xul"], true), ".xul");
		//let styles = this.importFolder(FileUtils.getDir("ProfD", ["chrome", "css"], true), ".css");

		//RUN LEGACY SCRIPTS
		let enumerator = Services.wm.getEnumerator("navigator:browser"); // TODO change behaviour for loading
		while (enumerator.hasMoreElements()) {
			let win = enumerator.getNext();
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

		//RUN SANDBOXED SCRIPTS
		this.loadedBootstrapSandboxes = {};
		for (let file of sandboxedScripts) {
			let chromeURI = 'chrome://userchromejs/content/sandboxed/' + file.leafName;
			try {
				this.loadSandboxedScript(chromeURI, file.leafName);
			} catch (err) {
				console.log(err);
			}
		}

		// RUN XUL OVERLAYS
		Components.utils.import("chrome://userchromejs/content/modules/Overlays.jsm");
		Components.utils.import("chrome://userchromejs/content/modules/ChromeManifest.jsm");
		let appinfo = Services.appinfo;
		this.options = {
			application: appinfo.ID,
			appversion: appinfo.version,
			platformversion: appinfo.platformVersion,
			os: appinfo.OS,
			osversion: Services.sysinfo.getProperty("version"),
			abi: appinfo.XPCOMABI
		};
		//console.log(this.options);
		let enumerator2 = Services.wm.getEnumerator("navigator:browser");
		while (enumerator2.hasMoreElements()) {
			console.log("NEXT OVERLAY");
			let win = enumerator.getNext();
			this.loadOverlays(win, overlays);
		};
		let windowStartUpObserver2 = {
			observe: async function (aSubject, aTopic, aData) {
				aSubject.addEventListener('DOMContentLoaded', function (aEvent) {
					let win = aEvent.originalTarget.defaultView;
					userChromeLoader.loadOverlays(win, overlays);
				}, true);
			}
		}
		Services.obs.addObserver(windowStartUpObserver2, 'domwindowopened', false);

		// CREATE UI BUTTON
		CustomizableUI.createWidget({
			id: 'UserChromeButton', //id in cui.jsm
			type: 'custom',
			defaultArea: CustomizableUI.AREA_NAVBAR,
			onBuild: function (aDocument) {
				//if (aDocument.defaultView.PrivateBrowsingUtils.isWindowPrivate(win) == true) console.log("isWindowPrivate");
				let toolbaritem = aDocument.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'toolbaritem');
				toolbaritem.textContent = "UserChrome";

				let props = {
					id: 'UserChromeButton', //id in dom
					title: 'UserChrome',
					label: 'UserChrome',
					align: 'center',
					pack: 'center',
					removable: 'true',
					sdkstylewidget: 'true',
					overflows: false,
					type: "menu",
					popup: "UserChromePopup",
					context: "UserChromePopup"
				};
				for (let p in props) {
					toolbaritem.setAttribute(p, props[p]);
				}
				//toolbaritem.className = "toolbarbutton-1";
				//toolbaritem.className += " chromeclass-toolbar-additional";
				//toolbaritem.className += " badged-button";
				
				userChromeLoader.makeMenu(aDocument.defaultView, toolbaritem, legacyScripts, sandboxedScripts, overlays);

				return toolbaritem;
			}
		});

	},
	importFolder: function (aFolder, aType) {
		let files = [];
		try {
			let dir = aFolder.directoryEntries;
			while (dir.hasMoreElements()) {
				let file = dir.getNext().QueryInterface(Components.interfaces.nsIFile);
				if (!file.isDirectory() && file.leafName.endsWith(aType)) {
					files.push(file);
				}
			}
		} catch (err) {
			console.log(err);
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
		// CREATE SANDBOX
		let principal = Components.classes["@mozilla.org/systemprincipal;1"].createInstance(Components.interfaces.nsIPrincipal);
		let sandbox = new Components.utils.Sandbox(principal, {
			sandboxName: uri,
			metadata: {
				URI: uri
			}
		});
		XPCOMUtils.defineLazyGetter(   // Define a console
			sandbox, "console",
			() => new ConsoleAPI({
				consoleID: "userChrome/" + name
			})
		);
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
		// let test = sandbox["shutdown"];
		// if (test) {
		this.loadedBootstrapSandboxes[uri] = sandbox;
		// }
	},
	loadOverlays: function (win, overlays) {
		let document = win.document;
		if (document.location && document.location.protocol == 'chrome:') {
			for (let file of overlays) {
				let chromeURI = 'chrome://userchromejs/content/xul/' + file.leafName;
				let man = "overlay chrome://browser/content/browser.xul " + chromeURI;
				(async function (win) {
					let newChromeManifest = new ChromeManifest(function () {
							return man;
						}, this.options);
					await newChromeManifest.parse();
					Overlays.load(newChromeManifest, win.document.defaultView);
				})(win);
			}
		}
	},
	makeMenu: async function (win, toolbaritem, legacyScripts, sandboxedScripts, overlays) {

		let document = win.document;

		let menupopup = document.createElement("menupopup");
		menupopup.setAttribute("id", "UserChromePopup");

		let cfi = document.createElement("menuitem");
		cfi.setAttribute("label", "Open Chrome Folder");
		cfi.file = FileUtils.getDir("ProfD", ["chrome"], true);
		cfi.addEventListener("click", userChromeLoader.openFolders, false);
		menupopup.appendChild(cfi);

		let ifi = document.createElement("menuitem");
		ifi.setAttribute("label", "Open Install Folder");
		ifi.file = FileUtils.getDir("CurProcD", true).parent;
		ifi.addEventListener("click", userChromeLoader.openFolders, false);
		menupopup.appendChild(ifi);

		// let rls = document.createElement("menuitem");
		// rls.setAttribute("label", "Parse new Scripts");
		// rls.file = FileUtils.getDir("CurProcD", true).parent;
		// rls.addEventListener("click", userChromeLoader.parseScripts, false);
		// menupopup.appendChild(rls);

		let rcc = document.createElement("menuitem");
		rcc.setAttribute("label", "Restart(Clear Caches!!!)");
		rcc.addEventListener("command", userChromeLoader.restart, false);
		menupopup.appendChild(rcc);

		let menusep = document.createElement("menuseparator");
		menupopup.appendChild(menusep);

		toolbaritem.appendChild(menupopup);

	},
	openFolders: function (e) {
		e.target.file.launch();
	},
	restart: function (e) {
		//if (e.button == 1 || e.button == 2) {
			e.preventDefault();
			Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).invalidateCachesOnRestart();
	//};
		BrowserUtils.restartApplication();
	}
}

try {
	userChromeLoader.init();
} catch (err) {
	console.log(err);
}
