package switcher

import (
	"net/http"
	"os"
	"log"
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
	
	// 热点模块图片url
	HOTS_IMG_URL = "http://127.0.0.1:11001/images/hots/"
	
	// 程序端口号
	SERVER_PORT = ":11002"
)

// 公共函数部分
// file operate
// 移动/重命名文件
func moveFile(imgRoot, subfold, filename, newfilename,subId string) error {
	oldPath := imgRoot + "/" + filename
	newPath := imgRoot + subfold + subId + "/" + newfilename
	log.Println(oldPath)
	log.Println(newPath)
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