$(function() {
	var _callAjax = _genCallAjax("http://develop.wifizs.cn:11002/xinlan/"),
			user_id = _getPar("user_id"),
			privilege = _getPar("privilege"),
			hot_id = _getPar("hot_id"),
			event_id = _getPar("event_id");

	if (event_id == "") {
		_callAjax({
			"cmd": "getHotsInfo"
		}, function(d) {
			d.data.forEach(function(r) {
				$('<option data-hotid='+r.id+'>'+r.title+'</option>').appendTo(".select-content > select");
			});
		});
	} else {
		_callAjax({
			"cmd": "getEventById",
			"id": event_id
		}, function(d) {
			if (!d.success) return _toast.show(d.errMsg);
			$(".select-content").hide();
			$("#event-title").val(d.data.title);
			$("#editor1").html(d.data.content);
		});
	}

	_upload({
		"fileElement": $("#file-sel"),
		"fileSelectCallback": function(filename) {
			$("#file-display").html(_at(filename.split("\\"), -1));
		},
		"submitElement": $("#file-upload"),
		"uploadCallback": function(d) {
			_tell(d.errMsg);
			_toast.show(d.errMsg);
			var pos = $("#editor1")[0].selectionStart,
					content = $("#editor1").val(),
					former = content.substring(0, pos),
					later = content.substring(pos, content.length);
			if (d.success) $("#editor1").val(former+"\n<img src='img/"+d.data+"'/>\n"+later);
		},
		"uploadUrl": "http://develop.wifizs.cn:11002/xupload"
	});

	$("#publish-btn").click(function() {
		var title = $("#event-title").val().replace(/\s/g,'');
		if (title == '') return _toast.show("请输入标题");
		content = $("#editor1").val().split("\n").join("</bt>");
		if (event_id == "") {
			var selectedOption = $(".select-content > select").find("option:selected");
			if (selectedOption.length == 0) return _toast.show("没有热点选项");
			hot_id = selectedOption.attr("data-hotid");
			_callAjax({
				"cmd": "newEvent",
				"title": title,
				"status": "",
				"content": content,
				"hot_id": hot_id,
				"userid": user_id
			}, function(d) {
					_toast.show(d.errMsg, function() {
						if (d.success) location.href = "/hotNews-manage.html?hot_id="+hot_id+"&user_id="+user_id+"&privilege="+privilege;
					});
			});
		} else {
			_callAjax({
				"cmd": "updateEvent",
				"id": event_id,
				"title": title,
				"status": "",
				"content": content
			}, function(d) {
				_toast.show(d.errMsg, function() {
					if (d.success) location.href = "/hotNews-manage.html?hot_id="+hot_id+"&user_id="+user_id+"&privilege="+privilege;
				});
			});
		}

	});
});
