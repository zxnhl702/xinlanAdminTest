/**
 * 分享页填充内容用js
 */
$(function() {
	var _callAjax = _genCallAjax("http://127.0.0.1:11006/xinlan/");

	var array = document.location.search.substring(1).split(',');
	var hot_id = array[0];
	var event_id = array[1];
	
	// ajax取分享页数据
    _callAjax({
    	"cmd":"getSharedContent",
    	"hot_id":hot_id,
    	"event_id":event_id
    }, function(d){
    	// 有事件内容
    	if('' != d.data.content) {
    		// 填充事件内容  带html标签
    		$("#content").html(d.data.content);
    	}
    	// 有热点标题
    	if('' != d.data.hotTitle) {
    		// 填充热点标题  只文字
    		 $("#hot_title").text(d.data.hotTitle);
    	}
    	// 有事件标题
    	if('' != d.data.eventTitle) {
    		// 填充事件标题  只文字
    		$("#event_title").text(d.data.eventTitle);
    	}
    });
})
