$(function() {
	// 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = imgURL + "/vote_" + vote_id + "/";
	// 正在播放的audio标签
	var nowPlayingAudio = null;
	// 是否是微信登陆
	var weixinLogin = _isWeixin()||debugMod;

	if(weixinLogin) {
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
			
			_callAjax = _genCallAjax(ajaxURL),
			comments = [],
			ifComment = _getPar("comment"),
			MAX = 10e5;

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
					_toast.show(d.errMsg);
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
//					"from":parseInt(from)+1,
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
					var str = '<li class="mb15 pct100 pt10 pb10 bdd cl rel" data-id='+r.id+'>' + 
								'<div class="l mt10 ml20"><i class="fa fa-feed balanced fa-2x"></i></div>' + 
								'<h5 class="f14 l m0 ml20 ell pct50 n g3">' + r.id + '.' + r.name + '<br />' + 
								'<span class="f12 g9">' + r.work + ' | ' + 
								'<span class="cnt">' + r.cnt + '</span>' + '票</span>' + '</h5>' + 
								'<span class="btn bg_orange r mr20 mt5">投票</span>' + 
								'<audio src="' + img_url_root + r.id + '.mp3" class="dn"></audio>' + 
								'</li>';
					var e = $(str).appendTo("#audio-list");
					// 点击播放
					e.click(function() {
						playDifferentAudio(e.find("audio")[0]);
						$(".list-ani").remove();
						$(".active").removeClass("active");
						if(!e.find("audio")[0].paused) {
							e.addClass("active");
							e.append('<section class="list-ani abs"></section>');
						}
					})
					// 投票
					e.find(".btn").click(function(e) {
						event.stopPropagation();
						vote_for(r.id);
					});
				});
			};
			// 播放不同的音频
			function playDifferentAudio(needToPlayAudio) {
				// 初次加载没有正在播放的音频
				if(null == nowPlayingAudio) {
					playControl(needToPlayAudio);
				} else {
					// 正在播放的音频与需要播放的是同一个
					if(nowPlayingAudio.src == needToPlayAudio.src) {
						playControl(needToPlayAudio);
					// 不同个
					} else {
						// 正在播放的暂停
						nowPlayingAudio.pause();
						// 播放需要播放的音频
						playControl(needToPlayAudio);
					}
				}
			}
			// 点击播放/暂停
			function playControl(audio) {
				// 如果暂停 
				if(audio.paused) {
					// 播放
					audio.play();
					// 正在播放的audio写入正在播放的公共变量
					nowPlayingAudio = audio;
				} else {
					// 暂停
					audio.pause();
				}
			}

			// 加载更多
			$("#more-candidates").click(function(){
				// 页面id为audio-list里的最后一个li标签中的data-id的属性值即为页面投票项目id最大的值
				var last = parseInt($("#audio-list li:last").attr("data-id"))
				// 获得更多的项目
				getCandidates(last);
			});

			$(".comment").click(function() {
				$(".commentArea").show().parent().show();
				$(".commentArea textarea").val("");
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
					console.log(d);
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
					$("#candidates-count").text(d.data.itemCount);
					$("#votes-count").text(parseInt(d.data.voteCount));
					$("#clicks-count").text(d.data.clickCount);
					getCandidates(0);
					getComments(MAX);
				} else {
					_toast.show(d.errMsg);
				}
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
