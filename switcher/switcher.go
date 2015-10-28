package switcher

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Dlm map[string]func(*http.Request) (string, interface{})
type Event struct {
	Id      int    `json:"id"`
	Title   string `json:"title"`
	Status  string `json:"status"`
	Content string `json:"content"`
	Logdate string `json:"logdate"`
	UserId  int    `json:"userid"`
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
			stmt, _ := db.Prepare("insert into hots(title) values (?)")
			stmt.Exec(GetParameter(r, "title"))
			return "插入新热点成功", nil
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
		"GetSharedEventById": func(r *http.Request) (string, interface{}) {
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
			rows, err := db.Query("select c.rowid, c.content from comments c, events e where e.id=c.event_id and e.hot_id = ? order by random() limit ?", hot_id, limit)
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
			var (
				es  []EventWithCommentsCountAndZan
				ids []int
			)
			rows, err := db.Query("select id from events where hot_id = ? and id < ? order by id desc limit 5", GetParameter(r, "hot_id"), GetParameter(r, "from"))
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
	}
}

func GetParameter(r *http.Request, key string) string {
	s := r.URL.Query().Get(key)
	if s == "" {
		panic("没有参数" + key)
	}
	return s
}

func today() string {
	return time.Now().Format("2006-01-02")
}

func tommorrow() string {
	return time.Unix(time.Now().Unix()+86400, 0).Format("2006-01-02")
}

func GetEventsbyHot(hotId string, logBefore string, db *sql.DB) ([]Event, []int) {
	rows, err := db.Query("select id, title, status, content, strftime('%Y-%m-%d %H:%M:%S', logdate), userid from events where hot_id = ? and logdate < ? order by id desc limit 5", hotId, logBefore)
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
	rows, err := db.Query("select id, name, img, content,strftime('%Y-%m-%d, %H:%M:%S', logdate),event_id from comments where event_id = ? and logdate < ? order by id desc limit 5", eventId, logdate)
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
	stmt, err := db.Prepare("insert into events(title,status,content,hot_id,userid) values (?,?,?,?,?)")
	if err != nil {
		panic("event插入准备失败")
	}
	_, err = stmt.Exec(title, status, content, hotId, userid)
	if err != nil {
		panic("event插入失败！")
	}
}

func NewComment(name string, img string, content string, eventId string, db *sql.DB) {
	log.Print(name+" ", img+" ", content+" ", eventId)
	stmt, err := db.Prepare("insert into comments(name,img,content,event_id) values(?,?,?,?)")
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
	var e EventWithCommentsCountAndZan
	err := db.QueryRow("select e.id, e.title, e.status, e.content, strftime('%Y-%m-%d %H:%M:%S', e.logdate), e.userid, h.title from events e , hots h where e.id = ? and e.hot_id = h.id", id).Scan(&e.Id, &e.Title, &e.Status, &e.Content, &e.Logdate, &e.UserId, &e.Hot_title)
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
	var e Event
	var event[] Event
	err := db.QueryRow("select e.id, e.title, e.status, e.content, strftime('%Y-%m-%d %H:%M:%S', e.logdate), e.userid from events e where e.hot_id = ? and e.id = ?", hot_id, event_id).Scan(&e.Id, &e.Title, &e.Status, &e.Content, &e.Logdate, &e.UserId)
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
	err := db.QueryRow("select c.id,c.name,c.img,c.content,strftime('%Y-%m-%d %H:%M:%S',c.logdate),c.event_id from comments c where id = ?", id).Scan(&c.Id, &c.Name, &c.Img, &c.Content, &c.Logdate, &c.Event_id)
	if err != nil {
		log.Println(err)
		panic("获取单条评论失败")
	}
	return c
}

func GetHotById(id string, db *sql.DB) Hot {
	var h Hot
	// log.Println("GetHotById --> "+id)
	err := db.QueryRow("select id, title, strftime('%Y-%m-%d %H:%M:%S', logdate) from hots where id = ?", id).Scan(&h.Id, &h.Title, &h.Logdate)
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
