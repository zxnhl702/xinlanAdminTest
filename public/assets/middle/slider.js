//var _set = function(k,v) { window.localStorage.setItem(k,v); }
//var _get = function(k) { return window.localStorage.getItem(k); }
var user_id = _getPar("user_id");
if (user_id == "") user_id = 1;
$("#sidebar-menu > ul > li").hide();
//var t = _get("xinlan_privilege");
var t = _getPar("privilege");
if (t != '') {
	$("."+t).show();
}
$("#hotSpot-manage").attr("href", "hotSpot-manage.html?user_id="+user_id+"&privilege="+t);
$("#hotNews-add").attr("href", "hotNews-add.html?user_id="+user_id+"&privilege="+t);
$("#vote-manage").attr("href", "vote.html?user_id="+user_id+"&privilege="+t);