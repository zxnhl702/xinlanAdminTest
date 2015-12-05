$(function() {
	// 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = imgURL + "/vote_" + vote_id + "/";
	$.hg_h5app({
		"needUserInfo":function() {
			var _callAjax = _genCallAjax(ajaxURL);
			_callAjax({
				"cmd":"top_list",
				"vote_id":vote_id
			}, function(d){
				if(null == d.data) {
//					$("#rankInfo").text("还没有人投票！");
					return;
				} else {
					$("#rankInfo").hide();
				}
				var i = 0;
				var rankImg = ["first", "second", "third"];
				d.data.forEach(function(r) {
					i += 1;
					var rank = i;
					if (i < 4) rank = '<img src="img/'+rankImg[i-1]+'.png" width="30" class="db m0 auto"/>';
					str = '<tr class="bbe"> <td width="30%"> '+rank+' </td> '+ 
							'<td width="40%">'+ 
							'<p class="l">'+r.name.substring(0, 8)+' | '+r.work+'</p></td> '+ 
							'<td width="30%" class="orange">'+r.cnt+'</td> </tr> ';
					$(str).appendTo(".rank-table");
				});
			});
			
			// 头图
			var bannerImg = '<img src="'+img_url_root+'banner.jpg" width="100%" class="db banner"/>';
			$(bannerImg).appendTo(".banner");
			// 底栏
			var openid = _getPar("openid");
			$("#goIndex").attr("href", "index.html?vote_id=" + vote_id 
					+ "&openid=" + openid); // for weixin
			$("#goProfile").attr("href", "profile.html?vote_id=" + vote_id
					+ "&openid=" + openid); // for weixin
			$("#goRank").attr("href", "rank.html?vote_id=" + vote_id
					+ "&openid=" + openid); // for weixin
			
			$('.comment').bind("click", function() {
				location.href = "index.html?comment=1&vote_id="+vote_id;
			});
		}
	});
});
