package switcher

import (
	"database/sql"
//	_ "github.com/mattn/go-sqlite3"
	_ "github.com/go-sql-driver/mysql"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"time"
)

type Video struct {
	Id           int    `json:"id"`
	Title        string `json:"title"`
	Introduction string `json:"introduction"`
	VideoStream  string `json:"videostream"`
	CommentCount int    `json:"commentCount"`
}
type VideoComment struct {
	Id        int    `json:"id"`
	Video_id  string `json:"videoid"`
	Comment   string `json:"comment"`
	Logdate   string `json:"logdate"`
	User_id   int    `json:"userid"`
	User_img  string `json:"userimg"`
	User_name string `json:"username"`
	IsChecked int    `json:"ischecked"`
}
type Announcement struct {
	Video_id     int    `json:"videoid"`
	Announcement string `json:"announcement"`
}
type Reply struct {
	Comment_id int    `json:"commentid"`
	Reply      string `json:"reply"`
}
type Program struct {
	Video_id int    `json:"videoid"`
	Program  string `json:"program"`
}

func VideoDispatch(db *sql.DB) Dlm {
	return Dlm{
		"addClicks": func(r *http.Request) (string, interface{}) {
			flag := false
			var videoid int64
			id, err2 := strconv.ParseInt(GetParameter(r, "video_id"), 10, 64)
			if err2 != nil {
				panic("数据转换失败")
			}
			rows, err := db.Query("select video_id from videos_addclicks")
			if err != nil {
				panic("无法读取id数量")
			}
			for rows.Next() {
				rows.Scan(&videoid)
				if videoid == id {
					flag = true
				}
			}

			if flag {
				stmt, err := db.Prepare("update videos_addclicks set add_clicks=? where video_id=?")
				if err != nil {
					panic("更新准备失败")
				}
				_, err = stmt.Exec(GetParameter(r, "add_clicks"), GetParameter(r, "video_id"))
				defer stmt.Close()
				if err != nil {
					panic("更新访问量失败！")
				}
			} else {
				stmt, err := db.Prepare("insert into videos_addclicks(video_id,add_clicks) values(?,?)")
				if err != nil {
					panic("插入准备失败")
				}
				_, err = stmt.Exec(GetParameter(r, "video_id"), GetParameter(r, "announcement"))
				defer stmt.Close()
				if err != nil {
					panic("插入访问量失败！")
				}
			}

			return "添加访问量成功", nil
		},
		"getVideoIpCount": func(r *http.Request) (string, interface{}) {
			var count int64
			var addCount int64
			err := db.QueryRow("select add_clicks from videos_addclicks where video_id=?", GetParameter(r, "video_id")).Scan(&addCount)
			if err != nil {
				panic("获取增加访问量失败")
			}
			err = db.QueryRow("select count(*) from videos_clicks where video_id=?", GetParameter(r, "video_id")).Scan(&count)
			if err != nil {
				panic("获取直播ip失败")
			}
			return "获取直播ip成功", addCount + count
		},
		"getVideosIds": func(r *http.Request) (string, interface{}) {
			rows, err := db.Query("select id from videos order by id desc")
			if err != nil {
				panic("获取直播ids失败")
			}
			var ids []int
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			log.Println(ids)
			return "获取直播ids成功", ids
		},

		"getVideosByIds": func(r *http.Request) (string, interface{}) {
			var vi []Video
			ids := GetParameter(r, "ids")
			VideoLogClient(r.RemoteAddr, ids, db)
			for _, i := range strings.Split(ids, "|") {
				vi = append(vi, GetVideoById(i, db))
			}
			return "按ids获取热点成功", vi
		},
		"addComment": func(r *http.Request) (string, interface{}) {
			stmt, err := db.Prepare("insert into videos_comments(video_id,comment,logdate,user_id,user_img,user_name) values(?,?,?,?,?,?)")
			if err != nil {
				log.Println(err)
				panic("插入评论失败")
			}
			_, err = stmt.Exec(GetParameter(r, "video_id"), GetParameter(r, "comment"), time.Now().Format("2006-01-02 15:04:05"), GetParameter(r, "user_id"), GetParameter(r, "user_img"), GetParameter(r, "user_name"))
			defer stmt.Close()
			if err != nil {
				log.Println(err)
				panic("插入评论失败")
			}
			return "添加评论成功", nil
		},
		"addCommentReply": func(r *http.Request) (string, interface{}) {
			stmt, err := db.Prepare("insert into videos_reply(comment_id,reply) values(?,?)")
			if err != nil {
				log.Println(err)
				panic("插入回复失败")
			}
			_, err = stmt.Exec(GetParameter(r, "comment_id"), GetParameter(r, "reply"))
			defer stmt.Close()
			if err != nil {
				log.Println(err)
				panic("插入回复失败")
			}
			return "添加回复成功", nil
		},
		"newVideo": func(r *http.Request) (string, interface{}) {
			title := GetParameter(r, "title")
			introduction := GetParameter(r, "introduction")
			videostream := GetParameter(r, "videostream")
			// 开始事务
			tx, err := db.Begin()
			// 异常情况下回滚
			perrorWithRollBack(err, "插入新热点失败", tx)
			// 插入新直播
			stmt, err := tx.Prepare("insert into videos(title, videostream) values (?, ?)")
			perrorWithRollBack(err, "插入新直播失败", tx)
			result, err := stmt.Exec(title, videostream)
			perrorWithRollBack(err, "插入新直播失败", tx)
			rowid, err := result.LastInsertId()
			perrorWithRollBack(err, "插入新直播失败", tx)
			// 重命名头图文件名
			filename := "video_img" + strconv.FormatInt(rowid, 10) + path.Ext(introduction)
			err = os.Rename(VIDEO_IMG_ROOT+"/"+introduction, VIDEO_IMG_ROOT+"/"+filename)
			perrorWithRollBack(err, "插入新热点失败", tx)
			// 更新头图文件名
			stmt, err = tx.Prepare("update videos set introduction = ? where id = ?")
			perrorWithRollBack(err, "插入新热点失败", tx)
			_, err = stmt.Exec(filename, strconv.FormatInt(rowid, 10))
			perrorWithRollBack(err, "插入新热点失败", tx)
			stmt, err = tx.Prepare("insert into videos_addclicks(video_id) values(?)")
			perrorWithRollBack(err, "插入点击失败", tx)
			_, err = stmt.Exec(rowid)
			perrorWithRollBack(err, "插入点击失败", tx)
			// 提交事务
			tx.Commit()
			return "插入新直播成功", nil
		},
		"removeVideo": func(r *http.Request) (string, interface{}) {
			stmt, _ := db.Prepare("delete from videos where id = ?")
			stmt.Exec(GetParameter(r, "id"))
			return "删除直播成功", nil
		},
		"getAllVideoCommentIds": func(r *http.Request) (string, interface{}) {
			return "获取全部评论ids成功", GetAllVideoCommentIds(GetParameter(r, "video_id"), db)
		},
		"getAllVideoCommentIdsCheck": func(r *http.Request) (string, interface{}) {
			return "获取全部评论ids成功", GetAllVideoCommentIdsCheck(GetParameter(r, "video_id"), db)
		},
		"getVideoCommentIds": func(r *http.Request) (string, interface{}) {
			return "获取评论ids成功", GetVideoCommentIds(GetParameter(r, "video_id"), db)
		},
		"getVideoCommentIdsCheck": func(r *http.Request) (string, interface{}) {
			return "获取评论ids成功", GetVideoCommentIdsCheck(GetParameter(r, "video_id"), db)
		},
		"getVideoCommentByIds": func(r *http.Request) (string, interface{}) {
			var cs []VideoComment
			for _, i := range strings.Split(GetParameter(r, "ids"), "|") {

				cs = append(cs, GetVideoCommentById(i, db))
			}
			return "按ids取评论成功", cs
		},
		"getVideoCommentByIdsChecked": func(r *http.Request) (string, interface{}) {
			var cs []VideoComment
			for _, i := range strings.Split(GetParameter(r, "ids"), "|") {
				cs = append(cs, GetVideoCommentByIdCheck(i, db))
			}
			return "按ids取评论成功", cs
		},
		"deleteVideoComment": func(r *http.Request) (string, interface{}) {
			stmt, _ := db.Prepare("delete from videos_comments where id = ?")
			_, err := stmt.Exec(GetParameter(r, "id"))
			if err != nil {
				panic("删除评论失败")
			}
			return "删除评论成功", nil
		},
		"getAnnouncements": func(r *http.Request) (string, interface{}) {
			var an Announcement
			err := db.QueryRow("select a.video_id,a.announcement from videos_announcement a where a.video_id = ?", GetParameter(r, "video_id")).Scan(&an.Video_id, &an.Announcement)
			if err != nil {
				log.Println(err)
				panic("获取单条公告失败")
			}
			return "获取公告成功", an
		},
		"getReplys": func(r *http.Request) (string, interface{}) {
			var re []Reply
			rows, err := db.Query("select comment_id,reply from videos_reply where comment_id=?", GetParameter(r, "comment_id"))
			if err != nil {
				log.Println(err)
				panic("获取单条公告失败")
			}
			for rows.Next() {
				var r Reply
				rows.Scan(&r.Comment_id, &r.Reply)
				re = append(re, r)
			}
			return "获取公告成功", re
		},
		"updataVideoComment": func(r *http.Request) (string, interface{}) {
			stmt, err := db.Prepare("update videos_comments set is_checked=1 where id=?")
			if err != nil {
				panic("更新准备失败")
			}
			_, err = stmt.Exec(GetParameter(r, "comment_id"))
			if err != nil {
				panic("更新评论失败！")
			}
			return "更新评论成功", nil
		},
		"modifyAnnouncements": func(r *http.Request) (string, interface{}) {
			flag := false
			var videoid int64
			id, err2 := strconv.ParseInt(GetParameter(r, "video_id"), 10, 64)
			if err2 != nil {
				panic("数据转换失败")
			}
			rows, err := db.Query("select video_id from videos_announcement")
			if err != nil {
				panic("无法读取id数量")
			}
			for rows.Next() {
				rows.Scan(&videoid)
				if videoid == id {
					flag = true
				}
			}

			if flag {
				stmt, err := db.Prepare("update videos_announcement set announcement=? where video_id=?")
				if err != nil {
					panic("更新准备失败")
				}
				_, err = stmt.Exec(GetParameter(r, "announcement"), GetParameter(r, "video_id"))
				if err != nil {
					panic("更新公告失败！")
				}
			} else {
				stmt, err := db.Prepare("insert into videos_announcement(video_id,announcement) values (?,?)")
				if err != nil {
					panic("插入准备失败")
				}
				_, err = stmt.Exec(GetParameter(r, "video_id"), GetParameter(r, "announcement"))
				if err != nil {
					panic("插入公告失败！")
				}
			}

			return "更新公告成功", nil
		},
		"getProgram": func(r *http.Request) (string, interface{}) {
			var p Program
			err := db.QueryRow("select video_id,program from videos_program where video_id=?", GetParameter(r, "video_id")).Scan(&p.Video_id, &p.Program)
			if err != nil {
				panic("更新准备失败")
			}
			return "获取节目成功", p
		},
		"addProgram": func(r *http.Request) (string, interface{}) {
			stmt, err := db.Prepare("insert into videos_program(video_id,program) values (?,?)")
			if err != nil {
				panic("插入准备失败")
			}
			_, err = stmt.Exec(GetParameter(r, "video_id"), GetParameter(r, "program"))
			if err != nil {
				panic("插入节目失败！")
			}
			return "添加节目成功", nil
		},
		"updateProgram": func(r *http.Request) (string, interface{}) {
			stmt, err := db.Prepare("update videos_program set program=? where video_id=?")
			if err != nil {
				panic("更新准备失败")
			}
			_, err = stmt.Exec(GetParameter(r, "program"), GetParameter(r, "video_id"))
			if err != nil {
				panic("更新节目失败！")
			}
			return "更新节目成功", nil
		},
	}
}

/*func AddAnnouncement(videoid int, announcement string, db *sql.DB) VideoComment {
	var an []Announcement
	stmt, err := db.Prepare("insert into videos_announcement(video_id,announcement) values (?,?)")
	if err != nil {
		panic("插入公告失败")
	}
	_, err = stmt.Exec(videoid, announcement)
	if err != nil {
		panic("插入公告失败！")
	}
}*/
func GetVideoCommentById(id string, db *sql.DB) VideoComment {
	var c VideoComment
	err := db.QueryRow("select c.id,c.video_id,c.comment,c.logdate,c.user_id,c.user_img,c.user_name,c.is_checked from videos_comments c where id = ?", id).Scan(&c.Id, &c.Video_id, &c.Comment, &c.Logdate, &c.User_id, &c.User_img, &c.User_name, &c.IsChecked)
	if err != nil {
		log.Println(err)
		panic("获取单条评论失败")
	}
	return c
}
func GetVideoCommentByIdCheck(id string, db *sql.DB) VideoComment {
	var c VideoComment
	err := db.QueryRow("select c.id,c.video_id,c.comment,c.logdate,c.user_id,c.user_img,c.user_name,c.is_checked from videos_comments c where id = ? and is_checked=1", id).Scan(&c.Id, &c.Video_id, &c.Comment, &c.Logdate, &c.User_id, &c.User_img, &c.User_name, &c.IsChecked)
	if err != nil {
		log.Println(err)
		panic("获取单条评论失败")
	}
	return c
}
func GetAllVideoCommentIds(videoId string, db *sql.DB) []int {
	var ids []int
	var id int
	rows, err := db.Query("select id from videos_comments where video_id = ? order by id desc", videoId)
	if err != nil {
		panic("无法读取事件数量")
	}
	for rows.Next() {
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}
func GetAllVideoCommentIdsCheck(videoId string, db *sql.DB) []int {
	var ids []int
	var id int
	rows, err := db.Query("select id from videos_comments where video_id = ? and is_checked=1 order by id desc", videoId)
	if err != nil {
		panic("无法读取事件数量")
	}
	for rows.Next() {
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}
func GetVideoCommentIds(videoId string, db *sql.DB) []int {
	var ids []int
	var id int
	rows, err := db.Query("select id from videos_comments where video_id = ? order by id desc limit 5", videoId)
	if err != nil {
		panic("无法读取事件数量")
	}
	for rows.Next() {
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}
func GetVideoCommentIdsCheck(videoId string, db *sql.DB) []int {
	var ids []int
	var id int
	rows, err := db.Query("select id from videos_comments where video_id = ? and is_checked=1 order by id desc limit 5", videoId)
	if err != nil {
		panic("无法读取事件数量")
	}
	for rows.Next() {
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}
func GetVideoById(id string, db *sql.DB) Video {
	var v Video
	//	log.Println("GetHotById --> "+id)
	err := db.QueryRow("select id, title, introduction, videostream from videos where id = ?", id).Scan(&v.Id, &v.Title, &v.Introduction, &v.VideoStream)
	if err != nil {
		log.Println(err)
		panic("获取单条直播失败")
	}
	err = db.QueryRow("select count(*) from videos_comments where video_id = ? and is_checked=1", id).Scan(&v.CommentCount)
	if err != nil {
		log.Println(err)
		panic("获取单条直播失败")
	}
	return v
}

func VideoLogClient(ip string, video_id string, db *sql.DB) {
	stmt, err := db.Prepare("insert into videos_clicks(ip, video_id) values(?,?)")
	if err != nil {
		panic(err)
	}
	stmt.Exec(ip, video_id)
	defer stmt.Close()
}
