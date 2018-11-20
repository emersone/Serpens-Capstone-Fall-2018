

#Get all USERS (ADMINS + NON-ADMINS)
select * from users;

#Get all ADMINS
select * from users where isAdmin = 1;

#Get all NON-ADMINS
select * from users where isAdmin = 0;

#Get both awards & user-awards tables
select * from `awards` left join `user-awards` on awards.award_id = `user-awards`.award_id;



 #USERS USERS USERS
# Users who assigned most awards
select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as `count`
 from users as u left join (select user_id, count(award_id) as awardCount from `user-awards` group by user_id) as uac on u.user_id=uac.user_id
 left join `user-awards` as ua on ua.user_id=u.user_id
 left join awards as a on a.award_id=ua.award_id
 group by u.user_id
 order by `count` desc

 #User who assigned most BTP
 select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as `count`
 from users as u left join (select user_id, count(award_id) as awardCount from `user-awards` group by user_id) as uac on u.user_id=uac.user_id
 left join `user-awards` as ua on ua.user_id=u.user_id
 left join awards as a on a.award_id=ua.award_id
 where type="Best Team Player"
 group by u.user_id
 order by `count` desc

 #User who assigned most EOTM
 select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as `count`
 from users as u left join (select user_id, count(award_id) as awardCount from `user-awards` group by user_id) as uac on u.user_id=uac.user_id
 left join `user-awards` as ua on ua.user_id=u.user_id
 left join awards as a on a.award_id=ua.award_id
 where type="Best Team Player"
 group by u.user_id
 order by `count` desc

#BRANCHES BRANCHES BRANCHES

#Branch that assigned most awards
select branch_id, name, city, state, region, sum(`count`) as total from
(select b.branch_id, b.name, b.city, b.state, b.region, ifNull(uac.awardCount, 0) as `count`
from branches as b
left join users as u on b.branch_id=u.branch_id
left join (select user_id, count(award_id) as awardCount from `user-awards` group by user_id) as uac on uac.user_id= u.user_id) as b
group by branch_id;

#Get number of employee of the month by branch
select b.branch_id, b.name, b.city, b.state, b.region, ifNull(sum(count), 0) as number from
branches as b left join
(select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as `count`
 from users as u left join (select user_id, count(award_id) as awardCount from `user-awards` group by user_id) as uac on u.user_id=uac.user_id
 left join `user-awards` as ua on ua.user_id=u.user_id
 left join awards as a on a.award_id=ua.award_id
 where u.isAdmin!=1 AND a.type="Employee of the Month"
 group by u.user_id, u.branch_id
 order by `count` desc) as ac
 on b.branch_id=ac.branch_id
group by branch_id

#get most awards by region
select b.region, ifNull(sum(count), 0) as number from
branches as b left join
(select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as `count`
 from users as u left join (select user_id, count(award_id) as awardCount from `user-awards` group by user_id) as uac on u.user_id=uac.user_id
 left join `user-awards` as ua on ua.user_id=u.user_id
 left join awards as a on a.award_id=ua.award_id
 where u.isAdmin!=1 AND a.type="Employee of the Month"
 group by u.user_id, u.branch_id
 order by `count` desc) as ac
 on b.branch_id=ac.branch_id
group by b.region
order by number desc


select branch_id, name, city, state, region,
