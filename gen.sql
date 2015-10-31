create table if not exists hots (
	id integer primary key,
	title text not null,
	description text,
	logdate datetime default (datetime('now', 'localtime'))
);

create table if not exists events (
	id integer primary key,
	title text not null,
	status text default '',
	content	text default '',
	logdate datetime default (datetime('now', 'localtime')),
	hot_id integer references hots(id)
);

create table if not exists comments (
	id integer primary key,
	name text not null,
	img text default 'assets/images/gravatar.gif',
	content text,
	logdate datetime default (datetime('now', 'localtime')),
	event_id integer references events(id)
);

create table if not exists clicks (
	ip text,
	logdate datetime default (datetime('now', 'localtime')),
	hot_id text
);

/*
insert into hots(title) values ("测试热点");
insert into events(title,status,content,hot_id) values('测试2','进行中','测试内容',1);
insert into comments(name,img,content,event_id) values('测试name2','gravatar.gif','测试comment', 2);
insert into events(title,status,content,hot_id) values('测试2','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试3','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试4','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试5','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试6','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试7','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试8','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试9','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试10','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试11','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试12','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试13','进行中','测试内容',1);
insert into events(title,status,content,hot_id) values('测试14','进行中','测试内容',1);

insert into comments(name,img,content,event_id) values('测试name3','gravatar.gif','测试comment', 2);
insert into comments(name,img,content,event_id) values('测试name-new','gravatar.gif','测试comment', 101);


insert into comments(name,img,content,event_id) values('测试name-new2','gravatar.gif','测试comment', 101);

insert into events(title,status,content,hot_id) values('测试103','进行中','<img src="https://ss0.baidu.com/-Po3dSag_xI4khGko9WTAnF6hhy/super/whfpf%3D425%2C260%2C50/sign=f94cd4b828738bd4c474e171c7b6b3e4/bba1cd11728b47109aea56a9c5cec3fdfd032389.jpg" />',1);


create table if not exists zans (
	event_id integer primary key,
	user_id text
);

create table if not exists userinfo (
    id integer primary key,
    username text,
    password text,
    privilege text default '',
    log_at datetime default (datetime('now', 'localtime'))
);

insert into userinfo(username, password, privilege) values("admin", "Jh2044695", "hot");

*/
alter table events add column userid integer default 1;
