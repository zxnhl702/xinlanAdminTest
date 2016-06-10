// ueditor在线编辑器 读取配置文件、上传文件的基准路径（带模块名称——“”部分）
var ueditorURL = UeditorURL + "/hots";
$(function() {
	var _callAjax = _genCallAjax(ajaxRootURL);
	var ue = UE.getEditor('editor');
	
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	var hot_id = _getPar("hot_id");
	var event_id = _getPar("event_id");
	
	var ifMobile = $(window).width() < 640;
	if (ifMobile) {
		var url = "/mobile/new/index.html?user_id="+user_id+"&privilege="+privilege; // MOBILE UPLOAD
		if (hot_id != '') url += "&hot_id="+hot_id;
		if (event_id != '') url += "&event_id="+event_id;
		location.href = url;
	}

	var updateEvent = function(e, ifNew) {
		if (!ifNew) {
			$("#hot-banner").hide();
			$("#hot-options").hide();
		}

		$("#event-title").val(e.title);
		$("#status").val(e["status"]);
		// $("#editor1").html(e.content);
		if (!ifMobile) {
			ue.ready(function() {
				ue.setContent(e.content);
			});
//			CKEDITOR.instances.editor1.setData(e.content);
		} else {
			$("#event-content-wrapper").after('<div class="form-label col-md-2 bottom-margin clearfix" id="attachment-btns-wrapper"> <a class="btn medium primary-bg" style=" float: left; " id="file-sel-btn"><span class="button-content">文件</span></a><div style=" float: left; margin: 0px 10px; " id="file-sel-show"></div><a class="btn medium primary-bg" id="upload-btn"><span class="button-content">上传</span></a> </div>');		
			$("#editor1").html(e.content);

			_upload({
				"fileElement": $("#file-sel-btn"),
				"fileSelectCallback": function(fn) {
					$("#file-sel-show").html(_at(fn.split('\\'), -1));
				},
				"submitElement": $("#upload-btn"),
				"uploadCallback": function(d) {
					// d = JSON.parse(d);
					_tell(d.errMsg);
					_toast.show(d.errMsg);
					var pos = $("#editor1")[0].selectionStart,
							content = $("#editor1").val(),
							former = content.substring(0, pos),
							later = content.substring(pos, content.length);
					if (d.success) $("#editor1").val(former+"\n<img src='img/"+d.data+"'/>\n"+later);
				},
				"uploadUrl": "/xupload"
			});
		}
	};

	// var event_id = _getPar("event_id");
	if (event_id == '') {
		_callAjax({
			"cmd": "getHotsInfo",
		}, function(d) {
			d.data.forEach(function(r) {
				var str = '<option data-hotid='+r.id+'>'+r.title+'</option>';
				$(str).appendTo("#hots");
			});
			if (d.success) updateEvent(d.data[0], true);
		});
	} else {
		_callAjax({
			"cmd":"getEventsByIds",
			"ids": event_id
		}, function(d){
			if (d.success) updateEvent(d.data[0], false);
		});
	};

	$("#publish-event").click(function() {
		var title = $("#event-title").val().replace(/\s/g, ""),
				// sts = $("#status").val().replace(/\s/g, ""),
				sts = "";
		if (!ifMobile) {
//			var content = CKEDITOR.instances.editor1.getData();
			var content = ue.getContent();
		} else {
			var content = $("#editor1").val();
		}

		if (ifMobile && event_id == '') {
			content = content.split("\n").join('</br>');
		}

		if (title == '') return _toast.show("请输入标题");
		if (event_id == '') {
			var hotOption = $("#hots").find("option:selected");
			if (!hotOption) return _toast.show("请选择热点");
			var hot_id = hotOption.attr("data-hotid");
			_callAjax({
				"cmd":"newEvent",
				"title":title,
				"status":sts,
				"content":content,
				"hot_id": hot_id,
//				"userid": _get("xinlan_id")
				"userid": user_id
			}, function(d){
				_toast.show(d.errMsg);
				if (d.success) location.href = "hotNews-manage.html?hot_id="+hot_id+
																			"&user_id="+user_id+
																			"&privilege="+privilege;
			});
		} else {
			_callAjax({
				"cmd":"updateEvent",
				"id": event_id,
				"title":title,
				"status": sts,
				"content": content
			}, function(d) {
				_toast.show(d.errMsg, function() {
					if (d.success) _goBack(); 
					// location.href = "hotNews-manage.html";
				});
			});
		}
	});
});
