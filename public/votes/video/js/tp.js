$(function() {
	// 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = imgURL + "/vote_" + vote_id + "/";
	// 是否是微信登陆
	var weixinLogin = _isWeixin()||debugMod;
	// 微信登陆的情况下
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
						var cnt = parseInt($("#datu-cnt").text());
						var liCntElement = $("li[data-id="+id+"]").find(".cnt");
//						if (!!liCntElement) cnt = parseInt(liCntElement.text());
						if(!isNaN(parseInt(liCntElement.text()))) {
							cnt = parseInt(liCntElement.text());
							liCntElement.text(cnt+1);
						}
						$("#datu-cnt").text(cnt+1);
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

			// 点击放大 视频
			var showImg = function(r) {
				$("#datu-work").html('<i class="fa fa-quote-left fa-pull-left fa-2x"></i>'+r.work);
				$("#datu-cnt").text(r.cnt);
				$("#datu-img").attr("poster", img_url_root+r.thumb);
				$("#datu-img").attr("src", img_url_root+r.img);
				$("#datu-info").text(r.id+"号 "+r.name);
				$("#datu").show().attr("data-id", r.id);
				$("#datu .list-detail").show();
			};

			// 更新页面信息
			var updateList = function(d) {
				var i = 0;
				d.forEach(function(r) {
					var str = '<li class="mb20" data-id='+r.id+'> '+ 
								'<div class="rel bg_light"> '+ 
								'<i class="number db abs tc light bg_orange n">'+r.id+'</i> '+ 
								'<a class="img db"> <img src="'+img_url_root+r.thumb+'" width="100%"> </a> '+ 
								'<div class="name tc ml5 mr5 mb5 bbe g6 pb5">'+r.name+'</div> '+ 
								'<div class="clearfix pb10"> '+ 
								'<p class="l orange pct45 f16"><span class="cnt">'+r.cnt+'</span>票</p> '+ 
								'<a class="vote bg_orange light tc r pct35 mr10 f14 pl5 pr5"><i class="fa fa-heart mr10"></i>助力</a> '+ 
								'</div> </div> </li>';
					var e = $(str).appendTo(i%2==0?"#left":"#right"); i += 1;
					e.find(".img").click(function(){
						showImg(r);
					});
					e.find(".vote").click(function() {
						vote_for(r.id);
					});
				});
			};

			// BINDS

			$(".list-detail-close").click(function() {
				$("#datu-img").attr("poster", "");
				$("#datu-img").attr("src", "");
				$("#datu-img").get(0).pause()
				$("#datu").hide();
				$("#datu .list-detail").hide();
				_stopLoading();
			});
			
//			$("#datu-img").on('canplaythrough', function() {
//				console.log(2);
//				_stopLoading();
//				$("#datu-img").get(0).play();
//			})
//			
//			$("#datu-img").on('loadstart', function() {
//				console.log(1);
//				_loading();
//			})

			$("#datu-vote").click(function(){
				vote_for($("#datu").attr("data-id"));
			});

			$("#more-candidates").click(function(){
				var l_lst = parseInt($("#left li:last").attr("data-id")),
				r_lst = parseInt($("#right li:last").attr("data-id")),
				last = l_lst>r_lst?l_lst:r_lst;
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
						showImg(d.data);
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
						urlSearch += "&openid=" + openid + "&state=" + _getPar("state");
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
