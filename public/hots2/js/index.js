$(function(){
	
	var h5_cb = function(d, key, _callAjax) {
		var getUserinfoCb = function(hg_username, hg_img, hg_userid) {
			var hot_id = _getPar("hot_id");
			var MAX = 1000000;
			var users = ["admin", "无限舟山", "前方记者"];
			if (hot_id == '') return;
			
			// 微信登陆或者ios系统的情况下
			if(_isWeixin() || _getDev() == "iOS") {
				// 显示用户发布事件的按钮
				$('.release-btn').show();
			}
			
			$('#go-comment').on('touchstart',function(){
				if(_isWeixin()) {
					location.href="comment.html?hot_id=" + hot_id + "&state=" + _getPar("state") + "&openid=" + _getPar("openid");
				} else {
					location.href="comment.html?hot_id=" + hot_id;
				}
				
			})
			
			$('.release-btn').on('click', function() {
				if(_isWeixin()) {
					location.href="release.html?hot_id=" + hot_id + "&state=" + _getPar("state") + 
						"&openid=" + _getPar("openid") + 
						"&nickname=" + _getPar("nickname") + 
						"&headimgurl=" + _getPar("headimgurl");
				} else {
					if("" == _getToken(d, "username")) return _toast.show("请先登陆无限舟山!");
					location.href="release.html?hot_id=" + hot_id;
				}
			})

			var updateComments = function(e, comments) {
				var ul = e.find(".list-comment ul");
				if (!comments) return;
				comments.forEach(function(r) {
					var str = '<li data-id='+r.id+'><header>' + 
						'<img src="' + r.img + '"/>' + 
						'<h5>' + r.name + ' <span>' + _howLongAgo(r.logdate) + '</span></h5>' + '</header>' + 
						'<p>' + r.content + '</p>' + '</li>';
					$(str).appendTo(ul);
				});
			};

			var updateEvents = function(d) {
				if(d.data == null) return _toast.show("全部加载完成，没有更多数据！");
				d.data.forEach(function(r) {
					var shareBtn = _isWeixin() ? '' : '<span class="list-share-btn"><i class="iconfont icon-0063fenxiang"></i></span>';
//					var str = '<li data-id="' + r.id + '">' + '<header>' +
//						'<img src="'+r.userimg+'" width="100%"/>' + 
//						'<h5>' + r.username + '</h5>' + 
//						'<p>' + _howLongAgo(r.logdate) + '</p>' + '</header>' + 
//						'<p><h3>' + r.title + '</h3></p>' + r.content +
//						'<footer class="cl">' + 
//						'<span class="list-zan-btn"><i class="iconfont icon-0008zan"></i> <span>' + r.zan + '</span></span>' + 
//						shareBtn + 
//						'<span class="list-comment-btn"><i class="iconfont icon-0096pinglun01"></i> <span>' + r.commentsCount + '</span></span>' + 
//						'</footer>' + 
//						'<div class="list-comment" if-shown=0><ul></ul><span class="new-comment-btn">发表评论...</span></div>' + 
//						'</li>';
					var str = '<li data-id="' + r.id + '">' + '<header>' + 
						'<img src="' + r.userimg + '" width="100%">' + 
						'<h5>' + r.username + '</h5>' + 
						'<p>' + _howLongAgo(r.logdate) + '</p>' + '</header>' + 
						'<h3>' + r.title + '</h3>' + '<article>' + r.content + '</article>' + 
						'<div class="toggle-bar"><i class="iconfont icon-down"></i> 展开</div>' + 
						'<footer class="cl">' + 
						'<span class="list-zan-btn"><i class="iconfont icon-0008zan"></i> <span>' + r.zan + '</span></span>' + 
						'<span class="list-share-btn"><i class="iconfont icon-0063fenxiang"></i></span><span class="list-comment-btn"><i class="iconfont icon-0096pinglun01"></i> <span>' + r.commentsCount + '</span></span>' + 
						'</footer>' + 
						'<div class="list-comment" if-shown="0">' + 
						'<ul></ul><span class="new-comment-btn">发表评论...</span>' + 
						'</div></li>';
					var e = $(str).appendTo("#events");
					e.find('img').addClass('live-img');
					e.find('video').addClass('live-img');
					// 展开/收起
					e.find('.toggle-bar').on('touchstart', function() {
						if($(this).children('i').hasClass('icon-down')){
							$(this).prev().css('max-height','none');
							myScroll.refresh();
							$(this).html('<i class="iconfont icon-up"></i> 收起</div>')
						}else{
							$(this).prev().css('max-height','5rem');
							myScroll.refresh();
							$(this).html('<i class="iconfont icon-down"></i> 展开</div>')
						}
					})
					// 点赞
					e.find(".list-zan-btn").bind('touchstart',function(){
						_callAjax({
							"cmd":"zan",
							"event_id":r.id,
							"user_id":hg_userid,
							"hot_id":hot_id
						}, function(d) {
							var zans = parseInt(e.find(".list-zan-btn span").text());
							if (d.success) {
								e.find(".list-zan-btn span").text(zans+1);
							} else {
								_toast.show("无法重复点赞！");
							}
						});
					});
					// 打开评论
					e.find(".list-comment-btn").bind('touchstart',function(){
						var cEle = e.find(".list-comment");
						var ifShown = cEle.attr("if-shown").replace(/\s/g, '') == "1";
						if (ifShown) {
							cEle.hide();
							cEle.attr("if-shown", 0);
							myScroll.refresh();
						} else {
							cEle.attr("if-shown", 1);
							cEle.show();
							if (!cEle.find("ul li").length) {
								_callAjax({
									"cmd":"getEventComments",
									"event_id":r.id,
									"from": MAX,
									"hot_id":hot_id
								}, function(d) {
									updateComments(e, d.data);
									myScroll.refresh();
								});
							} else {
								myScroll.refresh();
							}
						}
					});
					// 评论
					e.find('.new-comment-btn').on('touchstart',function(){
						_newMask();
						
						$('.mask').append('<div class="comment-layer"><header><span class="comment-cancel active">取消</span> 评论 <span class="comment-submit">发送</span></header><textarea placeholder="输入评论内容" rows="7" class="comment-layer-textarea"></textarea></div>');
						
						$('.comment-layer-textarea').focus().on('keyup',function(){
							if($(this).val() == ''){
								$('.comment-submit').removeClass('active');
							}else{
								$('.comment-submit').addClass('active');
							}
						});
						// 发送评论
						$('.comment-submit').on('touchstart',function(){
							var content = $.trim($('.comment-layer-textarea').val());
							var event_id = r.id;
							if (content == '') return _toast.show("请填写内容！");
							if (hg_username == '') return _toast.show("请先注册成为无限舟山用户！");
							_callAjax({
								"cmd":"newComment",
								"name":hg_username,
								"img":hg_img,
								"content":content,
								"event_id": event_id,
								"hot_id":hot_id
							}, function(d) {
								if (d.success) {
									e.find(".list-comment ul").empty();
									_callAjax({
										"cmd":"getEventComments",
										"event_id":event_id,
										"from":MAX,
										"hot_id":hot_id
									}, function(d){
										updateComments(e, d.data);
										myScroll.refresh();
									});
									// 更新评论数量
									var cc = e.find(".list-comment-btn span");
									cc.text(d.data.commentsCount);
									// 评论完输入框隐藏
									$('.mask').remove();
								}
							});
						});
						// 取消评论
						$('.comment-cancel').on('touchstart',function(){
							$('.mask').remove();
						});
					});
					// 分享
					e.find(".list-share-btn").bind('touchstart',function() {
						var event_id = r.id;
						_share({
							"content":"直播！"+r.title,
							"content_url":"http://"+host+"/hots2/share2.html?"+hot_id+","+event_id+",",
							"pic":"http://"+host+"/hots/img/top_img"+ hot_id+".jpg"
						});
					});
				});
				// 播放视频
				$('#events>li>p>video').bind('touchend',function() {
					if($(this)[0].paused) {
						$(this)[0].play();
					} else {
						$(this)[0].pause();
					}
					myScroll.refresh();
				});
			};

			_callAjax({
				"cmd":"getHotInfoById",
				"hot_id":hot_id
			}, function(d){
				$('title').text(d.data.title);
				$('.banner-info>h5').text(d.data.title);
				$('.banner-info>p').html("报道数: "+d.data.eventsCount+"&nbsp;&nbsp;&nbsp;&nbsp;"+d.data.clicksCount+"次浏览");
				$('.banner>img').attr('src', userImgURL+'hots/top_img'+ hot_id+'.jpg')
				if(d.data.description != null || d.data.description != "") {
					$("#share-info").text(d.data.description);
				} else {
					$("#share-info").hide();
				}
			});

			_callAjax({
				"cmd":"getTop5Events",
				"hot_id":hot_id,
				"from":MAX
			}, function(d) {
				updateEvents(d);
				
//				$('.live-img').each(function(){
//					var $this = $(this);
//					var interVal = setInterval(function(){
//						if($this.height() > 0){
//							clearInterval(interVal);
//							myScroll.refresh();
//						}
//					},100)
//				})
				var classic = $('html').css('font-size').substring(0,2);
				var imgLength = $('img').length;
				$('img').load(function(){
					myScroll.refresh();
					$('#events article').each(function(){
						if($(this).height() >= classic*5){
							$(this).next().show();
						}
					})
				})
			});
			
			// 下拉刷新
			var myScroll;
			myScroll = new IScroll('#wrapper', {
				probeType: 3,
				mouseWheel: true
			});
			myScroll.on("scroll", function() {
				var y = this.y,
					maxY = this.maxScrollY - y;
				if (y >= 40) {
					$('#pullDown-msg').text('松手立即刷新');
					return "";
				} else if (y < 40 && y > 0) {
					$('#pullDown-msg').text('下拉刷新');
					return "";
				}
				if (maxY >= 40) {
					$('#pullUp-msg').text('松手加载数据');
					return "";
				} else if (maxY < 40 && maxY >= 0) {
					$('#pullUp-msg').text('上拉加载');
					return "";
				}
			});
			myScroll.on("slideDown", function() {
				if (this.y > 40) {
					location.reload();
				}
			});
			myScroll.on("slideUp", function() {
				if (this.maxScrollY - this.y > 40) {
					var eLast = $("#events li:last");
					if (!eLast) return;
					var from = eLast.attr("data-id");
					_callAjax({
						"cmd":"getTop5Events",
						"hot_id":hot_id,
						"from":from
					}, function(d) {
						updateEvents(d);
						
//						$('.live-img').each(function(){
//							var $this = $(this);
//							var interVal = setInterval(function(){
//								if($this.height() > 0){
//									clearInterval(interVal);
//									myScroll.refresh();
//								}
//							},100)
//						})
						var classic = $('html').css('font-size').substring(0,2);
						var imgLength = $('img').length;
						$('img').load(function(){
							myScroll.refresh();
							$('#events article').each(function(){
								if($(this).height() >= classic*5){
									$(this).next().show();
								}
							})
						})
					});
					$('#pullUp-msg').text('上拉加载');
				}
			});
		};


		var name = _getToken(d, "username");
		var img = _getToken(d, "picurl");
		var userid = _getToken(d, "userid");
		if (name == "") name = "";//name = "app用户";
		if (img == "") img = userImgURL + "/xinlanUser/2.jpg";
		if (userid == "") userid = "18";

		getUserinfoCb(name, img, userid);
	};

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
});
