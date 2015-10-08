$(function() {
	var h5_cb = function(d, key, _callAjax) {
    var getUserinfoCb = function(hg_username, hg_img, hg_userid) {
        var hot_id = _getPar("hot_id");
        var comments = [];
        var MAX = 1000000;
        var currentEventElement;
				var users = ["admin", "无限舟山", "前方记者"];
        if (hot_id == '') return;

        // get random comments from db
        var getRandomComments = function(limit) {
            _callAjax({
								"noloading":1,
                "cmd":"getRandomComments",
                "limit":limit,
                "hot_id":hot_id
            }, function(d) {
                if (d.data === null) return;
                comments = comments.concat(d.data);
            });
        };

        // get random comments in init
        getRandomComments(10);

        var updateComments = function(e, comments) {
            var ul = e.find(".event-comments ul");
            if (!comments) return;
            comments.forEach(function(r) {
                $('<li class="clearfix bbe mb10" data-id='+r.id+'> <span class="l"><img src="'+r.img+'" width="40"/></span> <div class="r pct80 pb10"> <div class="clearfix g6"> <span class="l">'+r.name+'</span><span class="r">'+_howLongAgo(r.logdate)+'</span> </div> <article class="bk">'+r.content+'</article> </div> </li> ').appendTo(ul);
            });
        };

        var updateEvents = function(d) {
            d.data.forEach(function(r) {
							// _tell(users);
							// _tell(parseInt(_get("xinlan_id"))-1);
                var str = '<div class="list clearfix mt10 mb5" data-id='+r.id+'> <div class="list-logo l"><img src="http://60.190.176.70:11001/images/xinlanUser/'+r.userid+'.jpg" width="100%"/><p class="tc">'+users[parseInt(r.userid)-1]+'</p></div> <div class="list-main rel r bg_light pct70 p10"> <header> <h6 class="mt1 calm">'+r.title+'<b class="f12 n ml10 assertive" id="share">'+'<img src="img/share.png" width="10">'+' 分享'+'</b></h6> <time class="g9">'+_howLongAgo(r.logdate)+'</time> </header> <article class="mt10 f16">'+r.content+'</article> <div class="list-footer bg_light pct100 clearfix tc pt10 pb5 g6 bte mt10"> <span class="l rel zan">'+r.zan+'</span> <span class="r rel pl10 comment-count" if-shown=0>评论 '+r.commentsCount+'</span> </div> </div> <div class="event-comments bg_light pct70 p10 mt5 r dn" if-shown=0><ul></ul><span class="btn bg_positive pct100 p0 pt5 pb5 comments-more">查看更多</span></div></div>';
                var e = $(str).appendTo("#events");
                e.find(".zan").bind('touchstart',function(){
                    _callAjax({
                        "cmd":"zan",
                        "event_id":r.id,
                        "user_id":hg_userid,
                        "hot_id":hot_id
                    }, function(d) {
                        var zans = parseInt(e.find(".zan").text());
                        // var zans = parseInt($(this).text());// 这里的$(this)是window
                        if (d.success) e.find(".zan").text(zans+1);
                    });
                });
                e.find(".comment-count").bind('touchstart',function(){
                    var cEle = e.find(".event-comments");
                    var ifShown = cEle.attr("if-shown").replace(/\s/g, '') == "1";
                    if (ifShown) {
                        cEle.hide();
                        $("#comment-input").hide();
                        cEle.attr("if-shown", 0);
                    } else {
                        currentEventElement = e;
                        cEle.attr("if-shown", 1);
                        $("#comment-input").show();
                        cEle.show();
                        if (!cEle.find("ul li").length) {
                            _callAjax({
                                "cmd":"getTop5Comments",
                                "event_id":r.id,
                                "from": MAX,
                                "hot_id":hot_id
                            }, function(d) {
                                updateComments(e, d.data);
                            });
                        }
                    }
                });
                e.find(".comments-more").bind('touchstart',function() {
                    var l = e.find(".comment ul li:last");
                    if (!l) return;
                    var from = l.attr("data-id");
                    _callAjax({
                        "cmd":"getTop5Comments",
                        "event_id":r.id,
                        "from":from,
                        "hot_id":hot_id
                    }, function(d) {
                        updateComments(e, d.data);
                    });
                });
                // 分享
               e.find("#share").bind('touchstart',function() {
            	   var content = encodeURI(r.content);
            	   var hot_title = encodeURI(r.hot_title);
            	   var event_title = encodeURI(r.title)
//            	   console.log("content: "+content);
//            	   console.log("hot_title: "+hot_title);
//            	   console.log("title: "+event_title);
//            	   console.log("http://127.0.0.1:11006/hots/share.html?hot_title="+hot_title+"&event_title="+event_title+"&content="+content);
              	_share({
  					"content":r.title,
  					"content_url":"http://127.0.0.1:11006/hots/share.html?hot_title="+hot_title+
  					                                                    "&event_title="+event_title+
  					                                                    "&content="+content,
  					"pic":"http://127.0.0.1:11006/hots/top_bg.jpg"
              	});
              });
            });

        	// show big image
    		$('.list-main>article>p>img').bind('tap',function() {
											// alert("rth-img");
    			$('.layer').show().find('img').attr('src',$(this).attr('src'))
    			$('.layer').bind('touchstart',function(e) {
						e.preventDefault();
						e.stopPropagation();

    				$(this).hide();
    			});
    		});
//			$('.list-main img').on('touchstart',function(){
//				$('.layer').show().find('img').attr('src',$(this).attr('src'))
//				$('.layer').on('touchstart',function(){
//					$(this).hide();
//				});
//			});
        };

        _callAjax({
            "cmd":"getHotInfoById",
            "hot_id":hot_id
        }, function(d){
            $("#hot-title").text(d.data.title);
            $("#events-count").text("报道数："+d.data.eventsCount);
            $("#clicks-count").text(d.data.clicksCount+" 次浏览量");
        });

        _callAjax({
            "cmd":"getTop5Events",
            "hot_id":hot_id,
            "from":MAX
        }, function(d) {
            updateEvents(d);
        });

        myScroll.on("slideUp",function(){
        	if(this.y < 40){
        		var eLast = $("#events > div:last");
                if (!eLast) return;
                var from = eLast.attr("data-id");
                _callAjax({
                    "cmd":"getTop5Events",
                    "hot_id":hot_id,
                    "from":from
                }, function(d) {
                    updateEvents(d);
                });
        	}
        })

        $("#comment-input span").bind('touchstart',function() {
            // e.stopPropagation();
            var content = $(this).prev().val().replace(/\s/g, '');
            var event_id = currentEventElement.attr("data-id");
            if (content == '') return _toast.show("请填写内容！");
            if (hg_username == '') return _toast.show("请先注册成为无限舟山用户！");
            // 获取hg_h5app的userinfo
            _callAjax({
                "cmd":"newComment",
                "name":hg_username,
                "img":hg_img,
                "content":content,
                "event_id": event_id,
                "hot_id":hot_id
            }, function(d) {
                if (d.success) {
                    currentEventElement.find(".event-comments ul").empty();
                    _callAjax({
                        "cmd":"getTop5Comments",
                        "event_id":event_id,
                        "from":MAX,
                        "hot_id":hot_id
                    }, function(d){
                    	updateComments(currentEventElement, d.data);
                    	});
                    var cEle = currentEventElement.find(".event-comments");
                    var ifShown = cEle.attr("if-shown").replace(/\s/g, '') == "1";
                       // 更新评论数量
                    var cc = currentEventElement.find(".comment-count");
                    cc.text('评论 '+d.data.commentsCount);
                       // 评论完输入框隐藏
                    if (ifShown) {
                    		cEle.hide();
                    		$("#comment-input").hide();
                    		$("#comment-input").find('.l').val('');
                    		cEle.attr("if-shown", 0);
                       }
                }

            });
        });

        // damoo function
        var emitComment = function() {

            var i = -1,
            damoo = Damoo('dm-screen', 'dm-canvas', 9);
            damoo.start();

            // damoo random color
            var randomColor = function() {
                var nums = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F'],
                    cnt = 3, colors = [];
                while (cnt > 0) {
                    colors.push(nums[parseInt(Math.random()*16)]);
                    cnt -= 1;
                }
                return "#"+colors.join("");
            };

            // display damoo on screen
            return function() {
                if (comments.length == 0) return;
                i += 1;
                if (i == comments.length) i = -10;
                damoo.emit({
                    "text":comments[i].comment,
                    "color":randomColor(),
                    "shadow":false
                });
            };
        }();

        // damoo run every 2 seconds
		setInterval(function(){
			emitComment();
        }, 4000);

        // get comments every 5 seconds
       setInterval(function() {
          if (comments.length == 0) return;
          getRandomComments(10);
        }, 6000);

        // refresh iscroll every 1.5 seconds
       setInterval(function(){
    	   myScroll.refresh();
        }, 1500);

    };


		var name = _getToken(d, "username"),
			  img = _getToken(d, "picurl"),
			userid = _getToken(d, "userid");
		if (name == "") name = "";//name = "app用户";
		if (img == "") img = "http://60.190.176.70:11001/images/xinlanUser/2.jpg";
		if (userid == "") userid = "18";

		/*
		myScroll, downIcon = $("#down-icon"),upIcon = $("#up-icon");
		myScroll = new IScroll('#wrapper', {
			probeType: 1,
			mouseWheel: true,
			tap: true
		});
		myScroll.on('scroll', function() {
			//scroll事件，可以用来控制上拉和下拉之后显示的模块中，
			//样式和内容展示的部分的改变。
				var y = this.y,
				downHasClass = downIcon.hasClass("scroller-rotate");
			if (y >= 40) {
				!downHasClass && downIcon.next().text('放开以刷新...');
				return "";
			} else if (y < 40 && y > 0) {
				downHasClass && downIcon.next().text('下拉刷新');
				return "";
			}
		});
			myScroll.on("slideDown", function() {
			if (this.y > 40) {
				location.reload()
			}
		});
		document.addEventListener('touchmove', function(e) {
			e.preventDefault();
		}, false);
		*/

		getUserinfoCb(name, img, userid);

	};
	//debug 用
	var _wxzs = function(o) {
		o.callback({
			"username":"",
			"picurl":"",
			"userid":"111"
		},"userid",o._callAjax);
	}

	var only_for_user = true;
	_wxzs({
		"callback": h5_cb,
		"_callAjax": _genCallAjax("http://127.0.0.1:11006/xinlan/")
	}, only_for_user);
});
