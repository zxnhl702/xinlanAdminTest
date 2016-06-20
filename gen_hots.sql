-- 热点用户信息表
drop table if exists userinfo;
create table if not exists userinfo (
	id integer not null primary key auto_increment,
	username text,
	password text,
	privilege varchar(255) default '',
	log_at datetime
);

-- 热点直播表
drop table if exists hots;
create table if not exists hots (
	id integer not null primary key auto_increment,
	title text,
	description text,
	logdate datetime,
	topImg varchar(255) default 'top_img.jpg'
);

-- 热点直播事件表
drop table if exists events;
create table if not exists events (
	id integer not null primary key auto_increment,
	title text not null,
	status varchar(255) default '',
	content text default '',
	logdate datetime,
	hot_id integer,
	userid integer default 0
);

-- 热点评论表
drop table if exists comments;
create table if not exists comments (
	id integer not null primary key auto_increment,
	name text not null,
	img varchar(255) default 'assets/images/gravatar.gif',
	content text,
	logdate datetime,
	event_id integer
);

-- 热点访问记录表
drop table if exists clicks;
create table if not exists clicks (
	ip text,
	logdate datetime,
	hot_id text
);

-- 热点点赞表
drop table if exists zans;
create table if not exists zans (
	event_id integer,
	user_id text
);
