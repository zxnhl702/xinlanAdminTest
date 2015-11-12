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
		
		//显示大图
		$('.item-list-img').hover(function(){
			$('<div class="item-list-img-hover"><img width="100%" src=' + $(this).attr('data-dir') + ' /></div>').appendTo($(this))
		},function(){
			$('.item-list-img-hover').remove();
		})
	};
	
	// 新增投票项目
	$("#append-item").click(function() {
		// 表单内容检测
		var name = $("#new-name").val().replace(/\s/g, "");
		var work = $("#new-work").val().replace(/\s/g, "");
		var img = $("#new-img").val().replace(/\s/g, "");
		var thumb = $("#new-thumb").val().replace(/\s/g, "");
		if (name == '') return _toast.show("请填写用户名");
		if (img == '') return _toast.show("请选择图片");
		if (thumb == '') return _toast.show("请选择缩略图");
		if (!_checkImgType(img) || !_checkImgType(thumb)) 
			return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");
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