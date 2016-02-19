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
					_toast.show(d.errMsg);
					if (d.success) {
						// index页面显示的投票数
						var liCntElement = $("li[data-id="+id+"]").find(".cnt");
						if (!!liCntElement) cnt = parseInt(liCntElement.text());
						liCntElement.text(cnt+1);
						// 文章内容页面显示的投票数
						if(!isNaN(parseInt($("#articleCnt").text()))) {
							$("#articleCnt").text(cnt+1);
						}
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
			
			// 点击查看文章内容
			var showDetail = function(r, cnt) {
				$("#articleTitle").text(r.name);
				$("#articleDetail").html(r.work);
				$("#articleCnt").text(cnt);
				$("#articleTitle").attr("data-id", r.id);
				$("#datu").show();
				$(".jiashuArea").show();
			}
			
			// 更新页面信息
			var updateList = function(d) {
				d.forEach(function(r) {
					var str = '<li class="mb15 pct100 pt10 pb10 bdd rel ovh" data-id='+r.id+'>' + 
								'<i class="fa fa-envelope balanced abs fa-2x"></i>' + 
								'<h5 class="f14 m0 ml20 ell pct50 n g3">' + r.id + '号<br />' + 
								'<span class="f12 g9">' + r.name + '<br />' + 
								'当前票数：<span class="cnt">' + r.cnt + '</span>' + '票</span>' + '</h5>' + 
								//'<span class="btn bg_orange abs">投票</span>' + 
								'</li>';
					var e = $(str).appendTo("#article-list");
					// 点击播放
					e.click(function() {
						// 点击查看文章内容
						showDetail(r, e.find(".cnt").text());
					})
					// 投票
					e.find(".btn").click(function(e) {
						event.stopPropagation();
						vote_for(r.id);
					});
				});
			};
			
			// 关闭文章内容
			$("#articleClose").click(function() {
				$("#articleTitle").text("");
				$("#articleDetail").html("");
				$("#articleCnt").text("");
				$("#articleTitle").removeAttr("data-id");
				$("#datu").hide();
				$(".jiashuArea").hide();
			});
			
//			// 查看文章内容页面 投票
//			$("#articleVote").click(function() {
//				vote_for($("#articleTitle").attr("data-id"));
//			});
			
			// 加载更多
			$("#more-candidates").click(function(){
				// 页面id为audio-list里的最后一个li标签中的data-id的属性值即为页面投票项目id最大的值
				var last = parseInt($("#article-list li:last").attr("data-id"))
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
						$("#article-list").empty();
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
