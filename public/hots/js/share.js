/**
 * 分享页填充内容用js
 */
$(function() {
	// 页面URL
	var local_url = document.location.href;

	// 从URL中取得特定参数
	var _getParamString = function(url,paramName) {
		var result = new RegExp("(^|)"+paramName+"=([^\&]*)(\&|$)","gi").exec(url),param;
		if(param=result){
			return param[2];
		}
		return "";
	}

	// 热点标题
	var hot_title = decodeURI(_getParamString(local_url, "hot_title"));
	// 事件标题
	var event_title = decodeURI(_getParamString(local_url, "event_title"));
	// 事件内容
	var content = decodeURI(_getParamString(local_url, "share_content"));

	// 有事件内容
	if('' != content) {
		// 填充事件内容  带html标签
		$("#content").html(content);
	}
	// 有热点标题
	if('' != hot_title) {
		// 填充热点标题  只文字
		$("#hot_title").text(hot_title);
	}
	// 有事件标题
	if('' != event_title) {
		// 填充事件标题  只文字
		$("#event_title").text(event_title);
	}
})
