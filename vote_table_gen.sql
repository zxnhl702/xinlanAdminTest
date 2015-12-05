drop table if exists votes;
create table if not exists votes (
	id integer primary key,
	title text not null,
	topImg text,
	profileImg text,
	logdate datetime default (datetime('now', 'localtime')),
	isOnline integer default 1,
	voteType integer default 0
);

drop table if exists votes_candidate;
create table if not exists votes_candidate (
	id integer not null,
	vote_id integer not null,
	name text not null,
	work text default " ",
	img text default " ",
	thumb text default " ",
	isOnline integer default 1
);

drop table if exists votes_app_user;
create table if not exists votes_app_user (
	device_token text primary key,
	vote_id integer not null,
	if_voted integer default 0
);

drop table if exists votes_info;
create table if not exists votes_info (
	vote_id integer not null,
	vote_for integer,
	vote_from text,
	vote_datetime default (datetime('now', 'localtime'))
);

drop table if exists votes_comments;
create table if not exists votes_comments (
	vote_id integer not null,
	comment text,
	logdate datetime default (datetime('now', 'localtime'))
);

drop table if exists votes_clicks;
create table if not exists votes_clicks (
	ip text,
	logdate datetime default (datetime('now', 'localtime')),
	vote_id integer
);

drop table if exists votes_seq;
create table if not exists votes_seq (
	vote_id integer not null,
	seq integer default 0
);
