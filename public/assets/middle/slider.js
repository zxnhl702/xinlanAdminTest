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
// 热点管理
$("#hotSpot-manage").attr("href", "hotSpot-manage.html?user_id="+user_id+"&privilege="+t);
// 热点修改
$("#hotSpot-modify").attr("href", "hotSpot-modify.html?user_id="+user_id+"&privilege="+t);
// 新增热点
$("#hotNews-add").attr("href", "hotNews-add.html?user_id="+user_id+"&privilege="+t);
// 新增投票
$("#vote-manage").attr("href", "vote.html?user_id="+user_id+"&privilege="+t);
// 直播管理
$("#video-manage").attr("href", "video.html?user_id="+user_id+"&privilege="+t);
// 新增问答
$("#quiz-manage").attr("href", "quiz.html?user_id="+user_id+"&privilege="+t);