$(function() {
	var host = window.location.host
	// 后台ajax地址
	var ajaxURL = "http://" + host + "/xinlan/";
	var _callAjax = _genCallAjax(ajaxURL);

	_set("xinlan_privilege", '');

	$("#login-button").click(function(e) {
		e.preventDefault();
		var username = $("#username").val().replace(/\s/g, ""),
		password = $("#password").val().replace(/\s/g, "");
		// alert(username + '-->' + password);
		if (username == '' || password == '') return _toast.show("请填写用户信息");
		// alert("rth");
		_callAjax({
			"cmd":"login",
			"username":username,
			"password":password
		}, function(d) {
			_toast.show(d.errMsg);
			if (d.data == 'none' || d.data == null) return;
			_set("xinlan_privilege", d.data.privilege);
			_set("xinlan_id", d.data.id);
			window.location.href = "http://"+host+"/index.html?user_id="+d.data.id+"&privilege="+d.data.privilege;
		});
	});
});
