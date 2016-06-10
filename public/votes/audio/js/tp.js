$(function() {
	// 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = imgURL + "/vote_" + vote_id + "/";
	// 正在播放的audio标签
	var nowPlayingAudio = null;
	// 是否是微信登陆
	var weixinLogin = _isWeixin()||debugMod;
	// 微信登陆的情况下
	if(weixinLogin) {
		// 去除无限舟山app需要的js文件
		$("script[src='js/h5app.js']").remove();
		$("script[src='js/viewPC.js']").remove();
		$("script[src='js/print.js']").remove();
		// for weixin
		$.hg_h5app = function(kv) {
			kv["needSystemInfo"]();
		};
	}
	
	$.hg_h5app({
		"needSystemInfo":function(d) {
			if(weixinLogin) {
				// for weixin
				var device_token = _getPar("openid");
			} else {
				var device_token = _getToken(d, "device_token");
			}
			
			var _callAjax = _genCallAjax(ajaxURL);
			var comments = [];
			var ifComment = _getPar("comment");
			var MAX = 10e5;

			// FUNCTIONS
			// 投票
			var vote_for = function(id) {
				_callAjax({
					"cmd":"vote_for",
					"device_token":device_token,
					"vote_from": device_token,
					"vote_for": id,
					"vote_id": vote_id
				}, function(d) {
					_toast.info(d.errMsg);
					if (d.success) {
						var liCntElement = $("li[data-id="+id+"]").find(".cnt");
						if (!!liCntElement) cnt = parseInt(liCntElement.text());
						liCntElement.text(cnt+1);
					}
				});
			};

			// 获得投票项目
			var getCandidates = function(from) {
				_callAjax({
					"cmd":"getCandidates",
					"from":from,
					"amount":10,
					"vote_id":vote_id
				}, function(d) {
					if (d.success) {
						if (null == d.data) {
							_toast.show("全部加载完毕");
							$("#more-candidates").hide();
							return;
						}
						updateList(d.data);
					}
				});
			};

			// 获得评论
			var getComments = function(from) {
				_callAjax({
					"cmd":"getComments",
					"id":from,
					"amount":10,
					"vote_id":vote_id,
					"no-loading":true
				}, function(d) {
					if (d.data === null) return;
					comments = comments.concat(d.data);
				});
			};

			// 弹幕
			var emitComment = function() {
				var i = -1,
				damoo = Damoo("dm-screen", "dm-canvas", 10, "microsoft yahei");
				damoo.start();

				var randomColor = function() {
					var nums = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F'],
					cnt = 3, colors = [];
					while (cnt > 0) {
						colors.push(nums[parseInt(Math.random()*16)]);
						cnt -= 1;
					}
					return "#"+colors.join("");
				};

				return function() {
					if (comments.length == 0) return;
					i += 1;
					if (i == comments.length) i = -10;
					damoo.emit({
						"text":comments[i].comment,
						"color":randomColor(),
						"shadow":true
					});
				};
			}();

			// 更新页面信息
			var updateList = function(d) {
				d.forEach(function(r) {
					var str = '<li class="mb15 pct100 pt10 pb10 bdd cl rel ovh" data-id='+r.id+'>' + 
								'<div class="l mt10 ml20"><i class="fa fa-feed balanced fa-2x"></i></div>' + 
								'<h5 class="f14 l m0 ml20 ell pct50 n g3">' + r.id + '.' + r.name + '<br />' + 
								'<span class="f12 g9">来自：' + r.work + '<br />' + 
								'当前票数：<span class="cnt">' + r.cnt + '</span>' + '票</span>' + '</h5>' + 
								'<span class="btn bg_orange r mr20 mt5">助力</span>' + 
								'</li>';
					var e = $(str).appendTo("#audio-list");
					// 点击播放
					e.click(function() {
						// 音频文件url
						var mp3Src = img_url_root + r.img;
						playDifferentAudio(mp3Src, r.id);
						$(".list-ani").remove();
						$(".active").removeClass("active");
					})
					// 投票
					e.find(".btn").click(function(e) {
						event.stopPropagation();
						vote_for(r.id);
					});
				});
			};
			// 播放音频
			function playDifferentAudio(audioSrc, id) {
				if(25 == id || 100 == id) {
					audioSrc = img_url_root + id + "-1.mp3"
				}
				// 页面初始化后首次播放 不同的音频 更换音频播放
				if($("#audioPlayer")[0].src != audioSrc){
					_loading();
					// 标签中写入音频文件url
					$("#audioPlayer")[0].src = audioSrc;
					$("#audioPlayer")[0].play();
					// 正在播放的url
					nowPlayingAudio = id;
					$("#audioPlayer")[0].addEventListener("loadeddata",function() {
						_stopLoading();
					}, false);
				// 同一个音频 点击播放/暂停
				} else {
					if($("#audioPlayer")[0].paused) {
						$("#audioPlayer")[0].play();
					} else {
						$("#audioPlayer")[0].pause();
					}
				}
			}
			
			// 为正在播放的条目添加播放效果
			$("#audioPlayer")[0].addEventListener("play",function() {
				var ee = $('li[data-id="'+nowPlayingAudio+'"]');
				ee.addClass("active");
				ee.append('<section class="list-ani abs"></section>');
			}, false);
			
			// 播放完毕的条目取消播放效果
			$("#audioPlayer")[0].addEventListener("ended",function() {
				$(".list-ani").remove();
				$(".active").removeClass("active");
			}, false);
			
			// 加载更多
			$("#more-candidates").click(function(){
				// 页面id为audio-list里的最后一个li标签中的data-id的属性值即为页面投票项目id最大的值
				var last = parseInt($("#audio-list li:last").attr("data-id"))
				// 获得更多的项目
				getCandidates(last);
			});

			$(".commentArea .undo").click(function() {
				$(".commentArea").hide().parent().hide();
			});

			$(".commentArea .report").click(function() {
				var comment = $(".commentArea textarea").val().replace(/\s/g, '');
				if (comment == '') return _toast.show("请填写评论");
				// 评论
				_callAjax({
					"cmd":"comment",
					"comment":comment,
					"vote_id":vote_id
				}, function(d) {
					_toast.show(d.errMsg);
					if (d.success) {
						$(".commentArea").hide().parent().hide();
						// 重新取评论
						comments = [];
						getComments(MAX);
					}
				});
			});

			$(".search-btn").click(function(){
				var id = $("#searchText").val().replace(/\s/g,'');
				if (id == '') _toast.show("请输入号码");
				_callAjax({
					"cmd":"getCandidateById",
					"id":id,
					"vote_id":vote_id
				}, function(d) {
					if (d.success) {
						$("#audio-list").empty();
						var dataArray = new Array(d.data)
						updateList(dataArray)
					} else {
						_toast.show(d.errMsg);
					}
				})
			});

			// INIT
			_callAjax({
				"cmd":"auth",
				"device_token":device_token,
				"vote_id":vote_id
			}, function(d) {
				$(".load-container").hide();
				if(d.success) {
					if(1 == d.data.status) {
						_toast.show(d.errMsg);
					}
					$("#candidates-count").text(d.data.itemCount);
					$("#votes-count").text(parseInt(d.data.voteCount));
					$("#clicks-count").text(d.data.clickCount);
					$("title").html(d.data.title);
					getCandidates(0);
					getComments(MAX);
					// 评论
					$(".comment").click(function() {
						$(".commentArea").show().parent().show();
						$(".commentArea textarea").val("");
					});
					// 头图
					var bannerImg = '<img src="'+img_url_root+'banner.jpg" width="100%" class="db"/>';
					$(bannerImg).appendTo(".banner");
					// 底栏
					// 拼url中？之后的部分
					var urlSearch = "vote_id=" + vote_id;
					if(weixinLogin) {
						var openid = _getPar("openid");
						urlSearch += "&openid=" + openid;
					}
					$("#goIndex").attr("href", "index.html?" + urlSearch);
					$("#goProfile").attr("href", "profile.html?" + urlSearch);
					$("#goRank").attr("href", "rank.html?" + urlSearch);
				} else {
					_toast.show(d.errMsg);
					// 删除超链接
					$("#goIndex").removeAttr("href");
					$("#goProfile").removeAttr("href");
					$("#goRank").removeAttr("href");
				}
			});
			
			setInterval(function(){
				emitComment();
			}, 8000);

			setInterval(function() {
				if (comments.length == 0) return;
				getComments(comments[comments.length-1].id);
			}, 10000);

			if (ifComment != '') {
				$(".comment").click();
			}
		}
	});
});
