$(function() {
	// 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = "http://127.0.0.1:11001/images/votes/vote_" + vote_id + "/";
	$.hg_h5app({
		"needUserInfo":function() {
			var _callAjax = _genCallAjax("http://127.0.0.1:11006/xinlan/votes");
			_callAjax({
				"cmd":"top_list",
				"vote_id":vote_id
			}, function(d){
				var i = 0,
				rankImg = ["first", "second", "third"];
				d.data.forEach(function(r) {
					i += 1;
					var rank = i;
					if (i < 4) rank = '<img src="img/'+rankImg[i-1]+'.png" width="30" class="db m0 auto"/>';
					str = '<tr class="bbe"> <td width="30%"> '+rank+' </td> '+ 
							'<td width="40%"><img src="candidate/thumb'+r.id+'.jpg" width="35" height="35" class="mr10 l"/>'+ 
							'<p class="l">'+r.name.substring(0, 8)+'</p></td> '+ 
							'<td width="30%" class="orange">'+r.cnt+'</td> </tr> ';
					$(str).appendTo(".rank-table");
				});
			});
			
			// 头图
			var bannerImg = '<img src="'+img_url_root+'banner-img.jpg" width="100%" class="db"/>';
			$(bannerImg).appendTo(".banner");
			// 底栏
			var footColumn = '<a href="index.html?vote_id=' + vote_id + '" class="g6"><i class="fa fa-home fa-2x"></i><br />首页</a>' + 
								'<a href="profile.html?vote_id=' + vote_id + '" class="g6"><i class="fa fa-info fa-2x"></i><br />简介</a>' + 
								'<a href="rank.html?vote_id=' + vote_id + '" class="orange"><i class="fa fa-signal fa-2x"></i><br />排行</a>' +
								'<a class="g6 comment"><i class="fa fa-comments-o fa-2x"></i><br />评论</a>';
			$(footColumn).appendTo(".footer-cloumn");
			
			$('.comment').bind("click", function() {
				location.href = "index.html?comment=1&vote_id="+vote_id;
			});
		}
	});
});
