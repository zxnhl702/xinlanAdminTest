/**
 * 投票管理页面的javascript
 */
$(function() {
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
	if('' == vote_id) return;
	
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
	
	// 更新投票管理页面信息
	var updatePage = function(items) {
		// 填充页面数据
		items.forEach(function(r) {
			var str = '<tr><td>' + r.id + '</td>' +
						'<td class="font-bold text-left">' + r.name + '</td>' + 
						'<td>' + r.work + '</td>' + 
						'<td class="item-list-img" data-dir="' + voteImgRootURL + '/vote_' + vote_id + '/'+ r.img +'">' + r.img+ '</td>' + 
						'<td>' + 
						'<a class="btn medium bg-blue" href="javascript:">' + 
						'<span class="button-content"><i class="glyph-icon font-size-11 icon-remove"></i>删除</span>' + 
						'</a></td></tr>';
			var e = $(str).appendTo("#items-list");
			
			// 删除本条数据
			e.find("a:has(.icon-remove)").click(function() {
				_callAjax({
					"cmd":"removeVoteItemLogicallyById",
					"id":r.id,
					"vote_id":vote_id
				}, function(d){
					if (!d.success) return _toast.show("删除投票项目失败");
					var pageIds = pageVoteItem.pages();
					pageIds.splice(pageIds.indexOf(r.id),1);
					pageVoteItem.renew(pageIds);
				})
			});
		});
		
		// 图片/音频预览
		$('.item-list-img').hover(function(){
			// 图片投票
			if(0 == vote_type) {
				$('<div class="item-list-img-hover"><img width="100%" src=' + $(this).attr('data-dir') + ' /></div>').appendTo($(this));
			// 音频投票
			} else if(1 == vote_type) {
				$('<div class="item-list-img-hover"><audio src="' + $(this).attr('data-dir')	 + '" display="none" autoplay="autoplay"></audio>').appendTo($(this));
			}
		},function(){
			$('.item-list-img-hover').remove();
		})
	};
	
	// 表单内容检测
	var checkFormDataValid = function() {
		// 基础数据检测
		var name = $("#new-name").val().replace(/\s/g, "");
		var work = $("#new-work").val().replace(/\s/g, "");
		var img = $("#new-img").val().replace(/\s/g, "");
		if (name == '') return "请填写用户名";
		if (img == '') return "请选择图片";
		if (thumb == '') return "请选择缩略图";
		// 图片投票时  额外检测缩略图  检测图片格式
		if(0 == vote_type) {
			var thumb = $("#new-thumb").val().replace(/\s/g, "");
			if (thumb == '') return "请选择缩略图";
			if (!_checkImgType(img) || !_checkImgType(thumb)) 
				return "图片格式只能是.gif,jpeg,jpg,png中的一种";
		// 音频投票时  检测音频格式
		} else if(1 == vote_type) {
			if (!_checkAudioType(img))
				return "音频格式只能是.mp3";
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
		var work = $("#new-work").val().replace(/\s/g, "");
		var img = $("#new-img").val().replace(/\s/g, "");
		var thumb = $("#new-thumb").val().replace(/\s/g, "");
		if (work == '') work = "  ";
		
		// 上传图片的表单
		var uploadForm = jq("#new-item");
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
						_toast.show("新增投票项目成功");
						// 清空表单
						uploadForm.clearForm();
						// 刷新页面数据
						_callAjax({
							"cmd":"getVoteItemsIds",
							"vote_id":vote_id
						}, function(d){
							pageVoteItem.renew(d.data, 1);
						});
					}
				});
			}
		});
	});
	
	// 页面初始化  获取投票标题
	_callAjax({
		"cmd":"getVoteTitleByVoteId",
		"vote_id":vote_id,
	}, function(d){
		if (d.success) {
			$("#vote_subtitle").text(d.data.title);
			vote_type= d.data.type;
			// 根据投票类型的不用修改页面表格的列名
			$("#type").text(voteText[d.data.type]);
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
			}
		}
	});
	
	// 页面初始化  获取投票项目编号
	_callAjax({
		"cmd":"getVoteItemsIds",
		"vote_id":vote_id,
	}, function(d){
		pageVoteItem.renew(d.data, 1);
	});
});