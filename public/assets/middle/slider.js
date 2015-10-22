var _set = function(k,v) { window.localStorage.setItem(k,v); }
var _get = function(k) { return window.localStorage.getItem(k); }
$("#sidebar-menu > ul > li").hide();
var t = _get("xinlan_privilege");
if (t != '') {
  $("#"+t).show();
//	$("."+t).show();
}
