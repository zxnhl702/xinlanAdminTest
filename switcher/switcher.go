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

type Dlm map[string]func(*http.Request) (string, interface{})
type Event struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	Status      string `json:"status"`
	Content     string `json:"content"`
	Logdate     string `json:"logdate"`
	UserId      string `json:"userid"`
	Username    string `json:"username"`
	Userimg     string `json:"userimg"`
	IsPublished int    `json:"isPublished"`
}
type Comment struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Img      string `json:"img"`
	Content  string `json:"content"`
	Logdate  string `json:"logdate"`
	Event_id int    `json:"event_id"`
}
type EventWithCommentsCount struct {
	Event
	CommentsCount int    `json:"commentsCount"`
	Hot_title     string `json:"hot_title"`
}
type EventWithCommentsCountAndZan struct {
	EventWithCommentsCount
	Zan int `json:"zan"`
}
type Hot struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Logdate     string `json:"logdate"`
	EventsCount int    `json:"eventsCount"`
}
type HotWithClicks struct {
	Hot
	ClicksCount int `json:"clicksCount"`
}
type User struct {
	Id        int    `json:"id"`
	Password  string `json:"password"`
	Privilege string `json:"privilege"`
}

// 弹幕用评论的结构体
type RandomComment struct {
	RowId   int    `json:"id"`
	Comment string `json:"comment"`
}
// 分享页面内容的结构体
type SharedContent struct {
	HotTitle   string `json:"hotTitle"`
	EventTitle string `json:"eventTitle"`
	Content    string `json:"content"`
}

func Dispatch(db *sql.DB) Dlm {
	return Dlm{

		"zan": func(r *http.Request) (string, interface{}) {
			var cnt int
			// 事件id
			event_id := GetParameter(r, "event_id")
			// 用户名
			user_id := GetParameter(r, "user_id")
			// 查重
			stmt, err := db.Prepare("select count(*) from zans where event_id= ? and user_id= ?")
			stmt.QueryRow(event_id, user_id).Scan(&cnt)
			defer stmt.Close()
			if err != nil {
				panic("插入赞失败")
			}
			if cnt > 0 {
				panic("不能重复插入赞")
			}
			
			stmt, _ = db.Prepare("insert into zans (event_id, user_id) values(?, ?)")
			_, err = stmt.Exec(event_id, user_id)
			defer stmt.Close()
			if err != nil {
				log.Println(err)
				panic("插入赞失败")
			}
			return "插入赞成功", nil
		},

		"authorize": func(r *http.Request) (string, interface{}) {
			return "登录成功", true
		},

		"getHotsIds": func(r *http.Request) (string, interface{}) {
			rows, err := db.Query("select id from hots order by id desc")
			if err != nil {
				panic("获取热点ids失败")
			}
			var ids []int
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			return "获取热点ids成功", ids
		},

		"getHotsByIds": func(r *http.Request) (string, interface{}) {
			var hs []Hot
			ids := GetParameter(r, "ids")
			for _, i := range strings.Split(ids, "|") {
				hs = append(hs, GetHotById(i, db))
			}
			return "按ids获取热点成功", hs
		},

		"getHotById": func(r *http.Request) (string, interface{}) {
			return "获取单条热点成功", GetHotById(GetParameter(r, "id"), db)
		},

		"getHotInfoById": func(r *http.Request) (string, interface{}) {
			hot_id := GetParameter(r, "hot_id")
			h := GetHotById(hot_id, db)
			var cnt int
			stmt, err := db.Prepare("select count(*) from clicks where hot_id = ?")
			stmt.QueryRow(hot_id).Scan(&cnt)
			defer stmt.Close()
//			err := db.QueryRow("select count(*) from clicks").Scan(&cnt)
			if err != nil {
				panic("获取点击量信息失败")
			}
			return "获取热点及点击量信息成功", HotWithClicks{h, cnt}
		},

		"getHotsInfo": func(r *http.Request) (string, interface{}) {
			var ids []int
			rows, err := db.Query("select id from hots order by logdate desc")
			if err != nil {
				log.Println(err)
				panic("查询热点失败")
			}
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}

			var hots []Hot
			for _, i := range ids {
				hots = append(hots, GetHotById(strconv.Itoa(i), db))
			}

			return "获取热点成功", hots
		},

		"newHot": func(r *http.Request) (string, interface{}) {
			// 热点标题
			title := GetParameter(r, "title")
			// 热点描述
			description := GetParameter(r, "description")
			// 热点头图
			topimg := GetParameter(r, "topimg")
			// 开始事务
			tx, err := db.Begin()
			// 异常情况下回滚
			perrorWithRollBack(err, "插入新热点失败", tx)
			// 插入新热点
			stmt, err := tx.Prepare("insert into hots(title, description, logdate) values (?, ?, now())")
			perrorWithRollBack(err, "插入新热点失败", tx)
			result, err := stmt.Exec(title, description)
			perrorWithRollBack(err, "插入新热点失败", tx)
			rowid, err := result.LastInsertId()
			perrorWithRollBack(err, "插入新热点失败", tx)
			// 重命名头图文件名
			filename := "top_img" + strconv.FormatInt(rowid, 10) + path.Ext(topimg)
			err = os.Rename(FILE_DIR + "/" + topimg, FILE_DIR + "/" + filename)
			perrorWithRollBack(err, "插入新热点失败", tx)
			// 更新新热点头图文件名
			stmt, err = tx.Prepare("update hots set topImg = ? where id = ?")
			perrorWithRollBack(err, "插入新热点失败", tx)
			_, err = stmt.Exec(filename, strconv.FormatInt(rowid, 10))
			perrorWithRollBack(err, "插入新热点失败", tx)
			// 提交事务
			tx.Commit()
			return "插入新热点成功", nil
		},
		
		"updateHotById": func(r *http.Request) (string, interface{}) {
			// 热点编号
			id := GetParameter(r, "id")
			// 热点标题
			title := GetParameter(r, "title")
			// 热点描述
			description := GetParameter(r, "description")
			// 热点头图
			topimg := GetParameter(r, "topimg")
			defer func() {
				err := recover()
				if nil != err {
					os.Remove(FILE_DIR + "/" + topimg)
					panic(err)
				}
			}()
			// 开始事务
			tx, err := db.Begin()
			// 异常情况下回滚
			perrorWithRollBack(err, "更新热点失败", tx)
			// 拼更新数据的sql语句
			var updateSql string
			if "null" != title && "null" != description {
				updateSql = "update hots set title = '" + title + "', description = '" + description + "' where id = ?"
			} else if "null" != title && "null" == description {
				updateSql = "update hots set title = '" + title + "' where id = ?"
			} else if "null" == title && "null" != description {
				updateSql = "update hots set description = '" + description + "' where id = ?"
			} else {
				updateSql = ""
			}
			if "" != updateSql {
				stmt, err := tx.Prepare(updateSql)
				defer stmt.Close()
				perrorWithRollBack(err, "更新热点失败", tx)
				_, err = stmt.Exec(id)
				perrorWithRollBack(err, "更新热点失败", tx)
			}
			if "null" != topimg {
				// 重命名头图文件名
				filename := "top_img" + id + path.Ext(topimg)
				err = os.Rename(FILE_DIR + "/" + topimg, FILE_DIR + "/" + filename)
				perrorWithRollBack(err, "插入新热点失败", tx)
			}
			// 提交事务
			tx.Commit()
			return "更新热点成功", nil
		},

		"removeHot": func(r *http.Request) (string, interface{}) {
			stmt, _ := db.Prepare("delete from hots where id = ?")
			stmt.Exec(GetParameter(r, "id"))
			return "删除新热点成功", nil
		},

		"getEventsInfo": func(r *http.Request) (string, interface{}) {
			var (
				hotId     = GetParameter(r, "hot_id")
				logBefore = GetParameter(r, "log_before")
			)
			if logBefore == "" {
				logBefore = tommorrow()
			}

			eventsIds := GetEventsIds(hotId, db)
			var (
				es     []EventWithCommentsCountAndZan
				end    = 5
				idsLen = len(eventsIds)
			)
			if end > idsLen {
				end = idsLen
			}
			// log.Println(eventsIds[:end])
			for _, i := range (eventsIds)[:end] {
				// log.Println(strconv.Itoa(i))
				es = append(es, GetEventById(strconv.Itoa(i), db))
			}

			return "获取热点信息成功", map[string]interface{}{
				"eventsIds": eventsIds, // 所有的ids
				"events":    es,        // 前五个
			}
		},

		// 分享页获取单条事件
		"getSharedEventById": func(r *http.Request) (string, interface{}) {
			hot_id:= GetParameter(r, "hot_id")
			event_id := GetParameter(r, "event_id")
			return "获取单条事件成功", GetSharedEventById(hot_id, event_id, db)
		},
		
		"getEventById": func(r *http.Request) (string, interface{}) {
			return "获取单条事件成功", GetEventById(GetParameter(r, "id"), db)
		},

		"getEventsIds": func(r *http.Request) (string, interface{}) {
			return "获取事件ids成功", GetEventsIds(GetParameter(r, "hot_id"), db)
		},

		"getEventsByHot": func(r *http.Request) (string, interface{}) {
			var (
				hotId     = GetParameter(r, "hot_id")
				logBefore = GetParameter(r, "log_before")
			)
			if logBefore == "" {
				logBefore = tommorrow()
			}

			events, ids := GetEventsbyHot(hotId, logBefore, db)

			var comments [][]Comment
			for _, i := range ids {
				comments = append(comments, GetCommentsByEvent(string(i), logBefore, db))
			}

			return "热点事件读取成功", map[string]interface{}{
				"events":   events,
				"comments": comments,
			}
		},

		"getComments": func(r *http.Request) (string, interface{}) {
			eventId := GetParameter(r, "event_id")
			logBefore := GetParameter(r, "log_before")
			return "获取评论成功", GetCommentsByEvent(eventId, logBefore, db)
		},

		"newEvent": func(r *http.Request) (string, interface{}) {
			title := GetParameter(r, "title")
			status := ""//GetParameter(r, "status")
			content := GetParameter(r, "content")
			hotId := GetParameter(r, "hot_id")
			userid := GetParameter(r, "userid")
			NewEvent(title, status, content, hotId, userid, db)
			return "事件添加成功", nil
		},
		
		"newEventFromHTML": func(r *http.Request) (string, interface{}) {
			// 插入sql
			insertsql := `insert into events(title,status,content,hot_id,userid, logdate, username, userimg, isPublished) 
		values (?,' ',?,?,?, now(), ?, ?, 0)`
			title := " "//GetParameter(r, "title")
			content := GetParameter(r, "content")
			hotId := GetParameter(r, "hot_id")
			userid := GetParameter(r, "userid")
			username := GetParameter(r, "username")
			userimg := GetParameter(r, "userimg")
			// 开始事务
			tx, err := db.Begin()
			// 异常情况下回滚
			perrorWithRollBack(err, "发布失败", tx)
			_, err =  tx.Exec(insertsql, title, content, hotId, userid, username, userimg)
			perrorWithRollBack(err, "发布失败", tx)
			tx.Commit()
			return "发布成功", nil
		},

		"deleteEvent": func(r *http.Request) (string, interface{}) {
			stmt, _ := db.Prepare("delete from events where id = ?")
			_, err := stmt.Exec(GetParameter(r, "id"))
			if err != nil {
				panic("删除事件失败")
			}
			return "删除事件成功", nil
		},

		"updateEvent": func(r *http.Request) (string, interface{}) {
			id := GetParameter(r, "id")
			title := GetParameter(r, "title")
			status := ""//GetParameter(r, "status")
			content := GetParameter(r, "content")
			UpdateEvent(id, title, status, content, db)
			return "事件更新成功", nil
		},

		"newComment": func(r *http.Request) (string, interface{}) {
			name := GetParameter(r, "name")
			img := GetParameter(r, "img")
			content := GetParameter(r, "content")
			eventId := GetParameter(r, "event_id")
			NewComment(name, img, content, eventId, db)
			return "评论添加成功", GetEventById(eventId, db)
		},

		"deleteComment": func(r *http.Request) (string, interface{}) {
			id := GetParameter(r, "id")
			DeleteComment(id, db)
			return "删除评论成功", nil
		},

		"getEventsByIds": func(r *http.Request) (string, interface{}) {
			var es []EventWithCommentsCountAndZan
			for _, i := range strings.Split(GetParameter(r, "ids"), "|") {
				es = append(es, GetEventById(i, db))
			}
			return "按ids获取事件成功", es
		},

		"getCommentsIds": func(r *http.Request) (string, interface{}) {
			return "获取评论条数成功", GetCommentsIds(GetParameter(r, "event_id"), db)
		},

		"getCommentsByIds": func(r *http.Request) (string, interface{}) {
			var cs []Comment
			for _, i := range strings.Split(GetParameter(r, "ids"), "|") {
				cs = append(cs, GetCommentById(i, db))
			}
			return "按ids取评论成功", cs
		},

		// 获取随机评论给弹幕
		"getRandomComments": func(r *http.Request) (string, interface{}) {
			hot_id := GetParameter(r, "hot_id")
			limit := GetParameter(r, "limit")
			//			log.Println("getRandomComments start", hot_id, limit)
			var rc []RandomComment
			rows, err := db.Query("select c.rowid, c.content from comments c, events e where e.id=c.event_id and e.hot_id = ? order by rand() limit ?", hot_id, limit)
			if err != nil {
				panic("获取随机评论失败")
			}
			for rows.Next() {
				var c RandomComment
				rows.Scan(&c.RowId, &c.Comment)
				rc = append(rc, c)
			}
			return "获取随机评论成功", rc
		},

		"getTop5Events": func(r *http.Request) (string, interface{}) {
			// 检索sql
			selectSql := `select id from events where hot_id = ? and id < ? and isPublished = true order by id desc limit 5`
			var (
				es  []EventWithCommentsCountAndZan
				ids []int
			)
			rows, err := db.Query(selectSql, GetParameter(r, "hot_id"), GetParameter(r, "from"))
			if err != nil {
				panic("查询前五个事件id失败")
			}
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			for _, i := range ids {
				es = append(es, GetEventById(strconv.Itoa(i), db))
			}
			return "获取前五个事件成功", es
		},

		"getTop5Comments": func(r *http.Request) (string, interface{}) {
			var (
				cs  []Comment
				ids []int
			)
			rows, err := db.Query("select id from comments where event_id = ? and id < ? order by id desc limit 5", GetParameter(r, "event_id"), GetParameter(r, "from"))
			if err != nil {
				panic("查询前五个评论id失败")
			}
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			for _, i := range ids {
				cs = append(cs, GetCommentById(strconv.Itoa(i), db))
			}
			return "获取前五个评论成功", cs
		},

		"login": func(r *http.Request) (string, interface{}) {
			// log.Println("rth")
			var u User
			err := db.QueryRow("select id, password, privilege from userinfo where username = ?", GetParameter(r, "username")).Scan(&u.Id, &u.Password, &u.Privilege)
			if err != nil {
				log.Println("rth1")
				panic("没有该用户")
			}
			if u.Password == GetParameter(r, "password") {
				log.Println(u.Privilege)
				return "验证成功", u
			} else {
				log.Println("rth3")
				return "验证失败", "none"
			}
		},
		
		// 获取分享页数据
		"getSharedContent": func(r *http.Request) (string, interface{}) {
			hot_id := GetParameter(r, "hot_id")
			event_id := GetParameter(r, "event_id")
			var sc SharedContent
			err := db.QueryRow("select h.title as hot_title, e.title as event_title, e.content from events e, hots h where h.id = ? and e.id = ? and h.id = e.hot_id", hot_id, event_id).Scan(&sc.HotTitle, &sc.EventTitle, &sc.Content)
			if nil != err {
				log.Println(err)
				panic("获取分享页失败")
			}
			return "获取分享页成功", sc
		},
		
		// 获取本次热点直播的评论
		"getHotComments": func(r *http.Request) (string, interface{}) {
			// 检索sql
			selectSql := `select c.id, c.name, c.img, c.content, 
				date_format(c.logdate, '%Y-%m-%d %H:%i:%s'), c.event_id 
				from comments c, events e 
				where c.id > ? and c.event_id = e.id and e.hot_id = ? order by c.id limit ?`
			hot_id := GetParameter(r, "hot_id")
			from := GetParameter(r, "from")
			limit := GetParameter(r, "limit")
			var cList []Comment
			rows, err := db.Query(selectSql, from, hot_id, limit)
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获取本次热点直播评论失败")
			}
			for rows.Next() {
				var c Comment
				rows.Scan(&c.Id, &c.Name, &c.Img, &c.Content, &c.Logdate, &c.Event_id)
				cList = append(cList, c)
			}
			return "获取本次热点直播评论成功", cList
		},
		
		// 获取本条事件全部评论
		"getEventComments": func(r *http.Request) (string, interface{}) {
			var (
				cs  []Comment
				ids []int
			)
			rows, err := db.Query("select id from comments where event_id = ? and id < ? order by id desc", GetParameter(r, "event_id"), GetParameter(r, "from"))
			if err != nil {
				panic("获取本条事件全部评论id失败")
			}
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			for _, i := range ids {
				cs = append(cs, GetCommentById(strconv.Itoa(i), db))
			}
			return "获取本条事件全部评论成功", cs
		},
		
		// 发布/撤回事件
		"changeEventIsPublished": func(r *http.Request) (string, interface{}) {
			// 更新sql
			updateSql := `update events set isPublished = ? where id = ?`
			// 事件编号
			eventId  := GetParameter(r, "event_id")
			// 发布状态修改到
			changeTo := GetParameter(r, "changeTo")
			_, err := db.Exec(updateSql, changeTo, eventId)
			if err != nil {
				panic("修改发布状态失败")
			}
			return "修改发布状态成功", true
		},
	}
}

func today() string {
	return time.Now().Format("2006-01-02")
}

func tommorrow() string {
	return time.Unix(time.Now().Unix()+86400, 0).Format("2006-01-02")
}

func GetEventsbyHot(hotId string, logBefore string, db *sql.DB) ([]Event, []int) {
	rows, err := db.Query("select id, title, status, content, date_format(logdate, '%Y-%m-%d %H:%i:%s'), userid from events where hot_id = ? and logdate < ? order by id desc limit 5", hotId, logBefore)
	if err != nil {
		panic("events没有数据")
	}

	var (
		events []Event
		ids    []int
	)
	for rows.Next() {
		var e Event
		err = rows.Scan(&e.Id, &e.Title, &e.Status, &e.Content, &e.Logdate, &e.UserId)
		log.Println(e) // log
		if err != nil {
			panic("events行读取失败")
		}
		ids = append(ids, e.Id)
		events = append(events, e)
	}
	return events, ids
}

func GetCommentsIds(eventId string, db *sql.DB) []int {
	var (
		id  int
		ids []int
	)
	rows, err := db.Query("select id from comments where event_id = ? order by id desc", eventId)
	if err != nil {
		panic("查询评论条数失败")
	}
	for rows.Next() {
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}

func GetCommentsByEvent(eventId string, logdate string, db *sql.DB) []Comment {
	rows, err := db.Query("select id, name, img, content,date_format(logdate, '%Y-%m-%d %H:%i:%s'),event_id from comments where event_id = ? and logdate < ? order by id desc limit 5", eventId, logdate)
	if err != nil {
		panic("comments读取失败")
	}

	var commts []Comment
	for rows.Next() {
		var c Comment
		err = rows.Scan(&c.Id, &c.Name, &c.Img, &c.Content, &c.Logdate, &c.Event_id)
		log.Println(c) // log
		if err != nil {
			panic("comments行读取失败")
		}
		commts = append(commts, c)
	}

	return commts
}

func NewEvent(title string, status string, content string, hotId string, userid string, db *sql.DB) {
	var username string
	var userimg string
	if "1" == userid || "2" == userid {
		username = "无限舟山"
		userimg = "http://develop.wifizs.cn:11001/images/xinlanUser/1.jpg"
	} else {
		username = "前方记者"
		userimg = "http://develop.wifizs.cn:11001/images/xinlanUser/2.jpg"
	}
	// 插入sql
	insertSql := `insert into events(title,status,content,hot_id,userid, logdate, username, userimg, isPublished) 
		values (?,?,?,?,?, now(), ?, ?, 1)`
	stmt, err := db.Prepare(insertSql)
	if err != nil {
		panic("event插入准备失败")
	}
	_, err = stmt.Exec(title, status, content, hotId, userid, username, userimg)
	if err != nil {
		panic("event插入失败！")
	}
}

func NewComment(name string, img string, content string, eventId string, db *sql.DB) {
	log.Print(name+" ", img+" ", content+" ", eventId)
	stmt, err := db.Prepare("insert into comments(name,img,content,event_id, logdate) values(?,?,?,?, now())")
	if err != nil {
		panic("comment插入准备失败！")
	}
	_, err = stmt.Exec(name, img, content, eventId)
	if err != nil {
		panic("comment插入失败！")
	}
}

func UpdateEvent(id string, title string, status string, content string, db *sql.DB) {
	stmt, err := db.Prepare("update events set title=?,status=?,content=? where id=?")
	if err != nil {
		panic("event更新准备失败")
	}
	_, err = stmt.Exec(title, status, content, id)
	if err != nil {
		panic("event更新失败！")
	}
}

func DeleteComment(id string, db *sql.DB) {
	stmt, err := db.Prepare("delete from comments where id = ?")
	if err != nil {
		panic("comment删除准备失败")
	}
	_, err = stmt.Exec(id)
	if err != nil {
		panic("comment删除失败！")
	}
}

/* Deprecated
func GetCommentsCount(eventId int, db *sql.DB) int {
	var cnt int
	rows, err := db.Query("select count(*) from comments where event_id = ?", eventId)
	if err != nil {
		panic("查询评论条数失败")
	}
	for rows.Next() {
		rows.Scan(&cnt)
	}
	return cnt
}
*/

func GetEventsIds(hotId string, db *sql.DB) []int {
	var ids []int
	var id int
	rows, err := db.Query("select id from events where hot_id = ? order by id desc", hotId)
	if err != nil {
		panic("无法读取事件数量")
	}
	for rows.Next() {
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}

func GetEventById(id string, db *sql.DB) EventWithCommentsCountAndZan {
	log.Println(id)
	// 检索sql
	selectSql := `select e.id, e.title, e.status, e.content, 
		date_format(e.logdate, '%Y-%m-%d %H:%i:%s'), e.userid, h.title, e.username, e.userimg, e.isPublished 
		from events e , hots h where e.id = ? and e.hot_id = h.id`
	var e EventWithCommentsCountAndZan
	err := db.QueryRow(selectSql, id).
		Scan(&e.Id, &e.Title, &e.Status, &e.Content, &e.Logdate, &e.UserId, &e.Hot_title, &e.Username, &e.Userimg, &e.IsPublished)
	if err != nil {
		log.Println(err)
		panic("读取单条事件失败")
	}
	err = db.QueryRow("select count(*) from comments where event_id = ?", id).Scan(&e.CommentsCount)
	err = db.QueryRow("select count(*) from zans where event_id = ?", id).Scan(&e.Zan)
	log.Println(e)
	return e
}

// 分享页获取单条事件
func GetSharedEventById(hot_id, event_id string, db *sql.DB) []Event {
	log.Println(hot_id, event_id)
	// 检索sql
	selectSql := `select e.id, e.title, e.status, e.content, date_format(e.logdate, '%Y-%m-%d %H:%i:%s'), 
		e.userid, e.username, e.userimg 
		from events e where e.hot_id = ? and e.id = ?`
	var e Event
	var event[] Event
	err := db.QueryRow(selectSql, hot_id, event_id).
		Scan(&e.Id, &e.Title, &e.Status, &e.Content, &e.Logdate, &e.UserId, &e.Username, &e.Userimg)
	if err != nil {
		log.Println(err)
		panic("读取单条事件失败")
	}
	log.Println(e)
	event = append(event, e)
	return event
}

func GetCommentById(id string, db *sql.DB) Comment {
	var c Comment
	err := db.QueryRow("select c.id,c.name,c.img,c.content, date_format(c.logdate, '%Y-%m-%d %H:%i:%s'),c.event_id from comments c where id = ?", id).Scan(&c.Id, &c.Name, &c.Img, &c.Content, &c.Logdate, &c.Event_id)
	if err != nil {
		log.Println(err)
		panic("获取单条评论失败")
	}
	return c
}

func GetHotById(id string, db *sql.DB) Hot {
	var h Hot
//	log.Println("GetHotById --> "+id)
	err := db.QueryRow("select id, title, description, date_format(logdate, '%Y-%m-%d %H:%i:%s') from hots where id = ?", id).Scan(&h.Id, &h.Title, &h.Description, &h.Logdate)
	if err != nil {
		log.Println(err)
		panic("获取单条热点失败")
	}
	err = db.QueryRow("select count(*) from events where hot_id = ?", id).Scan(&h.EventsCount)
	if err != nil {
		log.Println(err)
		panic("获取单条热点失败")
	}
	return h
}
