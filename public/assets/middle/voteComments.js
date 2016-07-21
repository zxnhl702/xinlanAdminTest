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
	// 审核否
	var isOnlineStr = ["未审核","已审核"];
	var btnStr = ["审核","撤回"]
	
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
	
	// 拼接是否审核过的html
	var getOnlineStr = function(isOnline) {
		if(isOnline) {
			return isOnlineStr[isOnline];
		} else {
			return '<div class="label bg-red">' + isOnlineStr[isOnline] + '</div>';
		}
	}
	
	// 拼接审核/撤回按钮的html
	var getCheckBtn = function(isOnline) {
		if(isOnline) {
			return '<a class="btn medium bg-red"><span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-ban-circle"></i>撤回</span></a>';
		} else {
			return '<a class="btn medium bg-green"><span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-check"></i>审核</span></a>';
		}
	}
	
	// 更新投票评论管理页面信息
	updatePage = function(items) {
		// 填充页面数据
		items.forEach(function(r) {
			var str = '<tr data-id="' + r.id + '" data-isOnline="' + r.isOnline + '">' + '<td>' + r.id + '</td>' + 
					'<td>' + r.comment + '</td>' + 
					'<td>' + r.logdate + '</td>' + 
					'<td>' + getOnlineStr(r.isOnline) + '</td>' + 
					'<td>' + 
					'<span data-id="' + r.id + '">' + getCheckBtn(r.isOnline) + '</span>' + 
					'<a class="btn medium bg-red"><span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-remove"></i>删除</span></a>' +
					'</td></tr>'
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
			// 审核/撤回评论
			e.find('span[data-id="' + r.id + '"]').click(function() {
				var isOnline = e.attr("data-isOnline") - "0";
				var obj = $(this);
				
				_callAjax({
					"cmd": "updateVoteCommentStatus",
					"id": r.id,
					"changeTo": isOnline ^ 1
				}, function(d) {
					_toast.show(d.errMsg);
					if(d.success) {
						e.find("td:eq(3)").html(getOnlineStr(isOnline ^ 1));
						obj.html(getCheckBtn(isOnline ^ 1));
						e.attr("data-isOnline", isOnline ^ 1);
					}
				})
			})
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