-- 投票活动表
drop table if exists votes;
create table if not exists votes (
	id integer not null primary key auto_increment,
	title text not null,
	topImg text,
	profileImg text,
	logdate datetime,
	isOnline integer default 1,
	voteType integer default 0
);

-- 投票项目表
drop table if exists votes_candidate;
create table if not exists votes_candidate (
	id integer not null,
	vote_id integer not null,
	name text not null,
	work varchar(255) default ' ',
	img varchar(255) default ' ',
	thumb varchar(255) default '',
	isOnline integer default 1
);

-- 投票用户表
drop table if exists votes_app_user;
create table if not exists votes_app_user (
	device_token text,
	vote_id integer not null,
	if_voted integer default 0
);

-- 投票信息表
drop table if exists votes_info;
create table if not exists votes_info (
	vote_id integer not null,
	vote_for integer,
	vote_from text,
	vote_datetime datetime
);

-- 投票评论表
drop table if exists votes_comments;
create table if not exists votes_comments (
	id integer not null primary key auto_increment,
	vote_id integer not null,
	comment text,
	logdate datetime
);

-- 投票访问记录表
drop table if exists votes_clicks;
create table if not exists votes_clicks (
	ip text,
	logdate datetime,
	vote_id integer
);

-- 投票项目采番表
drop table if exists votes_seq;
create table if not exists votes_seq (
	vote_id integer not null,
	seq integer default 0
);
