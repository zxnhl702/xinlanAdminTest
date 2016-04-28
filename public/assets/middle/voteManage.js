/**
 * 投票管理页面的javascript
 */
$(function() {
	$('#newUploadProgress').hide();
	$('#modifyUploadProgress').hide();
	/**
	 * 常量部分
	 */
	// ajax的后台地址
	var _callAjax = _genCallAjax(ajaxVoteURL);
	// 上传图片ajax的后台地址
	var fileUploadURL = fileUploadVoteURL;
	// 图片服务器地址
	var voteImgRootURL = imgVoteURL
	// 投票编号
	var vote_id = _getPar("vote_id");
	// 投票类型
	var vote_type = 0;
	var voteText = new Array("图片", "音频", "视频");
	// 投票项目状态
	var voteItemStatus = new Array("离线", "在线");
	// 投票项目操作按钮
	var voteItemOpButtonName = new Array("发布", "撤回");
	// 元激活tab
	var activeTab = "add-tab";
	if('' == vote_id) return;
	
	/**
	 * 新增投票项tab
	 */
	// 翻页之后刷新页面数据
	var pageVoteItem = _pageBar([], ".items", "#item-left", "#item-right", function(ids) {
		$("#items-list").empty();
		_callAjax({
			"cmd":"getAllVoteItemsByIds",
			"ids":ids.join("|"),
			"vote_id":vote_id
		}, function(d) {
			if(null != d.data) {
				updatePage(d.data);
			}
		});
	});
	
	// 页面初始化  获取投票项目编号
	initVoteItemList = function() {
		_callAjax({
			"cmd":"getVoteItemsIds",
			"vote_id":vote_id,
		}, function(d){
			pageVoteItem.renew(d.data, 1);
		});
	}
	initVoteItemList();
	
	// 页面初始化  获取投票标题
	getVoteTitle = function() {
		_callAjax({
			"cmd":"getVoteTitleByVoteId",
			"vote_id":vote_id,
		}, function(d){
			if (d.success) {
				$("#vote_subtitle").text(d.data.title);
				vote_type= d.data.type;
				// 根据投票类型的不用修改页面表格的列名
				$("#type").text(voteText[d.data.type]);
				// 音频投票
				if(1 == vote_type) {
					$("#row-thumb").hide();
					var img_html = '<div class="form-label col-md-2">' + 
									'<label for="">' + 
									'<span style="color:red">* </span>' + voteText[d.data.type] + ':' + 
									'</label>' + '</div>' + 
									'<div class="form-input col-md-10">' +
									'<div class="col-md-12">' + 
									'<input type="file" id="new-img" name="cadidate-img" accept="audio/mp3"/>' + 
									'</div>' + '</div>';
					$("#row-img").html(img_html);
				// 视频投票
				} else if(2 == vote_type) {
					$("#row-img label").html('视频(仅限MP4): <span class="required">* </span>');
					$("#new-img").attr("accept", "audio/mp4, video/mp4");
				// 文字投票
				} else if(3 == vote_type) {
					$("#row-img").hide();
					$("#row-thumb").hide();
					$("#row-name-label").html('<label for="">文章作者: <span class="required">* </span></label>');
					var work_html = '<div class="form-label col-md-2">' + 
									'<label for="">文章内容: <span style="color:red">* </span></label></div>' + 
									'<div class="form-input col-md-10">' + 
									'<div class="col-md-12">' + 
									'<textarea name="" id="new-work" class="large-textarea"></textarea>' + 
									'</div>' + '</div>';
					$("#row-work").html(work_html);
				}
			}
		});
	}
	getVoteTitle();
	
	// 更新投票项目状态
	updateVoteItemStatus = function(id, statusTo) {
		_callAjax({
			"cmd": "updateVoteItemStatus",
			"id": id,
			"vote_id": vote_id,
			"statusTo": statusTo
		}, function(d){
			if (!d.success) return _toast.show(d.errMsg);
			// 非文字投票
			if(3 != vote_type) {
				var index = 0;
			} else {
				var index = 1;
			}
			// 修改页面按钮和样式
			var obj = $('tr[data-id="'+ id +'"]').find("a").eq(index);
			$('tr[data-id="'+ id +'"] td:eq(3)').text(voteItemStatus[statusTo]);
			$('tr[data-id="'+ id +'"]').attr("data-status", statusTo);
			if(0 == statusTo) {
				var opButton = '<span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-ok"></i>发布</span>';
				obj.removeClass("bg-red");
				obj.addClass("bg-blue");
				obj.empty();
				obj.append(opButton);
			} else {
				var opButton = '<span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-remove"></i>撤回</span>';
				obj.removeClass("bg-blue");
				obj.addClass("bg-red");
				obj.empty();
				obj.append(opButton);
			}
		})
	}
	
	// 更新投票管理页面信息
	updatePage = function(items) {
		// 填充页面数据
		items.forEach(function(r) {
			// 非文字投票
			if(3 != vote_type) {
				var index = 0;
				var str = '<tr data-id="' + r.id + '" data-status=' + r.status + '><td>' + r.id + '</td>' +
					'<td class="font-bold text-left">' + r.name + '</td>' + 
					'<td>' + r.work + '</td>' + 
					'<td>' + voteItemStatus[r.status] + '</td>' + 
					'<td class="item-list-img" data-dir="' + voteImgRootURL + '/vote_' + vote_id + '/'+ r.img +'">' + r.img+ '</td>' + 
					'<td>' + 
					'<a class="btn medium bg-red" href="javascript:">' + 
					'<span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-remove"></i>撤回</span>' + 
					'</a></td></tr>';
			// 文字投票
			} else {
				if(r.work.length > 20) {
					var detail = r.work.substring(0, 20) + "......";
				} else {
					var detail = r.work;
				}
				var index = 1;
				var str = '<tr data-id="' + r.id + '" data-status=' + r.status + '><td>' + r.id + '</td>' +
					'<td class="font-bold text-left">' + r.name + '</td>' + 
					'<td><a href="javascript:" class="black-modal-80">' + detail + '</a></td>' + 
					'<td>' + voteItemStatus[r.status] + '</td>' + 
					'<td class="item-list-img" data-dir="' + voteImgRootURL + '/vote_' + vote_id + '/'+ r.img +'">' + r.img+ '</td>' + 
					'<td>' + 
					'<a class="btn medium bg-red" href="javascript:">' + 
					'<span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-remove"></i>撤回</span>' + 
					'</a></td></tr>';
			}
			
			var e = $(str).appendTo("#items-list");
			// 投票项目离线状态 修改操作按钮和页面样式
			if(0 == r.status) {
				var opButton = '<span class="button-content voteConfig"><i class="glyph-icon font-size-11 icon-ok"></i>发布</span>';
				e.find("a").eq(index).removeClass("bg-red");
				e.find("a").eq(index).addClass("bg-blue");
				e.find("a").eq(index).empty();
				e.find("a").eq(index).append(opButton);
			}
			
			// 发布/撤回按钮按下时
			e.find("a").eq(index).click(function() {
				updateVoteItemStatus(r.id, e.attr("data-status") ^ 1);
			})
			
			// 文字投票情况下 点击展开全部文章内容
			if(3 == vote_type) {
				e.find("a").eq(0).click(function() {
					$("#black-modal-80").attr("title", r.name);
					$(".pad10A").html(r.work);
				})
			}
		});
		
		// 图片/音频预览
		$('.item-list-img').hover(function(){
			// 图片投票
			if(0 == vote_type) {
				$('<div class="item-list-img-hover"><img width="100%" src=' + $(this).attr('data-dir') + ' /></div>').appendTo($(this));
			// 音频投票
			} else if(1 == vote_type) {
				$('<div class="audio-hover"><audio src="' + $(this).attr('data-dir')	 + '" display="none" autoplay="autoplay"></audio></div>').appendTo($(this));
			// 视频投票
			} else if(2 == vote_type) {
				$('<div class="video-hover"><video src="' + $(this).attr('data-dir')	 + '"autoplay="autoplay" width="320"></video></div>').appendTo($(this));
			}
		},function(){
			$('.item-list-img-hover').remove();
			$('.audio-hover').remove();
			$('.video-hover').remove();
		})
	};
	
	// 表单内容检测
	checkFormDataValid = function() {
		// 基础数据检测
		var name = $("#new-name").val().replace(/\s/g, "");
		var work = $("#new-work").val().replace(/\s/g, "");
		var img = $("#new-img").val().replace(/\s/g, "");
		var thumb = $("#new-thumb").val().replace(/\s/g, "");
		if (name == '') return "请填写投票项目名";
//		if (img == '') return "请选择图片";
//		if (thumb == '') return "请选择缩略图";
		// 图片投票时  额外检测缩略图  检测图片格式
		if(0 == vote_type) {
			if (img == '') return "请选择图片";
			if (thumb == '') return "请选择缩略图";
			if (!_checkImgType(img) || !_checkImgType(thumb)) 
				return "图片格式只能是.gif,jpeg,jpg,png中的一种";
		// 音频投票时  检测音频格式
		} else if(1 == vote_type) {
			if (img == '') return "请选择图片";
			if (!_checkAudioType(img))
				return "音频格式只能是.mp3";
		// 视频投票时 检测视频和缩略图格式
		} else if(2 == vote_type) {
			if (img == '') return "请选择视频";
			if (thumb == '') return "请选择缩略图";
			if (!_checkVideoType(img)) return "视频格式只能是.mp4";
			if (!_checkImgType(thumb)) return "缩略图格式只能是.gif,jpeg,jpg,png中的一种";
		// 文字投票
		} else if(3 == vote_type) {
			if(work == '') return "请填写文章内容"
		}
		return null;
	}
	
	// 新增投票项目
	$("#append-item").click(function() {
		// 表单内容检测
		var checkValid = checkFormDataValid();
		if(null != checkValid) return _toast.show(checkValid);
		// 获取表单数据
		var name = $("#new-name").val().replace(/\s/g, "");
		var work = $.trim($("#new-work").val());
		var img = $("#new-img").val().replace(/\s/g, "");
		var thumb = $("#new-thumb").val().replace(/\s/g, "");
		if(3 == vote_type) {
			work = $("#new-work").val().replace(/\n/g, "<br>");
		}
		if (work == '') work = "  ";
		
		// 上传图片的表单
		var uploadForm = jq("#new-item");
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
			"beforeSend": function() {
				$('#newUploadProgress').show();
				$('#status').empty();
				var percentVal = '0%';
				$('.bar').width(percentVal)
				$('.percent').html(percentVal);
			},
			"uploadProgress": function(event, position, total, percentComplete) {
				var percentVal = percentComplete + '%';
				$('.bar').width(percentVal)
				$('.percent').html(percentVal);
			},
			"success": function(d) {
				if(!d.success) {
					return _toast.show("上传图片失败，请重试");
				}
				var percentVal = '100%';
				$('.bar').width(percentVal)
				$('.percent').html(percentVal);
				var filenames = d.data;
				// 新增投票项目ajax
				_callAjax({
					"cmd":"newVoteItem",
					"vote_id":vote_id,
					"voteType":vote_type,
					"name":name,
					"work":work,
					"img":filenames[0],
					"thumb":filenames[1]
				}, function(d){
					if (d.success) {
						setTimeout(function() {$('#newUploadProgress').hide();}, 2000);
						_toast.show("新增投票项目成功");
						// 清空表单
						uploadForm.clearForm();
						// 刷新页面数据
						initVoteItemList();
					}
				});
			}
		});
	});
	
	/**
	 * 修改投票项tab
	 */
	// 得到投票项列表
	getVoteItemNameList = function() {
		_callAjax({
			"cmd": "getVoteItemNameList",
			"vote_id": vote_id,
		}, function(d) {
			if(d.success) {
				// 加载选择列表
				$("#select-vote-item-name").empty();
				$('<option value="">选择投票项...</option>').appendTo("#select-vote-item-name");
				d.data.forEach(function(r) {
					var str = '<option value=' + r.id + '>' + r.id + ' ' + r.name + '</option>';
					$(str).appendTo("#select-vote-item-name");
				})
			}
		})
	}
	// 得到投票项信息
	getVoteItemInfo = function(id) {
		_callAjax({
			"cmd": "getVoteItemInfoById",
			"id": id,
			"vote_id": vote_id,
		}, function(d) {
			if(d.success) {
				$("#modify-name").val(d.data.name);
				$("#modify-name").parent().attr("data-original", d.data.name);
				$("#modify-work").val(d.data.work);
				$("#modify-work").parent().attr("data-original", d.data.work);
			}
		})
	}
	// 根据投票分类修正页面
	modifyFormByVotetype = function() {
		// 1 音频投票
		if(1 == vote_type) {
			$("#row2-thumb").hide();
			var img_html = '<div class="form-label col-md-2">' + 
							'<label for="">' + voteText[vote_type] + ':' + '</label>' + 
							'</div>' + 
							'<div class="form-input col-md-10">' +
							'<div class="col-md-12">' + 
							'<input type="file" id="modify-img" name="cadidate-img" accept="audio/mp3"/>' + 
							'</div>' + '</div>';
			$("#row2-img").html(img_html);
		// 2 视频投票
		} else if(2 == vote_type) {
			$("#row2-img label").html('视频(仅限MP4): ');
			$("#modify-img").attr("accept", "audio/mp4, video/mp4");
		// 3 文字投票
		} else if(3 == vote_type) {
			$("#row2-img").hide();
			$("#row2-thumb").hide();
			$("#row2-name-label").html('<label for="">文章作者: </label>');
			var work_html = '<div class="form-label col-md-2">' + 
							'<label for="">文章内容:</label>' + 
							'</div>' + 
							'<div class="form-input col-md-10">' + 
							'<div class="col-md-12" data-original="">' + 
							'<textarea name="" id="modify-work" class="large-textarea"></textarea>' + 
							'</div>' + '</div>';
			$('#row2-work').html(work_html);
		}
	}
	
	// 修改投票项
	updateVoteItem = function() {
		// 表单内容检测
		var name = $("#modify-name").val().replace(/\s/g, "");
		var work = $.trim($("#modify-work").val());
		var img = $("#modify-img").val().replace(/\s/g, "");
		var thumb = $("#modify-thumb").val().replace(/\s/g, "");
		if(0 == vote_type) {
			if(("" != img && !_checkImgType(img)) || 
				("" != thumb && !_checkImgType(thumb))) {
				return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");
			}
		} else if(1 == vote_type) {
			if("" != img && !_checkAudioType(img)) {
				return _toast.show("音频格式只能是.mp3");
			}
		} else if(2 == vote_type) {
			if("" != img && !_checkVideoType(img)) {
				return _toast.show("视频格式只能是.mp4");
			}
			if("" != thumb && !_checkImgType(thumb)) {
				return _toast.show("音频格式只能是.gif,jpeg,jpg,png中的一种");
			}
		} else if(3 == vote_type) {
			work = $("#modify-work").val().replace(/\n/g, "<br>");
		}
		if (work == '') work = "  ";
		// 上传图片的表单
		var uploadForm = jq("#modify-item");
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
			"beforeSend": function() {
				$('#modifyUploadProgress').show();
				$('#status').empty();
				var percentVal = '0%';
				$('.bar').width(percentVal)
				$('.percent').html(percentVal);
			},
			"uploadProgress": function(event, position, total, percentComplete) {
				var percentVal = percentComplete + '%';
				$('.bar').width(percentVal)
				$('.percent').html(percentVal);
			},
			"success": function(d) {
				if(false == d.success) {
					return _toast.show("上传图片失败，请重试");
				}
				var percentVal = '100%';
				$('.bar').width(percentVal)
				$('.percent').html(percentVal);
				var filenames = d.data;
				if(name == $("#modify-name").parent().attr("data-original")) {
					name = "null";
				}
				if(work == $("#modify-work").parent().attr("data-original")) {
					work = "null";
				}
				// 更新投票项ajax
				_callAjax({
					"cmd":"updateVoteItem",
					"id": $("#select-vote-item-name").val().replace(/\s/g, ""),
					"vote_id":vote_id,
					"voteType":vote_type,
					"name":name,
					"work":work,
					"img":filenames[0],
					"thumb":filenames[1]
				}, function(d){
					_toast.show(d.errMsg);
					if (d.success) {
						setTimeout(function() {$('#modifyUploadProgress').hide();}, 2000);
						// 清空表单
						uploadForm.clearForm();
						// 初始化投票项选择框数据
						getVoteItemNameList();
						// 禁用修改并上传按钮
						$("#update-item-button").addClass("disabled");
					}
				});
			}
		});
	}
	
	// 投票项列表选择时
	$("#select-vote-item-name").change(function() {
		// 选择投票项
		if("" != $(this).val().replace(/\s/g, "")) {
			// 按钮可用
			$("#update-item-button").removeClass("disabled");
			// 得到投票项信息
			getVoteItemInfo($(this).val().replace(/\s/g, ""));
		// 未选择投票项
		} else {
			// 清空表单
			jq("#modify-item").clearForm();
			// 按钮不可用
			$("#update-item-button").addClass("disabled");
		}
	})
	
	// 修改投票项目
	$("#update-item").click(function() {
		if(!$(this).parent().hasClass("disabled")) {
			// 上传文件并更新投票项信息
			updateVoteItem();
		}
	})
	
	
	/**
	 * tab切换
	 */
	// tab切换
	$('.tabs ul li').click(function(e) {
		// 切换到不同的tab
		if(activeTab != $(this).attr('data-tabname')) {
			// 激活新增投票项tab
			if("add-tab" == $(this).attr('data-tabname')) {
				// 清空修改投票项tab中表单数据
				jq("#modify-item").clearForm();
				// 初始化新增投票项tab中数据
				initVoteItemList();
			// 激活修改投票项tab
			} else if("modify-tab" == $(this).attr('data-tabname')) {
				// 清空新增投票项tab中表单数据
				jq("#new-item").clearForm();
				// 清空新增投票项tab中表格数据
				$("#items-list").empty();
				// 根据投票分类修正页面
				modifyFormByVotetype();
				// 得到投票项列表
				getVoteItemNameList();
				// 禁用修改并上传按钮
				$("#update-item-button").addClass("disabled");
			}
			// 更改激活tab为当前tab
			activeTab = $(this).attr('data-tabname');
		}
	})
});