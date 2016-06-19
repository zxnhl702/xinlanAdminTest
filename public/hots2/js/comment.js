$(function(){
	var hot_id = _getPar("hot_id");
//	var from = 0;
	var limit = 10;
	if (hot_id == '') return;
	var _callAjax = _genCallAjax(ajaxURL);
	
	var updateComments = function(comments) {
		var ul = $(".list-comment ul");
		if (!comments) return;
		comments.forEach(function(r) {
			var str = '<li data-id='+r.id+'><header>' + 
				'<img src="' + r.img + '"/>' + 
				'<h5>' + r.name + ' <span>' + _howLongAgo(r.logdate) + '</span></h5>' + '</header>' + 
				'<p>' + r.content + '</p>' + '</li>';
			$(str).appendTo(ul);
		});
		myScroll.refresh();
	};
	
	var myScroll;
	myScroll = new IScroll('#wrapper', {
		probeType: 3,
		mouseWheel: true
	});
	myScroll.on("scroll", function() {
		var y = this.y,
			maxY = this.maxScrollY - y;
		if (y >= 40) {
			$('#pullDown-msg').text('松手立即刷新');
			return "";
		} else if (y < 40 && y > 0) {
			$('#pullDown-msg').text('下拉刷新');
			return "";
		}
		if (maxY >= 40) {
			$('#pullUp-msg').text('松手加载数据');
			return "";
		} else if (maxY < 40 && maxY >= 0) {
			$('#pullUp-msg').text('上拉加载');
			return "";
		}
	});
	myScroll.on("slideDown", function() {
		if (this.y > 40) {
			location.reload();
		}
	});
	myScroll.on("slideUp", function() {
		if (this.maxScrollY - this.y > 40) {
//			$('.list-comment>ul').append('<li><header><img src="http://img1.imgtn.bdimg.com/it/u=2051191299,480014842&fm=23&gp=0.jpg"><h5>用户名 <span>2小时前</span></h5></header><p>评论内容评论内容评论内容评论内容评论内容评论内容评论内容</p></li>');
			var eLast = $(".list-comment > ul > li:last");
			if (!eLast) return;
			var from = eLast.attr("data-id");
			getComments(from);
//			myScroll.refresh();
			$('#pullUp-msg').text('上拉加载');
		}
	});
	// 获取评论
	getComments = function(from) {
		_callAjax({
			"cmd": "getHotComments",
			"hot_id": hot_id,
			"from": from,
			"limit": limit
		}, function(d) {
			if(d.success) {
				if(null != d.data) {
					updateComments(d.data);
				} else {
					_toast.show("全部评论加载完成");
				}
			}
		})
	}
	// 页面初始化
	init = function() {
		getComments(0);
		
		_callAjax({
			"cmd":"getHotInfoById",
			"hot_id":hot_id
		}, function(d){
			$('title').text(d.data.title);
		});
	}
	init();
});
