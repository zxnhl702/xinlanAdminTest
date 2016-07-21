$(function() {
	var h5_cb = function(d, key, _callAjax) {
		var getUserinfoCb = function(hg_username, hg_img, hg_userid) {
			var hot_id = _getPar("hot_id");
			// 图片存储临时变量
			var tempImg = null;
			var formfile = "imagefile";
			
			// 微信打开 重定向文件上传路径
			if(_isWeixin()) {
				fileUploadHotURL = "http://develop.wifizs.cn/xinlanadmin/upload/hots";
			}
			
			/** 
			 * 压缩图片并显示(通过localResizeIMG插件)
			 * 压缩完毕把图片数据赋值给全局变量 并在img标签中预览
			 * el 待压缩的文件的input控件id
			 * width 图片宽度 图片长度根据width自适应
			 * filename 后端接收的字段名 前台除了在插件的fieldName参数中设置外 还会额外设置到formfile参数中
			 * 			后台根据r.FormValue("formfile")取得filename的值
			 * 			然后根据filename获取文件名
			 */
			resizeImg = function(el, width, filename) {
				lrz($('#' + el).get(0).files[0], {
					"width": width,
					"quality": 1,
					"fieldName": filename
				}).then(function(rst) {
					// 预览图片
					$('.release-img span').css('background-image', 'url('+rst.base64+')').find('i').remove();
					// 图片完整数据赋值给全局变量
					tempImg = rst;
				})
			}
			
			/**
			 * 上传文件
			 * filename 后端接收的字段名 前台除了在插件的fieldName参数中设置外 还会额外设置到formfile参数中
			 * 			后台根据r.FormValue("formfile")取得filename的值
			 * 			然后根据filename获取文件名
			 * cb 上传成功后的回调函数
			 */
			uploadFile = function(filename, cb) {
				var xhr = new XMLHttpRequest();
				xhr.open("post", fileUploadHotURL);
				xhr.addEventListener("load", function(e) {
					var ret = JSON.parse(e.target.responseText);
					cb(ret.data);
				}, false);
				xhr.addEventListener("error", function(e) {
					return _toast.show("文件上传失败，请重试！");
				}, false);
				tempImg.formData.append('formfile', filename);
				xhr.send(tempImg.formData);
			}
			
			// 上传文件之后的回调函数
			// 生成事件内容
			genEventContent = function(filename) {
				var html = "";
				if(null != filename) {
					html += '<p><img alt="" src="'+ hotImgURL + filename +'"></p>';
				}
				if("" != $("#releaseContent").val()) {
					html += '<p>' + $("#releaseContent").val().replace(/\n/g, '<br>') + '</p>';
				}
				console.log(html, "" == html);
				
				sendEvent(html);
			}
			
			// 发送事件
			sendEvent = function(html) {
				_callAjax({
					"cmd": "newEventFromHTML",
					"title": "null",
					"content": html,
					"hot_id": hot_id,
					"userid": hg_userid,
					"username": hg_username,
					"userimg": hg_img
				}, function(d) {
					_toast.show(d.errMsg);
					if(d.success) {
						// 情况临时变量中的图片数据
						tempImg = null;
						// 恢复页面样式
						$('.release-img span').removeAttr('style').html('<i class="iconfont icon-add2"></i>');
						// 恢复输入框
						$("#releaseContent").val("");
						// 返回主页面
						window.history.go(-1);
					}
				})
			}
			
			// 图片选择之后的事件函数
			$('#releaseImg').on('change', function() {
				// 取消选择图片
				if("" == $('#releaseImg').val()) {
					// 情况临时变量中的图片数据
					tempImg = null;
					// 恢复页面样式
					$('.release-img span').removeAttr('style').html('<i class="iconfont icon-add2"></i>');
				} else {
					// 压缩图片并显示
					resizeImg('releaseImg', 640, formfile);
				}
			})
			
			// 发送按钮点击的事件函数
			$('.send-btn').on('click', function() {
				if("" == $('#releaseImg').val() && "" == $("#releaseContent").val()) {
					return _toast.show("请选择图片或者输入文字内容");
				}
				if("" == hg_userid || "" ==  hg_username || "" == hg_img) {
					return _toast.show("请先登陆再发布");
				}
				if("" == $('#releaseImg').val()) {
					genEventContent(null);
				} else {
					uploadFile(formfile, genEventContent);
				}
			})
		}
		
		var name = _getToken(d, "username");
		var img = _getToken(d, "picurl");
		var userid = _getToken(d, "userid");
		if (name == "") name = "";//name = "app用户";
		if (img == "") img = userImgURL + "/xinlanUser/2.jpg";
		if (userid == "") userid = "18";

		getUserinfoCb(name, img, userid);
	}
	
	// //debug 用
	// var _wxzs = function(o) {
	// 	o.callback({
	// 		"username":"测试",
	// 		"picurl":"http://develop.wifizs.cn:11001/images/xinlanUser/1.jpg",
	// 		"userid":"111"
	// 	},"userid",o._callAjax);
	// }
	if(_isWeixin()) {
		var _wxzs1 = function(o) {
			o.callback({
				"username":_getPar("nickname"),
				"picurl":_getPar("headimgurl"),
				"userid":_getPar("openid")
			},"userid",o._callAjax);
		}
	} else {
		var _wxzs1 = _wxzs;
	}

	var only_for_user = true;
	_wxzs1({
		"callback": h5_cb,
		"_callAjax": _genCallAjax(ajaxURL)
	}, only_for_user);
//	var only_for_user = true;
//	_wxzs({
//		"callback": h5_cb,
//		"_callAjax": _genCallAjax(ajaxURL)
//	}, only_for_user);
})