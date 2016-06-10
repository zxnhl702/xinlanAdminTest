/**
 * 微信js-sdk相关的javascript
 */
$(function() {
	// 是否是微信登陆
	var weixinLogin = _isWeixin()||debugMod;
	// 微信登陆的情况下
	if(weixinLogin) {
		// 分享用链接
		var shareURL = "";
		// 分享用图标
		var shareImg = imgURL + "/vote_" + _getPar("vote_id") + "/banner.jpg";
		// 加载js文件
		$.getScript('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function() {
			// 微信配置
			var _wechatAjax = _genCallAjax(wxAjaxURL);
			_wechatAjax({
				"cmd": "getConfig",
				"url": window.location.href.split("#")[0],
			}, function(d) {
				if(d.success) {
					// 生成分享用链接
					shareURL = wechatURL.replace("APPID", d.data.appid).replace("STATE", d.data.state);
					// 通过config接口注入权限验证配置
					wx.config({
						debug: false,
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
				
				// 隐藏右上角菜单
//				wx.hideOptionMenu();
				
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