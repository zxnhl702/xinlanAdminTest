/**
 * 热点修改页面的javascript
 */
$(function() {
	var _callAjax = _genCallAjax(ajaxRootURL);
	// 上传图片ajax的后台地址
	var fileUploadURL = fileUploadHotTopimgURL;
	
	// 填充热点直播信息
	var getHotInfoById = function(id) {
		_callAjax({
			"cmd": "getHotById",
			"id": id
		}, function(d) {
			if(d.success) {
				$("#modify-title").val(d.data.title);
				$("#modify-title").parent().attr("data-original", d.data.title);
				$("#modify-descript").val(d.data.description);
				$("#modify-descript").parent().attr("data-original", d.data.description);
			}
		})
	}
	
	// 更新热点直播信息
	var updateHotInfo = function() {
		// 表单内容检测
		var title = $("#modify-title").val().replace(/\s/g, "");
		var description = $("#modify-descript").val().replace(/\s/g, "");
		var img = $("#modify-img").val().replace(/\s/g, "");
		if("" == title) return _toast.show("热点标题不能为空！");
		if("" == description) return _toast.show("热点描述不能为空！");
		if("" != img && !_checkImgType(img)) {
			return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");
		}
		if(title == $("#modify-title").parent().attr("data-original") &&
			description == $("#modify-descript").parent().attr("data-original") &&
			"" == img) {
			return _toast.show("数据没有改变，不需要更新");
		}
		// 上传图片的表单
		var uploadForm = jq("#modify-hot");
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
				if(!d.success) {
					return _toast.show("上传图片失败，请重试");
				}
				var filenames = d.data;
				var id = $("#select-hot-name").val().replace(/\s/g, "");
				if(title == $("#modify-title").parent().attr("data-original")) {
					title = "null";
				}
				if(description == $("#modify-descript").parent().attr("data-original")) {
					description = "null";
				}
				// 更新热点直播信息
				_callAjax({
					"cmd": "updateHotById",
					"id": id,
					"title": title,
					"description": description,
					"topimg": filenames[0]
				}, function(d) {
					_toast.show(d.errMsg);
					if(d.success) {
						// 清空表单
						uploadForm.clearForm();
						// 初始化热点直播选择框数据
						getHotInfoList();
						// 禁用修改并上传按钮
						$("#update-item-button").addClass("disabled");
					}
				})
			}
		});
	}
	
	// 选择热点改变时
	$("#select-hot-name").change(function() {
		// 选择投票项
		if("" != $(this).val().replace(/\s/g, "")) {
			// 按钮可用
			$("#modify-hot-a").removeClass("disabled");
			// 加载对应热点直播数据到表单
			getHotInfoById($(this).val().replace(/\s/g, ""));
		// 未选择投票项
		} else {
			// 清空表单
			jq("#modify-hot").clearForm();
			// 按钮不可用
			$("#modify-hot-a").addClass("disabled");
		}
	})
	
	// 更新按钮按下时
	$("#update-hot").click(function() {
		if(!$("#modify-hot-a").hasClass("disabled")) {
			// 上传文件并更新热点直播信息
			updateHotInfo();
		}
	})
	
	// 初始化热点下拉列表
	var getHotInfoList = function() {
		_callAjax({
			"cmd": "getHotsInfo",
		}, function(d) {
			// 按钮不可用
			$("#modify-hot-a").addClass("disabled");
			if(d.success) {
				// 加载选择列表
				$("#select-hot-name").empty();
				$('<option value="" selected="selected">请选择...</option>').appendTo("#select-hot-name");
				d.data.forEach(function(r) {
					var str = '<option value='+r.id+'>'+r.id+' '+r.title+'</option>';
					$(str).appendTo("#select-hot-name");
				})
			}
		});
	}
	getHotInfoList();
})