package switcher

import (
	"database/sql"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"
)

// 常量部分
const (
	// 通用图片存放基准路径
	IMG_ROOT = "/home/zhangxiangnan/web-location/images"
	
	// 热点模块图片存放路径
	FILE_DIR = "/home/zhangxiangnan/web-location/images/hots"
	
	// 投票模块图片存放基准路径
	VOTE_IMG_ROOT = IMG_ROOT + "/votes"
	
	// 问答模块图片存放基准路径
	QUIZ_IMG_ROOT = IMG_ROOT + "/quiz"

	// 直播模块图片存放基准路径
	VIDEO_IMG_ROOT = IMG_ROOT + "/videos"

	// 热点模块图片url
	HOTS_IMG_URL = "http://127.0.0.1:11001/images/hots/"
	// 直播模块图片url
	VIDEOS_IMG_URL = "http://127.0.0.1:11001/images/videos/"
	// 程序端口号
	SERVER_PORT = ":11002"
	
	// JS-SDK 数据库路径
	JSSDK_DB_PATH = "/home/zhangxiangnan/Goproject/src/auth/middle.db"
	
	// mysql定义部分
	MYSQL_DRIVER = "mysql"
	MYSQL_USERNAME = "root"
	MYSQL_PASSWORD = "1988418"
	MYSQL_DATABASE = "xinlanAdmin"
	
	// 产生随机字符串用的常量
	// 需要产生的字符串类型
	// 纯数字
	KC_RAND_KIND_NUM   = 0
	// 小写字母
	KC_RAND_KIND_LOWER = 1
	// 大写字母
	KC_RAND_KIND_UPPER = 2
	// 数字、大小写字母
	KC_RAND_KIND_ALL   = 3
)

// 公共函数部分
// file operate
// 移动/重命名文件
func moveFile(imgRoot, subfold, filename, newfilename,subId string) error {
	oldPath := imgRoot + "/" + filename
	newPath := imgRoot + subfold + subId + "/" + newfilename
	log.Printf("old: %s|||new:%s", oldPath, newPath)
	return os.Rename(oldPath, newPath)
}

// 获取GET的参数
func GetParameter(r *http.Request, key string) string {
	s := r.URL.Query().Get(key)
	if s == "" {
		panic("没有参数" + key)
	}
	return s
}

// 产生随机字符串
func GenerateRandomString(size int, kind int) []byte {
	ikind, kinds, result := kind, [][]int{[]int{10, 48}, []int{26, 97}, []int{26, 65}}, make([]byte, size)
	is_all := kind > 2 || kind < 0
	rand.Seed(time.Now().UnixNano())
	for i :=0; i < size; i++ {
		if is_all { // random ikind
			ikind = rand.Intn(3)
		}
		scope, base := kinds[ikind][0], kinds[ikind][1]
		result[i] = uint8(base+rand.Intn(scope))
	}
	return result
}

// 打印并抛出异常
func perror(e error, errMsg string) {
	if e != nil {
		log.Println(e)
		panic(errMsg)
	}
}

// 打印并抛出异常
func perrorWithRollBack(e error, errMsg string, tx *sql.Tx) {
	if e != nil {
		tx.Rollback()
		log.Println(e)
		panic(errMsg)
	}
}