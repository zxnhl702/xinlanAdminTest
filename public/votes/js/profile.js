/**
 * 手机投票-简介页面的javascript
 */
$(function() {
	 // 投票编号
	var vote_id = _getPar("vote_id");
	// 图片地址
	var img_url_root = "http://127.0.0.1:11001/images/votes/vote_" + vote_id + "/";
	
	// 头图
	var bannerImg = '<img src="'+img_url_root+'profile-img.jpg" width="100%" class="db"/>';
	$(bannerImg).appendTo(".main");
	// 底栏
	var footColumn = '<a href="index.html?vote_id=' + vote_id + '" class="g6"><i class="fa fa-home fa-2x"></i><br />首页</a>' + 
						'<a href="profile.html?vote_id=' + vote_id + '" class="orange"><i class="fa fa-info fa-2x"></i><br />简介</a>' + 
						'<a href="rank.html?vote_id=' + vote_id + '" class="g6"><i class="fa fa-signal fa-2x"></i><br />排行</a>' +
						'<a class="g6 comment"><i class="fa fa-comments-o fa-2x"></i><br />评论</a>';
	$(footColumn).appendTo(".footer-cloumn");
	
	$('.comment').bind("click", function() {
		location.href = "index.html?comment=1&vote_id="+vote_id;
	});
})