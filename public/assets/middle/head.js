//var _set = function(k,v) { window.localStorage.setItem(k,v); }
//var _get = function(k) { return window.localStorage.getItem(k); }
//var i = _get("xinlan_id");
var i = _getPar("user_id");
if (i == "") i = 1;
$("#user-img").attr("src", imgRootURL+"/xinlanUser/"+i+".jpg");

$("#logout").click(function() {
  _set("xinlan_privilege", "");
  location.href = "/login/index.html";
});
