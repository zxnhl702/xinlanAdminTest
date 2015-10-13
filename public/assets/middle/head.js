var i = _get("xinlan_id");
if (i == "") i = 1;
$("#user-img").attr("src", "http://127.0.0.1:11001/images/xinlanUser/"+i+".jpg");

$("#logout").click(function() {
  _set("xinlan_privilege", "");
  location.href = "/login/index.html";
});
