/**
 * 分享页填充内容用js
 */
$(function() {
	var _callAjax = _genCallAjax("http://127.0.0.1:11002/xinlan/");

	var array = document.location.search.substring(1).split(',');
	var hot_id = array[0];
	var event_id = array[1];

	$('#downLink').click(function(){
		 // weixin&ios
		var dvc = _getDev();
		if('iOS' == dvc && _isWeixin()) {
			$('body').append('<div class="share-layer"><img src="img/downLink.png" width="100%" /></div>');
			$('.share-layer').click(function(){
				$(this).remove();
			})
			return false;
		}
	});

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
			// 修改网页title
			document.title = d.data.hotTitle+"直播中";
		}
		// 有事件标题
		if('' != d.data.eventTitle) {
			// 填充事件标题  只文字
			$("#event_title").text(d.data.eventTitle);
		}
	});
})
