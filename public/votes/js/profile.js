/**
 * 手机投票-简介页面的javascript
 */
$(function() {
	 // 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = "http://127.0.0.1:11001/images/votes/vote_" + vote_id + "/";
	
	// 头图
	var bannerImg = '<img src="'+img_url_root+'profile.jpg" width="100%" class="db"/>';
	$(bannerImg).appendTo(".main");
	// 底栏
	$("#goIndex").attr("href", "index.html?vote_id=" + vote_id);
	$("#goProfile").attr("href", "profile.html?vote_id=" + vote_id);
	$("#goRank").attr("href", "rank.html?vote_id=" + vote_id);
	
	$('.comment').bind("click", function() {
		location.href = "index.html?comment=1&vote_id="+vote_id;
	});
})