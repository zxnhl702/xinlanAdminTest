/**
 * 投票评论管理页面的javascript
 */
$(function() {
	/**
	 * 常量部分
	 */
	// ajax的后台地址
	var _callAjax = _genCallAjax(ajaxVoteURL);
	// 投票编号
	var vote_id = _getPar("vote_id");
	
	// 翻页之后刷新页面数据
	var pageVoteComment = _pageBar([], ".items", "#item-left", "#item-right", function(ids) {
		$("#items-list").empty();
		_callAjax({
			"cmd":"getAllVoteCommentsByIds",
			"ids":ids.join("|"),
			"vote_id":vote_id
		}, function(d) {
			if(null != d.data) {
				updatePage(d.data);
			}
		});
	});
	
	// 更新投票评论管理页面信息
	updatePage = function(items) {
		// 填充页面数据
		items.forEach(function(r) {
			var str = '<tr data-id="' + r.id + '">' + '<td>' + r.id + '</td>' + 
					'<td>' + r.comment + '</td>' + 
					'<td>' + r.logdate + '</td>' + 
					'<td>' + '<a class="btn medium bg-red">' + 
					'<span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-remove"></i>删除</span>' + 
					'</a>' + '</td>' + '</tr>'
			var e = $(str).appendTo("#items-list");
			
			// 删除本条评论
			e.find("a:has(.icon-remove)").click(function() {
				_callAjax({
					"cmd":"removeVoteCommentById",
					"id":r.id
				},function(d) {
					if (!d.success) return _toast.show("删除评论失败");
					_toast.show("删除评论成功");
					var pageIds = pageVoteComment.pages();
					pageIds.splice(pageIds.indexOf(r.id),1);
					pageVoteComment.renew(pageIds);
				})
			});
		})
	};
	
	// 页面初始化  获取投票项目编号
	initVoteCommentsList = function() {
		_callAjax({
			"cmd":"getVoteCommentsIds",
			"vote_id":vote_id,
		}, function(d){
			pageVoteComment.renew(d.data, 1);
		});
	}
	initVoteCommentsList();
});