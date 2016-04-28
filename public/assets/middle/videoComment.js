$(function() {
	var _callAjax = _genCallAjax(ajaxVideoURL),
			video_id = _getPar("video_id");
	if (video_id == '') return;
    
	_callAjax({
		"cmd":"getVideosByIds",
		"ids":video_id
	}, function(d) {
		d.data.forEach(function(r) {
			//alert(JSON.stringify(r.title))
			$("#title").text(r.title);
		});
	})
    
	var pageComment = _pageBar([], ".comments", "#comment-left", "#comment-right", function(ids) {
		$("#comments").empty();
		_callAjax({
			"cmd":"getVideoCommentByIds",
			"ids":ids.join("|")
		}, function(d) {
			updatePage(d.data);
		});
	});

	var updatePage = function(events) {
		events.forEach(function(r) {
			var str="";
			if(r.ischecked=="0"){
				 str = '<tr><td>'+r.id+'</td><td class="font-bold text-left">'+r.comment+'</td><td>'+r.username+'</td><td>'+r.logdate+'</td><td>未审核</td><td><div class="dropdown"><a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a><ul class="dropdown-menu float-right"><li id="video-comment-edit"><a href="javascript:;" title="" id="check'+r.id+'"><i class="glyph-icon icon-edit mrg5R"></i> 审核</a></li><li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li></ul></div></td></tr>';
			}else{
				 str = '<tr><td>'+r.id+'</td><td class="font-bold text-left">'+r.comment+'</td><td>'+r.username+'</td><td>'+r.logdate+'</td><td>审核</td><td><div class="dropdown"><a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a><ul class="dropdown-menu float-right"><li id="video-comment-edit"><a href="javascript:;" title="" id="reply'+r.id+'"><i class="glyph-icon icon-edit mrg5R"></i> 评论</a></li><li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li></ul></div></td></tr>';
			}
			//var str = '<tr><td>'+r.id+'</td><td class="font-bold text-left">'+r.comment+'</td><td>'+r.username+'</td><td>'+r.logdate+'</td><td>ss</td><td><div class="dropdown"><a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a><ul class="dropdown-menu float-right"><li id="video-comment-edit"><a href="javascript:;" title=""><i class="glyph-icon icon-edit mrg5R"></i> 修改</a></li><li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li></ul></div></td></tr>';
			//var str = '<tr data-logdate="'+r.logdate+'"><td>'+r.id+'</td><td class="font-bold text-left">'+r.title+'</td><td><div class="label bg-orange">+'+r.commentsCount+'</div></td><td><div class="dropdown"><a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a><ul class="dropdown-menu float-right"><li><a href="javascript:;" title=""><i class="glyph-icon icon-edit mrg5R"></i> 编辑</a></li><li><a href="javascript:;" title=""><i class="glyph-icon icon-comment-alt mrg5R"></i> 查看评论</a></li><li class="divider"></li><li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li></ul></div></td></tr>';
			var e = $(str).appendTo("#comments");
			
			$('#check'+r.id).click(function(){
				_callAjax({
					"cmd":"updataVideoComment",
					"comment_id": r.id
				}, function(d) {
					if (!d.success) return;
					pageIds = pageComment.pages();
					pageComment.renew(pageIds);
				});
			});
			$('#reply'+r.id).click(function(){
				layer.prompt({title: '请输入评论内容', formType: 2,value:''}, function(text){
					//alert(text.replace(/\n/g, "|"));
					if (text=="") _toast.show("评论不能为空");
					_callAjax({
						"cmd":"addCommentReply",
						"comment_id": r.id,
						"reply":text.replace(/\n/g, "")
					}, function(d) {
						if (!d.success) layer.msg('提交失败');
						layer.msg('提交成功');
					});
				});
				
			});
			e.find("a:has(.icon-remove)").click(function(){
				_toast.confirm("确定删除吗？",function(index){
					if(index){
						_callAjax({
							"cmd":"deleteVideoComment",
							"id": r.id
						}, function(d) {
							if (!d.success) return;
							pageIds = pageComment.pages();
							pageIds.splice(pageIds.indexOf(r.id), 1);
							pageComment.renew(pageIds);
						});
					}
				});
				
			});
		});
	};

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
		"cmd":"getAllVideoCommentIds",
		"video_id":video_id,
	}, function(d){
		pageComment.renew(d.data, 1);
	});
});
