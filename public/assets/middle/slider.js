$("#sidebar-menu > ul > li").hide();
var t = _get("xinlan_privilege");
if (t != '') {
  $("#"+t).show();
//	$("."+t).show();
}
