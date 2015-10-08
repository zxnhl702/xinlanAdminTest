$(function() {
	var _callAjax = _genCallAjax("http://127.0.0.1:11006/xinlan/");

	var updateEvent = function(e) {
		$("#hot-banner").hide();
		$("#hot-options").hide();

		$("#event-title").val(e.title);
		$("#status").val(e["status"]);
		// $("#editor1").html(e.content);
		CKEDITOR.instances.editor1.setData(e.content);
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
		});
	} else {
		_callAjax({
			"cmd":"getEventsByIds",
			"ids": event_id
		}, function(d){
			if (d.success) updateEvent(d.data[0]);
		});
	};

	$("#publish-event").click(function() {
		var title = $("#event-title").val().replace(/\s/g, ""),
//				sts = $("#status").val().replace(/\s/g, ""),
				sts="",
				content = CKEDITOR.instances.editor1.getData();
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
				_toast.show(d.errMsg);
				if (d.success) location.href = "hotNews-manage.html";
			});
		}
	});
});
