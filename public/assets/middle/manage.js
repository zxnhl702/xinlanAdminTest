$(function() {
	var _callAjax = _genCallAjax(ajaxRootURL),
			hot_id = _getPar("hot_id");
	if (hot_id == '') return;
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	var isPublished = ["未发布", "已发布"];
	var publishBtnName = [" 发布", " 撤回"];
	var btnClass = ["icon-ok", "icon-remove-circle"];

	var pageEvent = _pageBar([], ".pages", "#page-left", "#page-right", function(ids) {
		$("#events").empty();
		$(".hotNews-comments").hide();
		_callAjax({
			"cmd":"getEventsByIds",
			"ids":ids.join("|")
		}, function(d) {
			updatePage(d.data);
		});
	});
	var pageComment = _pageBar([], ".comments", "#comment-left", "#comment-right", function(ids) {
		$(".messages-box").empty();
		_callAjax({
			"cmd":"getCommentsByIds",
			"ids":ids.join("|")
		}, function(d) {
			updateComment(d.data);
		});
	});

	var updatePage = function(events) {
		events.forEach(function(r) {
			// 网友从前端发布的事件 红色背景色注明 并且把标题改成"网友发布的事件"
			if("1" != r.userid && "2" != r.userid && "3" != r.userid) {
				r.title = "网友发布的事件";
				var tdTitle = '<td class="font-bold text-left"><div class="label bg-red">'+r.title+'</div></td>';
			} else {
				var tdTitle = '<td class="font-bold text-left">'+r.title+'</td>';
			}
			var str = '<tr data-logdate="'+r.logdate+'" data-eventId="'+r.id+'" data-published="'+r.isPublished+'">' + 
				'<td>'+r.id+'</td>' + tdTitle + 
				'<td class="font-bold">'+r.username+'</td>' + 
				'<td><div class="label bg-orange">+'+r.commentsCount+'</div></td>' + 
				'<td class="font-bold">'+isPublished[r.isPublished]+'</td>' + 
				'<td><div class="dropdown">' + 
				'<a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a>' + 
				'<ul class="dropdown-menu float-right">' + 
				'<li><a href="javascript:;" title="">' + 
				'<i class="glyph-icon ' + btnClass[r.isPublished] + ' mrg5R"></i>' + publishBtnName[r.isPublished] + '</a></li>' + 
				'<li><a href="javascript:;" title=""><i class="glyph-icon icon-edit mrg5R"></i> 编辑</a></li>' + 
				'<li><a href="javascript:;" title=""><i class="glyph-icon icon-comment-alt mrg5R"></i> 查看评论</a></li>' + 
				'<li class="divider"></li>' + 
				'<li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li>' + 
				'</ul></div></td></tr>';
			var e = $(str).appendTo("#events");
			// 发布/撤回事件
			e.find("li:eq(0)").click(function() {
				changeEventPublishStatus(r.id);
			})
			// 编辑事件
			e.find("a:has(.icon-edit)").click(function() {
				location.href = "hotNews-add.html?event_id="+r.id+
														"&user_id="+user_id+
														"&privilege="+privilege+
														"&hot_id="+hot_id;
			});
			// 查看评论
			e.find("a:has(.icon-comment-alt)").click(function() {
				$(".hotNews-comments").show();
				_callAjax({
					"cmd":"getCommentsIds",
					"event_id":r.id
				}, function(d) {
					$("#comment-title").text(r.title);
					$(".hotNews-comments").show();
					if (!d) d = {"data":[]}
					pageComment.renew(d.data, 1);
				});
			});
			// 删除事件
			e.find("a:has(.icon-remove)").click(function(){
				_callAjax({
					"cmd":"deleteEvent",
					"id": r.id
				}, function(d) {
					if (!d.success) return;
					pageIds = pageEvent.pages();
					pageIds.splice(pageIds.indexOf(r.id), 1);
					pageEvent.renew(pageIds);
				});
			});
		});
	};
	
	// 发布/撤回事件
	var changeEventPublishStatus = function(eventId) {
		// 当前行
		var obj = $('tr[data-eventid="'+ eventId +'"]');
		// 是否发布的状态
		var published = $(obj).attr('data-published');
		// 发布/撤回按钮
		var btn = obj.find('ul li:eq(0)');
		
		_callAjax({
			"cmd": "changeEventIsPublished",
			"event_id": eventId,
			"changeTo": published ^ 1
		}, function(d) {
			_toast.show(d.errMsg);
			if(d.success) {
				// 修改表格中的发布状态
				obj.find('td:eq(3)').text(isPublished[published ^ 1]);
				// 修改按钮
				btn.find('a').html('<i class="glyph-icon ' + btnClass[published ^ 1] + ' mrg5R"></i>' + publishBtnName[published ^ 1]);
				// 修改当前行的发布状态
				$(obj).attr('data-published', published ^ 1);
			}
		})
	}

	var updateComment = function(comments) {
		comments.forEach(function(r) {
			var str =	'<li><div class="messages-img"><img width="32" src="'+r.img+'" alt=""></div><div class="messages-content"><div class="messages-title clearfix"> <a href="#" title="Message title" class="float-left">'+r.name+'</a> <div class="messages-time float-left mrg20L"> '+_howLongAgo(r.logdate)+' <span class="glyph-icon icon-time"></span> </div> <span class="badge label btn bg-blue-alt font-size-11 mt1 float-right ">删除</span> </div> <div class="messages-text">'+r.content+'</div> </div> </li>';
			var e = $(str).appendTo(".messages-box");
			e.find(".badge").click(function() {
				_callAjax({
					"cmd":"deleteComment",
					"id": r.id
				}, function(d) {
					if (!d.success) return;
					commentIds = pageComment.pages();
					commentIds.splice(commentIds.indexOf(r.id), 1);
					_tell(commentIds);
					pageComment.renew(commentIds);
				});
			});
		});
	};

	_callAjax({
		"cmd":"getEventsIds",
		"hot_id":hot_id,
	}, function(d){
		pageEvent.renew(d.data, 1);
	});
});
