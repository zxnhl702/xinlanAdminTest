$(function() {
	
	$('.live-navbar').on('click','a',function(e){
		var i = $(this).index();
//		if(i == '2')return false; 
		$(this).addClass('weui_bar_item_on').siblings().removeClass('weui_bar_item_on');
		$('.live-tab-bd>div').removeClass('weui_tab_bd_item_active').eq(i).addClass('weui_tab_bd_item_active');
		if(i == '0'){
			$('.live-comment-area').show();
		} else {
			$('.live-comment-area').hide();
		}
	})
	$('.live-state').on('click',function(){
		if($(this).hasClass('live-state-on')){
			$('#dm-main').css('opacity','0');
			$(this).removeClass('live-state-on').addClass('live-state-off').text('打开弹幕');
		}else{
			$('#dm-main').css('opacity','1');
			$(this).removeClass('live-state-off').addClass('live-state-on').text('关闭弹幕');
		}
	})
	
	$(window).scroll(function(){
		var $live = $('.live-content');
		var $liveTab = $('.live-tab');
		var liveHeight = $live.height();
		if($(this).scrollTop() > liveHeight){
			$live.css({
				'position':'fixed',
				'top':'0',
				'z-index':'3',
				'width':'100%'
			})
			$liveTab.css('top','25rem')
		}else if($(this).scrollTop() < liveHeight){
			$live.css({
				'position':'relative',
			})
			$liveTab.css('top','0')
		}
	})
	
	var h5_cb = function(d, key, _callAjax) {
		var name = _getToken(d, "username"),
			img = _getToken(d, "picurl"),
			userid = _getToken(d, "userid");
		var video_id = _getPar("video_id");
		var allids = [];
		var comments = [];
		img = (img == "") ? "http://develop.wifizs.cn:11001/images/videos/default.jpg" : img;
		
		_callAjax({
			"cmd":"getVideosByIds",
			"ids":video_id
		}, function(d){	
			if(null != d.data) {
				d.data.forEach(function(r) {
					//alert(JSON.stringify(r.title));	
					$('#videotitle').text(r.title);
					$('#videoname').text(r.title);
					$('#comment').text('评论('+r.commentCount+')');
					//$('#introduction').attr("src", userImgURL+r.introduction);
					$('.live-video').attr("src", r.videostream);
					$('.live-video').attr("poster", userImgURL+r.introduction);
					getProgram();
					getAllVideoCommentIdsCheck(video_id);
				});
			}
		});
		 var getProgram = function(){
			 _callAjax({
				"cmd":"getProgram",
				"video_id":video_id
			}, function(d) {
		        if(d.success){
					//alert(d.data.program);
					$('#program').html(d.data.program);
				}
				
			});
		}
		
		var getAllVideoCommentIdsCheck=function(videoid){
        	_callAjax({
				"cmd":"getAllVideoCommentIdsCheck",
				"video_id":videoid
			}, function(d){	
				if(null != d.data) {
					d.data.forEach(function(r) {
						allids.push(r);
					});
				}
				getVideoCommentIds(video_id);
				getAmmouncement(video_id);
				getVideoIpCount(video_id);
				
			});	
        }
		
		var getVideoIpCount=function(videoid){
        	_callAjax({
				"cmd":"getVideoIpCount",
				"video_id":videoid
			}, function(d){	
				$('.live-num').text("访问人数 : "+d.data);
			});	
        }
		
        var getAmmouncement=function(videoid){
        	_callAjax({
				"cmd":"getAnnouncements",
				"video_id":videoid
			}, function(d){	
				if(null != d.data && null != d.data.announcement) {
					$('<marquee scrollamount="1" direction="up" id="announcement">'+d.data.announcement.split("|").join('<br />')+'</marquee >').appendTo('.live-notice');
				}
			});	
        }
        var getVideoCommentIds=function(videoid){
        	_callAjax({
				"cmd":"getVideoCommentIdsCheck",
				"video_id":videoid
			}, function(d){	
				var ids =[];
				if(null != d.data) {
					d.data.forEach(function(r) {
						ids.push(r);
					});
				}
				getCommentByUserId(ids);
			});	
        }
		var getCommentByUserId=function(ids){
			_callAjax({
				"cmd":"getVideoCommentByIdsChecked",
				"ids":ids.join("|")
			}, function(d){	
				if(null != d.data) {
					d.data.forEach(function(r) {
						allids.splice($.inArray(r.id,allids),1);
						ymd = r.logdate.split(" ")[0].split("-");
						new_date = ymd[1]+"/"+ymd[2]+"/"+ymd[0]+" "+r.logdate.split(" ")[1];
						var time=_howLongAgo(new_date);
						var str ='<li><div class="weui-row weui-no-gutter"><div class="weui-col-20 live-comment-img"><img src="'+r.userimg+'" id="user'+r.user_id+'"/></div><div class="weui-col-80 live-comment-bd"><h5>'+r.username+'</h5><time>'+time+'</time><div class="cl"></div><p>'+r.comment+'</p><div id="reply'+r.id+'"></div></div></div></li>';					
						var e = $(str).appendTo("#scroller ul");
//						e.find('#user'+r.user_id).attr("src", userImgURL+r.userimg);
						comments = comments.concat(r.comment);
						getReply(r.id);
					});
				}
			});	
		}
		var getReply=function(commentid){
			_callAjax({
				"cmd":"getReplys",
				"comment_id":commentid
			}, function(d){	
				//alert(JSON.stringify(d.data));
				if(d.data != null){
					d.data.forEach(function(r) {
						$('<div class="weui-row live-comment-apply" ><div class="weui-col-25">管理员回复</div><div class="weui-col-75">'+r.reply+'</div></div>').appendTo("#reply"+commentid);
					});
				}
			});	
		}
		
		$('.live-comment-btn').on('click',function(){
			
			if(""==name){
				layer.open({content:'请登录无限舟山',time:1});
			}else{
				if($('#commentcontent').val()==""){
					layer.open({content:'您的评论为空',time:1});
				}else{
					addComment(video_id,$('#commentcontent').val().replace(/\s/g, ""),userid,img,name)
				}
			}	
		})
		var addComment=function(videoid,comment,userid,userimg,username){
			_callAjax({
				"cmd":"addComment",
				"video_id":videoid,
				"comment":comment,
				"user_id":userid,
				"user_img":userimg,
				"user_name":username
			}, function(d){	
				if (!d.success) layer.msg('提交失败');
				$('#commentcontent').val("");
				layer.open({content:'您的评论将在审核后显示',time:1});
//				$("#scroller").empty();
//				getAllVideoCommentIdsCheck(video_id);
			});	
		}
		// 弹幕
		var emitComment = function() {
			var i = -1,
			damoo = Damoo("dm-screen", "dm-canvas", 12, "microsoft yahei");
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
					"text":comments[i],
					"color":randomColor(),
					"shadow":false
				});
			};
		}();
		
		setInterval(function(){
			emitComment();
		}, 500);
		
		loaded();
		
		function loaded(){
			// dropload
			$('#scroller').dropload({
				scrollArea: window,
				autoLoad:false,
				loadDownFn: function(me) {
					if(allids[0]){
						getCommentByUserId(allids.slice(0,5))
						me.resetload()
					}else{
						layer.open({content:'评论全部加载完毕',time:1});
						$('.dropload-down').hide()
						// 锁定
						me.lock();
						// 无数据
//						me.noData();
					}
				}
			});
		}
		
		var videoController = function(){
			var video = document.getElementById('live-video');
			var videoIsPlay = true;
			$('.live-video').on('click',function(){
				if(videoIsPlay == true){
					videoIsPlay = false;
					video.play();
				}else{
					videoIsPlay = true;
					video.pause();
				}
			})
			$('#dm-main').on('click',function(e){
				$('.live-video').trigger('click');
			})
		}
		
		videoController();
	};
	

	 //debug 用
//	 var _wxzs = function(o) {
//		o.callback({
//	 		"username":"倪哥",
//	 		"picurl":"user2.jpg",
//			"userid":"2"
//	 	},"userid",o._callAjax);
//	 }

	var only_for_user = true;
	_wxzs({
		"callback": h5_cb,
		"_callAjax": _genCallAjax(ajaxURL)
	}, only_for_user);
});

