/**
 * 新增投票页面的javascript
 */
$(function() {
	// ajax的后台地址
	var _callAjax = _genCallAjax(ajaxVoteURL);
	// 上传图片ajax的后台地址
	var fileUploadURL = fileUploadVoteURL;
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	// 投票类型
	var voteType = new Array("图片投票", "音频投票", "视频投票");
	pageVote = _pageBar([], ".votes", "#vote-left", "#vote-right", function(ids) {
		$("#votes-list").empty();
		_callAjax({
			"cmd":"getAllVotesByIds",
			"ids":ids.join("|")
		}, function(d) {
			updateVotes(d.data);
		})
	});
	
	// 更新页面投票信息
	var updateVotes = function(votes) {
		// 填充页面数据
		votes.forEach(function(r) {
			var str = '<tr><td>' + r.id + '</td>' + 
						'<td class="font-bold text-left">' + r.title + '</td>' + 
						'<td class="text-left">' + voteType[r.type] + '</td>' + 
						'<td><div class="label bg-orange">' + r.itemCount + '</div></td>' +
						'<td><div class="label bg-orange">' + r.voteCount + '</div></td>' +
						'<td><div class="label bg-orange">' + r.clickCount + '</div></td>' +
						'<td><div class="dropdown">' + 
						'<a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a>' +
						'<ul class="dropdown-menu float-right">' + 
						'<li><a href="javascript:;" title=""><i class="glyph-icon icon-gear mrg5R"></i> 管理</a></li>' + 
						'<li class="divider"></li>' + 
						'<li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li>' + 
						'</ul></div></td></tr>';
			var e = $(str).appendTo("#votes-list");
			
			// 跳转到管理投票页面
			e.find("a:has(.icon-gear)").click(function() {
				location.href = "vote-manage.html?vote_id=" + r.id + 
												"&user_id=" + user_id + 
												"&privilege=" + privilege;
			});
			
			// 删除本条数据
			e.find("a:has(.icon-remove)").click(function() {
				_callAjax({
					"cmd":"removeVoteLogicallyById",
					"id":r.id
				},function(d) {
					if (!d.success) return _toast.show("删除投票失败");
					_toast.show("删除投票成功");
					var pageIds = pageVote.pages();
					pageIds.splice(pageIds.indexOf(r.id),1);
					pageVote.renew(pageIds);
				})
			});
		});
	};
	
	// 新增投票
	$("#append-vote").click(function() {
		// 表单内容检测
		var title = $("#new-title").val().replace(/\s/g, "");
		var topImg = $("#new-banner").val().replace(/\s/g, "");
		var profileImg = $("#new-profile").val().replace(/\s/g, "");
		var voteType = $("#new-type").val().replace(/\s/g, "");
		if (title == '') return _toast.show("请填写标题");
		if (topImg == '') return _toast.show("请选择投票头图");
		if (profileImg == '') return _toast.show("请选择投票简介图");
		if (!_checkImgType(topImg) || !_checkImgType(profileImg)) 
			return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");

		// 上传图片的表单
		var uploadForm = jq("#new-vote");
		var formfiles = "";
		uploadForm.find("input[type='file']").each(function(i,r) {
			if("" != r.value) {
				formfiles = formfiles + ',' + r.name;
			}
		});
		// input type=file标签中的name组成的字符串
		formfiles = formfiles.substring(1);
		// 上传图片
		uploadForm.ajaxSubmit({
			"url": fileUploadURL,
			"type": "post",
			"dataType": "json",
			"data": {
				formfile: formfiles
			},
			"success": function(d) {
				if(false == d.success) {
					_toast.show("上传图片失败，请重试");
					return;
				}
				var filenames = d.data;
				// 新增投票ajax
				_callAjax({
					"cmd":"newVote",
					"title":title,
					"topImg":filenames[0],
					"profileImg":filenames[1],
					"voteType":voteType
				}, function(d){
					if (d.success) {
						_toast.show("新增投票成功");
						// 清空表单
						uploadForm.clearForm();
						// 刷新页面数据
						_callAjax({
							"cmd":"getVotesIds"
						}, function(d){
							pageVote.renew(d.data, 1);
						});
					}
				});
			}
		});
	});
	
	// 页面初始化 获取投票编号
	_callAjax({
		"cmd":"getVotesIds"
	}, function(d){
		pageVote.renew(d.data, 1);
	});
});
