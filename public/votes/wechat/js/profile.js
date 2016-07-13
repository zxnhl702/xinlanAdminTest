/**
 * 手机投票-简介页面的javascript
 */
$(function() {
	 // 投票编号
	var vote_id = _getPar("vote_id");
	var openid = _getPar("openid");
	// 图片地址
	var img_url_root = imgURL + "/vote_" + vote_id + "/";
	// 是否是微信登陆
	var weixinLogin = _isWeixin()||debugMod;
	
	var _callAjax = _genCallAjax(ajaxURL);
	// 取页面的title
	_callAjax({
		"cmd":"getVoteTitleByVoteId",
		"vote_id":vote_id
	}, function(d) {
		if(d.success) {
			$("title").html(d.data.title);
			// 分享
			// 没有设置分享链接或者微信登陆投票页面的情况下隐藏分享按钮
			if("" == d.data.shareurl || weixinLogin) {
				$("#doShare").hide();
			} else {
				$("#doShare").show();
				$("#doShare").click(function() {
					_share({
						"content":"投票活动！"+d.data.title,
						"content_url":d.data.shareurl,
						"pic":img_url_root+ "banner.jpg"
					});
				})
			}
		}
	});
	
	// 头图
	var bannerImg = '<img src="'+img_url_root+'profile.jpg" width="100%" class="db"/>';
	$(bannerImg).appendTo(".main");
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
	
	$('#goComment').bind("click", function() {
		location.href = "index.html?" + urlSearch + "&comment=1";
	});
})
