/**
 * 分享页2填充内容用js
 */
$(function() {
	// 后台ajax的URL
	var _callAjax = _genCallAjax(ajaxURL);
	// 左侧小图标的URL
	var imgsrc = userImgURL+"/xinlanUser/";

	// 获取热点id和事件id
	var array = document.location.search.substring(1).split(',');
	var hot_id = array[0];
	var event_id = array[1];
	// 左侧小图标下面的文字
	var users = ["admin", "无限舟山", "前方记者"];
	// 页面事件id记录
	var minEvnetId = -1;
	
	$("#share-banner").attr("src", userImgURL+'hots/top_img'+ hot_id+'.jpg');
	
	// 更新页面事件信息
	var updateEvents = function(d) {
		if(d.data == null) {
			$(".share-more").hide();
			return _toast.show("全部加载完成！");
		}
		d.data.forEach(function(r) {
			// 拼事件的html
			var str = '<div class="list clearfix mt10 mb5" data-id='+r.id+'>' + 
						'<div class="list-logo l">' + 
						'<img src="' + imgsrc + r.userid + '.jpg" width="100%">' + 
						'<p class="tc">' + users[parseInt(r.userid)-1] + '</p>' + '</div>' + 
						'<div class="list-main rel r bg_light pct70 p10">' + 
						'<header>' + '<h6 class="mt1 calm">' + r.title + '</h6>' + 
						'<time class="g9">' + _howLongAgo(r.logdate) + '</time>' + '</header>' + 
						'<article class="mt10">' + r.content + '</article>'+ '</div>' + '</div>';
			// 拼完的html写入页面
			var e = $(str).appendTo("#events");
			// 取页面最小的事件id
			if(-1 == minEvnetId || r.id < minEvnetId) {
				minEvnetId = r.id;
			}
		});
		$('.list-main>article>p>video').bind('tap',function() {
			if($(this)[0].paused) {
				$(this)[0].play();
			} else {
				$(this)[0].pause();
			}
		});
	}
	
	//  ajax取热点标题、报道数、访问量、热点描述
	_callAjax({
		"cmd":"getHotInfoById",
		"hot_id":hot_id
	}, function(d) {
		if(d.success) {
			$("#hot-title").text(d.data.title);
			$("title").text(d.data.title);
			$("#events-count").text("报道数："+d.data.eventsCount);
			$("#clicks-count").text(d.data.clicksCount+" 次浏览量");
			if(d.data.description != null || d.data.description != "") {
				$("#share-info").text(d.data.description);
			} else {
				$("#share-info").hide();
			}
		} else {
			_toast.show("页面初始化失败！");
		}
	});
	
	// ajax取分享页单条事件
	_callAjax({
		"cmd":"getSharedEventById",
		"hot_id":hot_id,
		"event_id":event_id
	}, function(d) {
		if(d.success) {
			// 更新页面事件信息
			updateEvents(d);
//			// 拼html
//			var str = '<div class="list-logo l">' + 
//						'<img src="http://127.0.0.1:11001/images/xinlanUser/' + d.data.userid + '.jpg" width="100%">' + 
//						'<p class="tc">' + users[parseInt(d.data.userid)-1] + '</p>' + '</div>' + 
//						'<div class="list-main rel r bg_light pct70 p10">' + 
//						'<header>' + '<h6 class="mt1 calm">' + d.data.title + '</h6>' + 
//						'<time class="g9">' + _howLongAgo(d.data.logdate) + '</time>' + '</header>' + 
//						'<article class="mt10">' + d.data.content + '</article>'+ '</div>';
//			var e = $(str).appendTo("#events");
		} else {
			_toast.show("数据加载失败！");
		}
	});
	
	// 加载更多
	$(".share-more").bind('click', function() {
		// ajax取后5条事件
		_callAjax({
			"cmd":"getTop5Events",
			"hot_id":hot_id,
			"from":minEvnetId
		}, function(d) {
			if(d.success) {
				// 更新页面事件信息
				updateEvents(d);
			} else {
				_toast.show("数据加载失败！");
			}
		});
	});
	
	// 点击下载
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
})