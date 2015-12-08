/**
 * 手机投票-简介页面的javascript
 */
$(function() {
	 // 投票编号
	var vote_id = _getPar("vote_id");
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
			$("#vote-title").text(d.data.title);
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
		urlSearch += "&openid=" + openid;
	}
	$("#goIndex").attr("href", "index.html?" + urlSearch);
	$("#goProfile").attr("href", "profile.html?" + urlSearch);
	$("#goRank").attr("href", "rank.html?" + urlSearch);
	
	$('.comment').bind("click", function() {
		location.href = "index.html?comment=1&vote_id="+vote_id;
	});
})