var _set = function(k,v) { window.localStorage.setItem(k,v); }
var _get = function(k) { return window.localStorage.getItem(k); }
var _tell = function(d) { console.log(JSON.stringify(d)); }
//var spinner = new Spinner(opts);

var _loading = function() {
	$('<section id="mask" style="position:fixed; top:0; left:0; height:100%; width:100%; z-index:10000"></section>').appendTo("body");
	//spinner.spin(document.getElementById("mask"));
	/*
	$(".load").animate({marginTop:"0px",opacity:"1"},400,'linear');
	*/
}

var _stopLoading = function() {
	//spinner.spin();
	$("#mask").remove();
	/*
	setTimeout(function(){
		$(".load").animate({marginTop:"-20px",opacity:"0"},500,'linear');
	},1000);
	*/
}

var _genPostAjax = function(url) {
	return function(data, cb) {
		if (!("noloading" in data)) _loading();
		cb = cb?cb:function(){};
		$.ajax({
			type:"POST",
			async:true,
			url:url,
			dataType:"json",
			jsonp:"callback",
			data:data,
			contentType:"multipart/form-data; charset=UTF-8",
			success: function(d) {
				_tell(d);
				cb(d);
				_stopLoading();
			},
			error: function(e) {
				// console.log(JSON.stringify(e));
				// _popup("服务器连接失败，请重试！");
				_stopLoading();
			}
		});
	}
};

var _genCallAjax = function(url) {
	return function(data, cb) {
		if (!("noloading" in data)) _loading();
		cb = cb?cb:function(){};
		$.ajax({
			type:"GET",
			async:true,
			url:url,
			dataType:"jsonp",
			jsonp:"callback",
			data:$.extend(data, {token:'Jh2044695'}),
			contentType:"multipart/form-data; charset=UTF-8",
			success: function(d) {
				_tell(d);
				cb(d);
				_stopLoading();
			},
			error: function(e) {
				// console.log(JSON.stringify(e));
				// _popup("服务器连接失败，请重试！");
				_stopLoading();
			}
		});
	}
};

var _popup = function(txt, successCallback, cancelCallback) {
	successCallback = successCallback?successCallback:function(){};
	var html = '<section id="popup" class="popup pct100" style="position: fixed;height: 100%;background: rgba(0,0,0,0.7);z-index:1001;left: 0;top:0"><section class="popupWin bgf5 pct70 ovh" style="position:fixed;left:50%;margin-left:-35%;top:10%;border-radius: 5px;-webkit-border-radius: 5px;box-shadow: 0px 0px 5px rgba(0,0,0,0.2);"><h5 class="pt10 pb10 tc f16" style="color: #2c6d7a;">提示</h5><article class="pl15 pr15 f12 mb20 g6">'+txt+'</article>	<section class="clearfix">';
	if (!cancelCallback) {
		html += '<a id="popupDone" class="r db white tc pct100 pt10 pb10" style="background: #2c6d7a;transition: all .2s ease;-webkit-transition: all .2s ease;border-radius:0px 0px 5px 0px ;-webkit-border-radius:0px 0px 5px 0px;">确定</a></section></section></section>';
	} else {
		html += '<a class="l db white tc pct50 pt10 pb10 bre ml-1" id="popupCancel" style="background: #2c6d7a;transition: all .2s ease;-webkit-transition: all .2s ease;border-radius:0px 0px 0px 5px;-webkit-border-radius:0px 0px 0px 5px;">取消</a><a id="popupDone" class="r db white tc pct50 pt10 pb10" style="background: #2c6d7a;transition: all .2s ease;-webkit-transition: all .2s ease;border-radius:0px 0px 5px 0px ;-webkit-border-radius:0px 0px 5px 0px;">确定</a></section></section></section>';
	}
	var e = $(html).appendTo("body");
	$("#popupDone").click(function() {
		successCallback();
		e.remove();
	});
	$("#popupCancel").click(function() {
		cancelCallback();
		e.remove();
	});
};

var _openUrl = function(url) {
	window.location.href = url+"?_ddtarget=push";
}

var _getDev = function() {
	var dvc = navigator.userAgent.toLowerCase();
	if (/iphone|ipod|ipad/gi.test(dvc)) {
		return 'iOS';
	} else if (/android/gi.test(dvc)) {
		return 'Android';
	} else {
		return 'Unkown device';
	}
}

var _callApi = function(cmd) {
	dvc = _getDev();
	if (dvc == 'iOS') {
		window.location.hash = '';
		window.location.hash = '#func='+cmd;
	} else if (dvc == 'Android') {
		window.android[cmd]();
	}
}

var _share = function(params) {
	dvc = _getDev();
	if (dvc == 'iOS') {
		var str = '';
		$.each(params, function(k, v){
			str += ('&'+k+'='+encodeURI(v));
		});
		window.location.hash = '';
		window.location.hash = '#func=sharePlatsAction'+str;
	} else if (dvc == 'Android') {
		window.android.sharePlatsAction(params.content, encodeURI(params.content_url), params.pic);
	}
}

var _goBack = function() {
	_callApi("goBack");
}

var _timing = function() {
	setInterval(function() {
		_set("gcd_ifTime", 0);
	}, 60000);
}

var _getToken = function (d, token) {
	for (var k in d) {
		console.log(k);
		if (k == token) {
			return d[k];
		} else if (typeof(d[k]) == 'object'){
			var t = _getToken(d[k], token);
			if (t != '') return t;
		}
	}
	return '';
}

var _getPar = function (par){
	var local_url = document.location.href;
	var get = local_url.indexOf(par +"=");
	if(get == -1){
		return false;
	}
	var get_par = local_url.slice(par.length + get + 1);
	var nextPar = get_par.indexOf("&");
	if(nextPar != -1){
		get_par = get_par.slice(0, nextPar);
	}
	nextPar = get_par.indexOf("#");
	if(nextPar != -1){
		get_par = get_par.slice(0, nextPar);
	}
	return decodeURIComponent(get_par);
}

var _getDistance = function(gps1,gps2) {
	return parseInt((Math.sqrt(Math.pow(gps1[0]-gps2[0],2)+Math.pow(gps1[1]-gps2[1],2))*100)*100)/100;
};

//var _toast = $.hg_toast({
//	"content":"",
//	"appendTo":"body",
//	"delay":1500
//}); // show; confirm

var _now = function() {
	var dt = new Date(),
			y = dt.getFullYear(),
			m = dt.getMonth()+1,
			d = dt.getDate(),
			time = dt.toLocaleTimeString();

	return y+"-"+m+"-"+d+" "+time;
};

var _howLongAgo= function(d) {
	var span = (new Date()).getTime() - Date.parse(d);
	if (span < 3600*1000) {
		return parseInt(span/60000)+"分钟前";
	} else if (span < 86400 * 1000) {
		return parseInt(span/3600000)+"小时前";
	} else {
		return parseInt(span/3600000/24)+"天前";
	}
}

var _at = function(arr, id) {
	if (id < 0) id = arr.length+id;
	return arr[id];
}

var _submitInfo = function(submit_func) {
	var str = '<section class="tips_win pct100"> <div class="info_submit bg_white pct80 tc pt10 pb10 g6 f16 abs"> <header class="bbd pb10">信息提交</header> <div class="info_form"> <input id="tips_win_phone" type="tel" maxlength="11" placeholder="请输入您的手机号码" class="f14 pct100 bbc mt20 mb10 pb5"/> <input id="tips_win_name" type="text" placeholder="请输入您姓名" class="f14 pct100 bbc mt5 mb10 pb5"/> <span class="btn bg_red pct100 p0 pt10 pb10 mt10 submit" id="tips_win_submit_score">提交</span> <p class="mt5 tl g6 f12">活动将以您提交的信息为准,请正确填写！</p> </div> </div> </section>';
	$(str).appendTo("body");
	$(".tips_win_submit_score").click(function() {
		var phone = $("tips_win_phone").val().replace(/\s/g, '');
		var name = $("tips_win_name").val().replace(/\s/g, '');
		if (phone == '' || name == '') return _toast.show("请填写完整信息");
		submit_func(phone, name);
		$(".tips_win").remove();
	});
}

var _wxzs = function(kv, only_user) {
	if (!("callback" in kv) || !("_callAjax" in kv)) {
		alert("key error");
		return
	};
	var cb = kv["callback"],
			_ca = kv["_callAjax"];

	if (only_user) {
		$.hg_h5app({
			"needUserInfo": function(d)	{
				cb(d, "userid", _ca);
			}
		});
		return;
	}

	var os = _getDev();
	if (os == 'iOS') {
		$.hg_h5app({
			"needUserInfo": function(d)	{
				cb(d, "userid", _ca);
			}
		});
	} else {
		$.hg_h5app({
			"needSystemInfo": function(d)	{
				cb(d, "device_token", _ca);
			}
		});
	}
}

var _weixin = function(kv) {
	if (!("auth" in kv) || !("_callAjax" in kv)) return;
	var weixin = _getPar("weixin");
	if (weixin == '') return;

	kv["_callAjax"]({
		"cmd": "auth",
		"device_token": weixin
	}, function(d) {
		if (d.success) kv["auth"](kv["_callAjax"], weixin, d);
	});
}

var _isWeixin = function() {
	var ua = navigator.userAgent.toLowerCase();
	if(ua.match(/MicroMessenger/i)=="micromessenger") {
		return true;
 	} else {
		return false;
	}
}