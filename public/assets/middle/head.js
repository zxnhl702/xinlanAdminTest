var i = _get("xinlan_id");
if (i == "") i = 1;
$("#user-img").attr("src", "http://60.190.176.70:11001/images/xinlanUser/"+i+".jpg");

$("#logout").click(function() {
  _set("xinlan_privilege", "");
  location.href = "/login/index.html";
});
