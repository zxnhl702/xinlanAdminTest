/**
 * 新增投票页面的javascript
 */
$(function() {
	/**
	 * 常量部分
	 */
	// ajax的后台地址
	var _callAjax = _genCallAjax(ajaxVoteURL);
	// 上传图片ajax的后台地址
	var fileUploadURL = fileUploadVoteURL;
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	// 投票操作按钮
	var voteOpButtonName = new Array("null", "投票开始", "投票结束", "投票再开始");
	// 投票类型
	var voteStatus = new Array("已删除", "准备中", "进行中", "已结束");
	// 投票类型
	var voteType = new Array("图片投票", "音频投票", "视频投票");
	// 元激活tab
	var activeTab = "add-tab";
	//$.getScript('assets/middle/slider.js');
	/**
	 * 新增投票tab
	 */
	pageVote = _pageBar([], ".votes", "#vote-left", "#vote-right", function(ids) {
		$("#votes-list").empty();
		_callAjax({
			"cmd":"getAllVotesByIds",
			"ids":ids.join("|")
		}, function(d) {
			updateVotes(d.data);
		})
	});
	
	// 新增投票tab初始化 获取投票编号
	var initVoteList = function() {
		_callAjax({
			"cmd":"getVotesIds"
		}, function(d){
			pageVote.renew(d.data, 1);
		});
	}
	initVoteList();
	
	// 更新页面投票信息
	var updateVotes = function(votes) {
		// 填充页面数据
		votes.forEach(function(r) {
			var str = '<tr><td>' + r.id + '</td>' + 
						'<td class="font-bold text-left">' + r.title + '</td>' + 
						'<td class="text-left" data-status="' + r.status + '">' + voteStatus[r.status] + '</td>' + 
						'<td class="text-left">' + voteType[r.type] + '</td>' + 
						'<td><div class="label bg-orange">' + r.itemCount + '</div></td>' +
						'<td><div class="label bg-orange">' + r.voteCount + '</div></td>' +
						'<td><div class="label bg-orange">' + r.clickCount + '</div></td>' +
						'<td><div class="dropdown">' + 
						'<a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a>' +
						'<ul class="dropdown-menu float-right">' + 
						'<li><a href="javascript:;" title=""><i class="glyph-icon icon-gear mrg5R"></i> 投票项管理</a></li>' + 
						'<li ><a href="javascript:;" title=""><i class="glyph-icon icon-circle mrg5R"></i>' + 
						'<label data-status="' + r.status + '"> ' + voteOpButtonName[r.status] + '<label></a></li>' + 
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
			
			// 投票活动开始/结束
			e.find("a:has(.icon-circle)").click(function() {
				console.log("test");
				var status = r.status;
				// 准备中-》进行中 || 进行中-》已结束
				if(1 == status || 2 == status) {
					status++;
				// 已结束-》进行中(再开始)
				} else if(3 == status) {
					status--;
				}
				// 更新投票状态
				_callAjax({
					"cmd": "updateVoteStatus",
					"id": r.id,
					"originStatus": r.status,
					"changeTo": status
				}, function(d) {
					_toast.show(d.errMsg);
					if(d.success) {
						e.find("label[data-status]").text(' ' + voteOpButtonName[status]);
						e.find("td[data-status]").text(voteStatus[status]);
						e.find("label[data-status]").attr('data-status', status);
						e.find("td[data-status]").attr('data-status', status);
						r.status = status;
					}
				})
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
				_tell(d);
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
						initVoteList();
					}
				});
			}
		});
	});
	
	/**
	 * 修改投票tab
	 */
	// 得到投票活动列表
	getVoteNameList = function(votestatus) {
		_callAjax({
			"cmd": "getVoteNameList",
			"votestatus": votestatus,
		},function(d) {
			if(d.success) {
				// 加载选择列表
				$("#select-vote-name").empty();
				$('<option value="" selected="selected">请选择...</option>').appendTo("#select-vote-name");
				d.data.forEach(function(r) {
					var str = '<option value='+r.id+'>'+r.id+' '+r.title+'</option>';
					$(str).appendTo("#select-vote-name");
				})
			}
		})
	}
	// 得到修改用投票活动信息
	getVoteInfoById = function(id) {
		_callAjax({
			"cmd": "getVoteInfoById",
			"id": id,
		}, function(d) {
			if(d.success) {
				$("#modify-title").val(d.data.title);
				$("#modify-title").parent().attr("data-original", d.data.title);
			}
		})
	}
	
	// 修改投票
	updateVote = function() {
		// 表单内容检测
		var title = $("#modify-title").val().replace(/\s/g, "");
		var topImg = $("#modify-banner").val().replace(/\s/g, "");
		var profileImg = $("#modify-profile").val().replace(/\s/g, "");
		if (title == '') return _toast.show("请填写标题");
		if(("" != topImg && !_checkImgType(topImg)) || 
			("" != profileImg) && !_checkImgType(profileImg)) {
			return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");
		}
		// 上传图片的表单
		var uploadForm = jq("#modify-vote");
		var formfiles = "";
		uploadForm.find("input[type='file']").each(function(i,r) {
			// 需要上传文件 真实文件名
			if("" != r.value) {
				formfiles = formfiles + ',' + r.name;
			// 不需要上传文件 设置为null字符串
			} else {
				formfiles = formfiles + ',' + "null";
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
				_tell(d);
				if(false == d.success) {
					return _toast.show("上传图片失败，请重试");
				}
				var filenames = d.data;
				if(title == $("#modify-title").parent().attr("data-original")) {
					title = "null";
				}
				// 更新投票ajax
				_callAjax({
					"cmd":"updateVote",
					"id": $("#select-vote-name").val().replace(/\s/g, ""),
					"title":title,
					"topImg":filenames[0],
					"profileImg":filenames[1],
				}, function(d){
					_toast.show(d.errMsg);
					if (d.success) {
						// 清空表单
						uploadForm.clearForm();
						// 初始化选择框数据
						$("#select-vote-status").val(99);
						getVoteNameList(99);
						// 禁用修改并上传按钮
						$("#modify-vote-a").addClass("disabled");
					}
				});
			}
		});
	}
	
	// 选择投票类型改变时
	$("#select-vote-status").change(function() {
		// 根据选择的类型重新加载投票选择列表
		getVoteNameList($(this).val().replace(/\s/g, ""));
	})
	
	// 选择投票改变时
	$("#select-vote-name").change(function() {
		// 选择投票项
		if("" != $(this).val().replace(/\s/g, "")) {
			// 按钮可用
			$("#modify-vote-a").removeClass("disabled");
			// 加载对应投票活动数据到表单
			getVoteInfoById($(this).val().replace(/\s/g, ""));
		// 未选择投票项
		} else {
			// 清空表单
			jq("#modify-vote").clearForm();
			// 按钮不可用
			$("#modify-vote-a").addClass("disabled");
		}
	})
	
	// 修改投票按钮按下时
	$("#update-vote").click(function() {
		// 上传文件并更新投票信息
		updateVote();
	})

	/**
	 * tab切换
	 */
	// tab切换
	$('.tabs ul li').click(function(e) {
		// 切换到不同的tab
		if(activeTab != $(this).attr('data-tabname')) {
			// 激活新增投票tab
			if("add-tab" == $(this).attr('data-tabname')) {
				// 清空修改投票tab中表单数据
				jq("#modify-vote").clearForm();
				// 初始化新增投票tab中数据
				initVoteList();
			// 激活修改投票tab
			} else if("modify-tab" == $(this).attr('data-tabname')) {
				// 清空新增投票tab中表单数据
				jq("#new-vote").clearForm();
				// 清空新增投票tab中表格数据
				$("#votes-list").empty();
				// 初始化投票选择
				getVoteNameList(99);
				// 禁用修改并上传按钮
				$("#modify-vote-a").addClass("disabled");
			// 激活数据统计tab
			} else {
				
			}
			// 更改激活tab为当前tab
			activeTab = $(this).attr('data-tabname');
		}
	})
});
