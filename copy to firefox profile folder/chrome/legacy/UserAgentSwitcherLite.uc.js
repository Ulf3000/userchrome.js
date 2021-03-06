// ==UserScript==
// @name           User Agent Switcher Lite
// @version        1.0
// @description    Like User Agent Switcher extention.
// @author         Shinya
// @homepage       http://www.code-404.net/articles/browsers/user-agent-switcher-lite
// @namespace      http://www.code-404.net/
// @compatibility  Firefox 2.0 3.0
// @include        chrome://browser/content/browser.xul
// @Note           
// ==/UserScript==

if (location == 'chrome://browser/content/browser.xul'){
	User_Agent_Switcher_Lite();
}

function User_Agent_Switcher_Lite(){
  
  var locale = Components.classes["@mozilla.org/preferences-service;1"].
    getService(Components.interfaces.nsIPrefBranch);
  locale = locale.getCharPref("general.useragent.locale");
  
  var userAgent = [
	  {
      label: "Firefox 42",
      accesskey: "4",
      agent: "Mozilla/5.0 (X11; Linux x86_64; rv:42.0) Gecko/20100101 Firefox/42.0"
    },

    {
      label: "Firefox 56",
      accesskey: "5",
      agent: "Mozilla/5.0 (X11; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0"
    },
	    {
      label: "Firefox 63",
      accesskey: "6",
      agent: "Mozilla/5.0 (X11; Linux x86_64; rv:63.0) Gecko/20100101 Firefox/63.0"
    },


  ];
  
  init: {
    var menuPopup = document.getElementById("menu_ToolsPopup");
    var separator = document.getElementById("prefSep");
    
    var menu = document.createElement("menu");
    menu.id = "ua-switcher-lite";
    menu.setAttribute("label", "User Agent Switcher Lite");
    menu.setAttribute("accesskey", "U");
    menuPopup.insertBefore(menu, separator);
    
    menuPopup = document.createElement("menupopup");
    menu.appendChild(menuPopup);
    
    // Default
    var menuItem = document.createElement("menuitem");
    menuItem.setAttribute("label", locale.indexOf("ja") == -1 ? "Default" : "\u30c7\u30d5\u30a9\u30eb\u30c8");
    menuItem.setAttribute("accesskey", "D");
    menuItem.setAttribute("type", "radio");
    menuItem.id = "ua-switcher-lite-default";
    menuItem.culMenu = {agent: false};
    menuItem.addEventListener("command", setUserAgent, false);
    menuPopup.appendChild(menuItem);
    
    // Separator
    menuItem = document.createElement("menuseparator");
    menuItem.id = "ua-switcher-lite-sep-default";
    menuPopup.appendChild(menuItem);
    
    
    for (var i = 0; menu = userAgent[i]; i++) {
      if (menu.label == "separator") {
        menuItem = document.createElement("menuseparator");
      }
      else {
        menuItem = document.createElement("menuitem");
        menuItem.setAttribute("label", menu.label);
        if ("accesskey" in menu) menuItem.setAttribute("accesskey", menu.accesskey);
        menuItem.setAttribute("type", "radio");
        menuItem.culMenu = menu;
        menuItem.addEventListener("command", setUserAgent, false);
      }
      menuItem.id = "ua-switcher-lite-" + i;
      menuPopup.appendChild(menuItem);
    }
    
    document.getElementById("ua-switcher-lite").addEventListener("popupshowing", function(){
      setUserAgentDisplay(menuPopup)
    }, false);
  }
  
  function setDefault(){
    
  }
  
  function setUserAgent(aEvent){
    var pref = Components.classes["@mozilla.org/preferences;1"]
      .getService(Components.interfaces.nsIPrefBranch);
    
    // デフォルトを選んだら項目を削除
    if(!aEvent.target.culMenu.agent){
      pref.clearUserPref("general.useragent.override");
      return;
    }
    
    var nsISupportsString = Components.interfaces.nsISupportsWString ||
      Components.interfaces.nsISupportsString;
    var ua = (Components.classes["@mozilla.org/supports-wstring;1"]) ?
      Components.classes['@mozilla.org/supports-wstring;1']
        .createInstance(nsISupportsString) :
      Components.classes['@mozilla.org/supports-string;1']
        .createInstance(nsISupportsString);
    ua.data = aEvent.target.culMenu.agent;
    
    // 項目に値を設定
    pref.setComplexValue("general.useragent.override", nsISupportsString, ua);
  }
  
  function setUserAgentDisplay(menuPopup) {
    var menu = menuPopup.childNodes;
    
    var pref = Components.classes["@mozilla.org/preferences;1"]
      .getService(Components.interfaces.nsIPrefBranch);
    
    var nsISupportsString = Components.interfaces.nsISupportsWString ||
      Components.interfaces.nsISupportsString;
    
    // general.useragent.overrideが存在するか
    var ua;
    try{
      ua = pref.getComplexValue("general.useragent.override", nsISupportsString).data;
    }catch(e){
      ua;
    }
    
    // 無ければデフォルト
    if(!ua){
      menu[0].setAttribute("checked", true);
      return;
    }
    
    // 設定値にチェック
    for(var i = 0; i < menu.length; i++){
      if(!menu[i].culMenu) continue; // 区切り
      if(menu[i].culMenu.agent == ua) {
        menu[i].setAttribute("checked", true);
        break;
      }
    }
  }
  
};