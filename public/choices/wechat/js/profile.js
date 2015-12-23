/**
 * 手机投票-简介页面的javascript
 */
$(function() {
	 // 投票编号
	var vote_id = _getPar("vote_id");
	var openid = _getPar("openid");
	// 图片地址
	var img_url_root = imgURL + "/vote_" + vote_id + "/";
	
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
	$("#goIndex").attr("href", "index.html?vote_id=" + vote_id
		+ "&openid=?" + openid); // for weixin
	$("#goProfile").attr("href", "profile.html?vote_id=" + vote_id
		+ "&openid=?" + openid); // for weixin
	$("#goRank").attr("href", "rank.html?vote_id=" + vote_id
		+ "&openid=?" + openid); // for weixin
	
	$('.comment').bind("click", function() {
		location.href = "index.html?comment=1&vote_id="+vote_id+"&openid"+openid;
	});
})
