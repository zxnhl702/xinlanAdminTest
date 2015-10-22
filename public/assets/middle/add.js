$(function() {
	var _callAjax = _genCallAjax("http://127.0.0.1:11006/xinlan/");

	var ifMobile = $(window).width() < 640;

	var updateEvent = function(e, ifNew) {
		if (!ifNew) {
			$("#hot-banner").hide();
			$("#hot-options").hide();
		}

		$("#event-title").val(e.title);
		$("#status").val(e["status"]);
		// $("#editor1").html(e.content);
		if (!ifMobile) {
			CKEDITOR.instances.editor1.setData(e.content);
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
					d = JSON.parse(d);
					_tell(d);
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

	var event_id = _getPar("event_id");
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
			var content = CKEDITOR.instances.editor1.getData();
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
				"userid": _get("xinlan_id")
			}, function(d){
				_toast.show(d.errMsg);
				if (d.success) location.href = "hotNews-manage.html?hot_id="+hot_id;
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
