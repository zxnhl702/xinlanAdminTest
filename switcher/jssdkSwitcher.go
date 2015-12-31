/**
 * 微信js-sdk相关后台代码
 */
package switcher

import (
	"crypto/sha1"
	"database/sql"
	"encoding/hex"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// 前台需要的结构体
type WXConfig struct {
	Appid     string `json:"appid"`     // appid
	Timestamp int64  `json:"timestamp"` // 时间戳
	NonceStr  string `json:"nonceStr"`  // 生成签名用的随机字符串
	Signature string `json:"signature"` // 签名
	State     string `json:"state"`     // 重定向后用的参数
}

// 微信表中信息的结构体
type Wechat struct {
	Weixin      string `json:"weixin"`      // 微信公众号
	Appid       string `Json:"appid"`       // appid
	AccessToken string `json:"accessToken"` // access token
	JsapiTicket string `json:"jsapiTicket"` // jsapi ticket
}

func JssdkDispatch(db *sql.DB) Dlm {
	return Dlm{
		// 获得js-sdk信息
		"getConfig": func(r *http.Request) (string, interface{}) {
			url := GetParameter(r, "url")
//			url := "http://develop.zsgd.com:11002/votes/wechat/index.html?vote_id=11"
			state, weixin := getOauth2Info(strings.Split(url, "&")[0], db)
			stmt, err := db.Prepare("select weixin, appid, access_token, jsapi_ticket from weixin where weixin = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("获取js-sdk数据失败")
			}
			var w Wechat
			err = stmt.QueryRow(weixin).Scan(&w.Weixin, &w.Appid, &w.AccessToken, &w.JsapiTicket)
			if nil != err {
				log.Println(err)
				panic("获取js-sdk数据失败")
			}
			var wx WXConfig
			wx.State = state
			wx.Timestamp = time.Now().Unix()
			wx.Appid = w.Appid
			wx.NonceStr = string(GenerateRandomString(16, KC_RAND_KIND_ALL))
			wx.Signature = generateSign(wx.NonceStr, w.JsapiTicket, url, wx.Timestamp)
			return "获取js-sdk数据成功", wx
		},
	}
}

// 根据前台url获取微信页面授权url中的参数state与微信号
func getOauth2Info(url string, db *sql.DB) (string, string) {
//	[http://develop.zsgd.com:11002/votes/wechat vote_id=11]
	s := regexp.MustCompile(`/\w+\.\w+\?`).Split(url, 2)
	var state string
	var wechat string
	sql := "select key, weixin from project where url like '%" + s[0] + "%" + s[1] +"%'"
	err := db.QueryRow(sql).Scan(&state, &wechat)
	if nil != err {
		log.Println(err)
		panic("获取js-sdk信息失败")
	}
	if "" == wechat {
		wechat = "zsgd93"
	}
	log.Printf("%s, %s", state, wechat)
	return state, wechat
}

// 生成签名
func generateSign(noncestr, jsapi_ticket, url string, timestamp int64) string {
	string1 := "jsapi_ticket=" + jsapi_ticket +
		"&noncestr=" + noncestr +
		"&timestamp=" + strconv.FormatInt(timestamp, 10) +
		"&url=" + url
	s := sha1.New()
	s.Write([]byte(string1))
	return hex.EncodeToString(s.Sum(nil))
}
