$(function() {
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	// ajax的后台地址
	var _callAjax = _genCallAjax(ajaxRootURL + "/videos");
    // 上传图片ajax的后台地址
	var fileUploadURL = fileUploadVideoURL;
	
	var pageVideo = _pageBar([], ".videos", "#video-left", "#video-right", function(ids) {
		$("#videos-list").empty();
		_callAjax({
			"cmd":"getVideosByIds",
			"ids":ids.join("|")
		}, function(d) {
			//alert(JSON.stringify(d.data));
			updateVideos(d.data);
		})
	});
	
	var updateVideos = function(videos) {
		videos.forEach(function(r) {
			var str ='<tr><td>'+r.id+'</td><td class="font-bold text-left">'+r.title+'</td><td>'+r.commentCount+'</td><td><div class="dropdown"><a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"><span class="button-content"><i class="glyph-icon font-size-11 icon-cog"></i><i class="glyph-icon font-size-11 icon-chevron-down"></i></span></a><ul class="dropdown-menu float-right"><li><a href="javascript:;" title=""  id="video-notice"><i class="glyph-icon icon-eye-open mrg5R"></i> 查看公告</a></li><li><a href="javascript:;" title="" id="searchcomment"><i class="glyph-icon icon-eye-open mrg5R"></i> 查看评论</a></li><li><a href="javascript:;" title="" id="addIps"><i class="glyph-icon icon-eye-open mrg5R"></i> 添加访问量</a></li><li class="divider"></li><li><a href="javascript:;" class="font-red" title=""><i class="glyph-icon icon-remove mrg5R"></i> 删除</a></li></ul></div></td></tr>';
			//var str = '<tr><td>'+r.id+'</td><td class="font-bold text-left">'+r.title+'</td><td> <div class="label bg-orange">+'+r.commentCount+'</div> </td> <td> <div class="dropdown"> <a href="javascript:;" title="" class="btn medium bg-blue" data-toggle="dropdown"> <span class="button-content"> <i class="glyph-icon font-size-11 icon-cog"></i> <i class="glyph-icon font-size-11 icon-chevron-down"></i></span> </a> <ul class="dropdown-menu float-right"> <li> <a href="javascript:;" title=""> <i class="glyph-icon icon-edit mrg5R"></i> 查看该热点下的事件 </a> </li> <li class="divider"></li> <li> <a href="javascript:;" class="font-red" title=""> <i class="glyph-icon icon-remove mrg5R"></i> 删除 </a> </li> </ul> </div> </td> </tr>';
			var e = $(str).appendTo("#videos-list");
			
			e.find("#addIps").click(function() {
				layer.prompt({title: '请输入添加访问量数目', formType: 2,value:''}, function(text){
					if (text=="") _toast.show("公告不能为空");
					if(_isNumber(text)){
						_callAjax({
							"cmd":"addClicks",
							"video_id": r.id,
							"add_clicks":text.replace(/\n/g, "|")
						}, function(d) {
							if (!d.success) layer.msg('提交失败');
							layer.msg('添加访问量成功');
						})
					}else{
						layer.msg('请输入数字！');
					}
				});
			});
			e.find("#searchcomment").click(function() {
				location.href = "video-comment.html?video_id="+r.id+"&user_id="+user_id+"&privilege="+privilege;
			});
			e.find("a:has(.icon-remove)").click(function() {
				_toast.confirm("确定删除吗？",function(index){
					if(index){
						_callAjax({
							"cmd":"removeVideo",
							"id": r.id
						}, function(d) {
							if (!d.success) return _toast.show("删除直播失败");
							var pageIds = pageVideo.pages();
							pageIds.splice(pageIds.indexOf(r.id),1);
							pageVideo.renew(pageIds);
						})
					}
				});
				
			});
			e.find("#video-notice").on('click',function(){
				_callAjax({
					"cmd":"getAnnouncements",
					"video_id": r.id
				}, function(d) {
					var announcement="";
					if (!d.success){
						announcement="";
					}else if(d.data.announcement.substring(0,6)=="<html>"){
						announcement=d.data.announcement.substring(6,(d.data.announcement.length-7)).split("|").join('\n');
					}else{
						announcement=d.data.announcement.split("|").join('\n');
					}
					layer.prompt({title: '公告(请输入公告内容，换行为下一条)', formType: 2,value:announcement}, function(text){
						//alert(text.replace(/\n/g, "|"));
						if (text=="") _toast.show("公告不能为空");
						_callAjax({
							"cmd":"modifyAnnouncements",
							"video_id": r.id,
							"announcement":"<html>"+text.replace(/\n/g, "|")+"</html>"
						}, function(d) {
							if (!d.success) layer.msg('提交失败');
							var pageIds = pageVideo.pages();
							pageVideo.renew(pageIds);
							layer.msg('提交成功');
							//location.href = "video.html?user_id="+user_id+"&privilege="+privilege;
						})
					});
				})
		    })
	    });
	};
	$("#append-video").click(function() {
		var title = $("#title").val().replace(/\s/g, "");
		var introduction = $("#introduction").val().replace(/\s/g, "");
		var videostream = $("#videostream").val().replace(/\s/g, "");
		if (title == '') return _toast.show("请填写标题");
		if (introduction == '') return _toast.show("请填写直播简介");
		if (videostream == '') return _toast.show("请填写直播流");
		if (!_checkImgType(introduction)) 
			return _toast.show("图片格式只能是.gif,jpeg,jpg,png中的一种");

		// 上传图片的表单
		var uploadForm = jq("#new-video");
		//alert(JSON.stringify(uploadForm));
		var formfiles = "";
		uploadForm.find("input[type='file']").each(function(i,r) {
			// 需要上传文件 真实文件名
			if("" != r.value) {
				formfiles = formfiles + ',' + r.name;
			// 不需要上传文件 设置为null字符串
			} else {
				formfiles = formfiles + ',' + "null";
			}
		});
		// input type=file标签中的name组成的字符串
		formfiles = formfiles.substring(1);
		// 上传图片
		uploadForm.ajaxSubmit({
			"url": fileUploadURL,
			"type": "post",
			"dataType": "json",
			"data": {
				formfile: formfiles
			},
			"success": function(d) {
				if(!d.success) {
					return _toast.show("上传图片失败，请重试");
				}
				var filenames = d.data;
				// 新增热点项目ajax
				_callAjax({
					"cmd":"newVideo",
					"title":title,
					"introduction":filenames[0],
					"videostream": videostream
				}, function(d){
					if (d.success) {
						// 清空表单
						uploadForm.clearForm();
						_callAjax({
							"cmd":"getVideosIds"
						}, function(d){
							pageVideo.renew(d.data, 1);
						});
					}
				});
			}
		});
	});
	
	
	_callAjax({
		"cmd":"getVideosIds"
	}, function(d){
		pageVideo.renew(d.data, 1);
	});
});