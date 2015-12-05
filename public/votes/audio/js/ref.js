var _set = function(k,v) { window.localStorage.setItem(k,v); }
var _get = function(k) { return window.localStorage.getItem(k); }
var _tell = function(d) { console.log(JSON.stringify(d)); }
var spinner = new Spinner(opts);

var _loading = function() {
	$('<section id="mask" style="position:fixed; top:0; left:0; height:100%; width:100%; z-index:10000"></section>').appendTo("body");
	spinner.spin(document.getElementById("mask"));
	/*
	$(".load").animate({marginTop:"0px",opacity:"1"},400,'linear'); 
	*/
}

var _stopLoading = function() {
	spinner.spin();
	$("#mask").remove();
	/*
	setTimeout(function(){
		$(".load").animate({marginTop:"-20px",opacity:"0"},500,'linear');
	},1000);
	*/
}

var _genCallAjax = function(url) {
	return function(data, cb) {
		if (!('no-loading' in data)) {
			_loading();
		}
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
		window.android.sharePlatsAction(params.content, params.content_url, params.pic);
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

var _toast = $.hg_toast({
	"content":"",
	"appendTo":"body",
	"delay":1500
}); // show; confirm

// SSP
/*
$('.comment').bind("click", function() {
	alert(location.href);
});
*/
