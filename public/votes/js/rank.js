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
				var i = 0,
				rankImg = ["first", "second", "third"];
				d.data.forEach(function(r) {
					i += 1;
					var rank = i;
					if (i < 4) rank = '<img src="img/'+rankImg[i-1]+'.png" width="30" class="db m0 auto"/>';
					str = '<tr class="bbe"> <td width="30%"> '+rank+' </td> '+ 
							'<td width="40%"><img src="'+img_url_root+'/thumb'+r.id+'.jpg" width="35" height="35" class="mr10 l"/>'+ 
							'<p class="l">'+r.name.substring(0, 8)+'</p></td> '+ 
							'<td width="30%" class="orange">'+r.cnt+'</td> </tr> ';
					$(str).appendTo(".rank-table");
				});
			});
			
			// 头图
			var bannerImg = '<img src="'+img_url_root+'banner.jpg" width="100%" class="db"/>';
			$(bannerImg).appendTo(".banner");
			// 底栏
			$("#goIndex").attr("href", "index.html?vote_id=" + vote_id);
			$("#goProfile").attr("href", "profile.html?vote_id=" + vote_id);
			$("#goRank").attr("href", "rank.html?vote_id=" + vote_id);
			
			$('.comment').bind("click", function() {
				location.href = "index.html?comment=1&vote_id="+vote_id;
			});
		}
	});
});
