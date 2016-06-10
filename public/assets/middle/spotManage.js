$(function() {
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	var _callAjax = _genCallAjax(ajaxRootURL);
	// 上传图片ajax的后台地址
	var fileUploadURL = fileUploadHotTopimgURL;
	var pageHot = _pageBar([], ".hots", "#hot-left", "#hot-right", function(ids) {
		$("#hots-list").empty();
		_callAjax({
			"cmd":"getHotsByIds",
			"ids":ids.join("|")
		}, function(d) {
			updateHots(d.data);
		})
	});

	var updateHots = function(hots) {
		hots.forEach(function(r) {
			var str = '<tr><td>'+r.id+'</td><td class="font-bold text-left">'+r.title+'</td><td> <div class="label bg-orange">+'+r.eventsCount+'</div> </td> <td> <div class="dropdown"> <a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"> <span class="button-content"> <i class="glyph-icon font-size-11 icon-cog"></i> <i class="glyph-icon font-size-11 icon-chevron-down"></i></span> </a> <ul class="dropdown-menu float-right"> <li> <a href="javascript:;" title=""> <i class="glyph-icon icon-edit mrg5R"></i> 查看该热点下的事件 </a> </li> <li class="divider"></li> <li> <a href="javascript:;" class="font-red" title=""> <i class="glyph-icon icon-remove mrg5R"></i> 删除 </a> </li> </ul> </div> </td> </tr>';
			var e = $(str).appendTo("#hots-list");
			e.find("a:has(.icon-edit)").click(function() {
				location.href = "hotNews-manage.html?hot_id="+r.id+
														"&user_id="+user_id+
														"&privilege="+privilege;
			});
			e.find("a:has(.icon-remove)").click(function() {
				_callAjax({
					"cmd":"removeHot",
					"id": r.id
				}, function(d) {
					if (!d.success) return _toast.show("删除热点失败");
					var pageIds = pageHot.pages();
					pageIds.splice(pageIds.indexOf(r.id),1);
					pageHot.renew(pageIds);
				})
			});
		});
	};
	
	$("#append-hot").click(function() {
		var title = $("#new-title").val().replace(/\s/g, "");
		var description = $("#new-descript").val().replace(/\s/g, "");
		var img = $("#new-img").val().replace(/\s/g, "");
		if (title == '') return _toast.show("请填写标题");
		if (description == '') return _toast.show("请填写热点描述");
		if (img == '') return _toast.show("请选择图片");
		if (!_checkImgType(img)) 
			return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");

		// 上传图片的表单
		var uploadForm = jq("#new-hot");
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
				if(!d.success) {
					return _toast.show("上传图片失败，请重试");
				}
				var filenames = d.data;
				// 新增热点项目ajax
				_callAjax({
					"cmd":"newHot",
					"title":title,
					"description":description,
					"topimg": filenames[0]
				}, function(d){
					if (d.success) {
						// 清空表单
						uploadForm.clearForm();
						_callAjax({
							"cmd":"getHotsIds"
						}, function(d){
							pageHot.renew(d.data, 1);
						});
					}
				});
			}
		});
	});

	_callAjax({
		"cmd":"getHotsIds"
	}, function(d){
		pageHot.renew(d.data, 1);
	});
});
