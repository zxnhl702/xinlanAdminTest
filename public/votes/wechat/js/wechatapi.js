/**
 * 微信js-sdk相关的javascript
 * 
 * 1. 参数说明
 * 1.1 callAjaxURL
 * 		后台服务地址，用来计算验证用参数和拼接分享链接用参数
 * 1.2 cmd
 * 		后台调用的函数入口，包括：
 * 		# getConfig 用于url为http://XXXXX/XX.html?XX=XX
 * 		# getConfig2 用于url为http://XXXXX/XX.html
 * 		# getConfigWithWXName 用于url为http://XXXXX/XX.html?from=XXX&XX=XX 
 * 			其中from参数是活动的微信公众号 传到后台的参数除了url外还需要取url上的参数from转到后台
 * 		此处的url均指不带openid等微信代过来的参数情况下的原始url
 * 1.3 url
 * 		页面传到后台的地址，必须是当前页面完整的地址，否则微信验证通不过
 * 		a.用户微信验证，计算签名
 * 		b.通过url查找auth服务中project表里面的key，和weixin字段（此处是新蓝auth服务专用）
 * 		ps. project表中url字段不能出现重复，以免此处传到后台查找出多个key和weixin，出现错误
 * 1.4 isDebugOn
 * 		是否开启微信自带的调试开关，true时会alert出微信自带的参数
 * 1.5 shareURL
 * 		分享用链接地址，如果填写了分享会根据这个参数，如果没有填写分享链接会根据后台传回的appid和state生成
 * 1.6 shareImg
 * 		分享用图标的地址
 * 1.7 shareTitle
 * 		分享用标题，默认是H5页面的title
 * 1.8 shareDesc
 * 		分享用描述
 */
$(function() {
	// 是否是微信登陆
	var weixinLogin = _isWeixin()||debugMod;
	// 微信登陆的情况下
	if(weixinLogin) {
		// ajax后台URL
		var callAjaxURL = wxAjaxURL;
		// 微信js-sdk参数计算的入口
		var cmd = "getConfig";
		// 页面地址
		var url = window.location.href.split("#")[0];
		// 是否开启微信js-sdk自带的调试
		var isDebugOn = false;
		// 分享用链接
		var shareURL = "";
		// 分享用图标
		var shareImg = imgURL + "/vote_" + _getPar("vote_id") + "/banner.jpg";
		// 分享用标题
		var shareTitle = $("title").text();
		// 分享用描述
		var shareDesc = $("title").text() + " 活动等你来参加！本活动技术支持：新蓝广科。"
		// 加载js文件
		$.getScript('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function() {
			// 微信配置
			var _wechatAjax = _genCallAjax(wxAjaxURL);
			_wechatAjax({
				"cmd": cmd,
				"url": url,
			}, function(d) {
				if(d.success) {
					// 如果分享用链接没有在js文件开头定义，则使用后台传来的参数与常量中的URL模版拼接生成链接
					if ("" == shareURL) {
						// 生成分享用链接
						shareURL = wechatURL.replace("APPID", d.data.appid).replace("STATE", d.data.state);
					} 
					// 通过config接口注入权限验证配置
					wx.config({
						debug: isDebugOn,
						appId: d.data.appid, 
						timestamp: d.data.timestamp, 
						nonceStr: d.data.nonceStr, 
						signature: d.data.signature,
						jsApiList:[
							'checkJsApi',
							'onMenuShareTimeline',
							'onMenuShareAppMessage',
							'onMenuShareQQ',
							'onMenuShareWeibo',
							'onMenuShareQZone',
							'hideOptionMenu',
							'showOptionMenu',
							'hideMenuItems',
							'showMenuItems'
						]
					})
				}
			});
			
			// config信息验证
			// 验证通过时的事件，所有文档中可以调用的api写在这里
			wx.ready(function() {
				// 验证api
				wx.checkJsApi({
					jsApiList:[
						'onMenuShareTimeline',
						'onMenuShareAppMessage',
						'onMenuShareQQ',
						'onMenuShareWeibo',
						'onMenuShareQZone',
						'hideOptionMenu',
						'showOptionMenu',
						'hideMenuItems',
						'showMenuItems'
					],
					success: function(res) {
						//alert("检测通过："  +JSON.stringify(res));
					},
					fail: function(res) {
						//alert("检测失败："  +JSON.stringify(res));
					},
					complete: function(res) {
						//alert("检测结束");
					}
				});
				
				// 监听“分享给朋友”，按钮点击、自定义分享内容及分享结果接口
				wx.onMenuShareAppMessage({
					title: $("title").text(),
					desc: $("title").text() + " 活动等你来参加！本活动技术支持：新蓝广科。",
					link: shareURL,//'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxee6284b0c702c21e&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%3A11010%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=vote11#wechat_redirect',
					imgUrl: shareImg,//'http://develop.zsgd.com:11001/images/xinlanUser/1.jpg',
					trigger: function (res) {
						//alert("点击分享：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					success: function (res) {
						//alert("分享成功：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					cancel: function (res) {
						//alert("取消分享：" +JSON.stringify(res));
						// 用户取消分享后执行的回调函数
					},
					fail:function (res) {
						//alert("分享失败：" +JSON.stringify(res));
					}
				});
				
				// 监听“分享到朋友圈”按钮点击、自定义分享内容及分享结果接口
				wx.onMenuShareTimeline({
					title: $("title").text(),
					desc: $("title").text() + " 活动等你来参加！本活动技术支持：新蓝广科。",
					link: shareURL,//'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxee6284b0c702c21e&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%3A11010%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=vote11#wechat_redirect',
					imgUrl: shareImg,//'http://develop.zsgd.com:11001/images/xinlanUser/1.jpg',
					trigger: function (res) {
						//alert("点击分享：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					success: function (res) {
						//alert("分享成功：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					cancel: function (res) {
						//alert("取消分享：" +JSON.stringify(res));
						// 用户取消分享后执行的回调函数
					},
					fail:function (res) {
						//alert("分享失败：" +JSON.stringify(res));
					}
				});
				
				// 监听“分享到QQ”按钮点击、自定义分享内容及分享结果接口
				wx.onMenuShareQQ({
					title: $("title").text(),
					desc: $("title").text() + " 活动等你来参加！本活动技术支持：新蓝广科。",
					link: shareURL,//'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxee6284b0c702c21e&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%3A11010%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=vote11#wechat_redirect',
					imgUrl: shareImg,//'http://develop.zsgd.com:11001/images/xinlanUser/1.jpg',
					trigger: function (res) {
						//alert("点击分享：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					success: function (res) {
						//alert("分享成功：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					cancel: function (res) {
						//alert("取消分享：" +JSON.stringify(res));
						// 用户取消分享后执行的回调函数
					},
					fail:function (res) {
						//alert("分享失败：" +JSON.stringify(res));
					}
				})
				
				// 监听“分享到微博”按钮点击、自定义分享内容及分享结果接口
				wx.onMenuShareWeibo({
					title: $("title").text(),
					desc: $("title").text() + " 活动等你来参加！本活动技术支持：新蓝广科。",
					link: shareURL,//'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxee6284b0c702c21e&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%3A11010%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=vote11#wechat_redirect',
					imgUrl: shareImg,//'http://develop.zsgd.com:11001/images/xinlanUser/1.jpg',
					trigger: function (res) {
						//alert("点击分享：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					success: function (res) {
						//alert("分享成功：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					cancel: function (res) {
						//alert("取消分享：" +JSON.stringify(res));
						// 用户取消分享后执行的回调函数
					},
					fail:function (res) {
						//alert("分享失败：" +JSON.stringify(res));
					}
				})
				
				// 监听“分享到QQ空间”按钮点击、自定义分享内容及分享结果接口
				wx.onMenuShareQZone({
					title: $("title").text(),
					desc: $("title").text() + " 活动等你来参加！本活动技术支持：新蓝广科。",
					link: shareURL,//'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxee6284b0c702c21e&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%3A11010%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=vote11#wechat_redirect',
					imgUrl: shareImg,//'http://develop.zsgd.com:11001/images/xinlanUser/1.jpg',
					trigger: function (res) {
						//alert("点击分享：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					success: function (res) {
						//alert("分享成功：" +JSON.stringify(res));
						// 用户确认分享后执行的回调函数
					},
					cancel: function (res) {
						//alert("取消分享：" +JSON.stringify(res));
						// 用户取消分享后执行的回调函数
					},
					fail:function (res) {
						//alert("分享失败：" +JSON.stringify(res));
					}
				})
				
				// 批量隐藏菜单项
				wx.hideMenuItems({
					menuList: [
						"menuItem:copyUrl", // 复制链接
						"menuItem:readMode", // 阅读模式
						"menuItem:openWithQQBrowser", // 在QQ浏览器中打开
						"menuItem:openWithSafari", // 在Safari中打开
						"menuItem:share:email" // 邮件
					],
					success: function (res) {
//						alert('已隐藏“阅读模式”，“分享到朋友圈”，“复制链接”等按钮');
					},
					fail: function (res) {
//						alert(JSON.stringify(res));
					}
				})
				
			});
		});
	}
})