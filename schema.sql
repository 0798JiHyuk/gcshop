create table if not exists person (
  loginid varchar(10) not null comment 'customer id',
  password varchar(20) not null comment 'password',
  name varchar(20) not null comment 'customer name',
  mf varchar(1) comment 'gender',
  address varchar(100) comment 'address',
  tel varchar(13) comment 'telephone',
  birth varchar(8) not null comment 'birth date',
  class varchar(3) not null comment 'member class',
  primary key (loginid)
) comment='customer information';

create table if not exists code (
  main_id varchar(4) not null comment 'main category id',
  sub_id varchar(4) not null comment 'sub category id',
  main_name varchar(100) not null comment 'main category name',
  sub_name varchar(100) not null comment 'sub category name',
  start varchar(8) not null comment 'start date',
  end varchar(8) not null comment 'end date',
  primary key (main_id, sub_id, start)
) comment='category code';

create table if not exists product (
  prod_id int not null auto_increment comment 'product id',
  main_id varchar(4) not null comment 'main category id',
  sub_id varchar(4) not null comment 'sub category id',
  name varchar(100) not null comment 'product name',
  price int not null comment 'price',
  stock int not null comment 'stock',
  brand varchar(50) not null comment 'brand',
  supplier varchar(50) not null comment 'supplier',
  image varchar(50) comment 'product image',
  primary key (prod_id)
) comment='product information';

create table if not exists boardtype (
  type_id int not null auto_increment comment 'board type id',
  title varchar(200) not null comment 'board title',
  description varchar(400) comment 'board description',
  write_YN varchar(1) not null comment 'customer write permission',
  re_YN varchar(1) not null comment 'manager reply permission',
  numPerPage int comment 'rows per page',
  primary key (type_id)
) comment='board type';

create table if not exists board (
  type_id int comment 'board type id',
  board_id int not null auto_increment comment 'board id',
  p_id int comment 'parent board id',
  loginid varchar(10) not null comment 'writer id',
  password varchar(20) comment 'post password',
  title varchar(200) not null comment 'title',
  date varchar(50) comment 'write date',
  content text comment 'content',
  primary key (board_id)
) comment='board post';

create table if not exists purchase (
  purchase_id int not null auto_increment comment 'purchase id',
  loginid varchar(10) not null comment 'customer id',
  prod_id int comment 'product id',
  date varchar(30) not null comment 'purchase date',
  price int comment 'price',
  point int comment 'point',
  qty int comment 'quantity',
  total int comment 'total',
  payYN varchar(1) not null default 'N' comment 'payment status',
  cancel varchar(1) not null default 'N' comment 'cancel status',
  primary key (purchase_id)
) comment='purchase history';

create table if not exists cart (
  cart_id int not null auto_increment comment 'cart id',
  loginid varchar(10) not null comment 'customer id',
  prod_id int comment 'product id',
  date varchar(30) not null comment 'cart date',
  primary key (cart_id)
) comment='shopping cart';

alter table person comment='customer information';
alter table code comment='category code';
alter table product comment='product information';
alter table boardtype comment='board type';
alter table board comment='board post';
alter table purchase comment='purchase history';
alter table cart comment='shopping cart';

alter table person
  modify loginid varchar(10) not null comment 'customer id',
  modify password varchar(20) not null comment 'password',
  modify name varchar(20) not null comment 'customer name',
  modify mf varchar(1) comment 'gender',
  modify address varchar(100) comment 'address',
  modify tel varchar(13) comment 'telephone',
  modify birth varchar(8) not null comment 'birth date',
  modify class varchar(3) not null comment 'member class';

alter table code
  modify main_id varchar(4) not null comment 'main category id',
  modify sub_id varchar(4) not null comment 'sub category id',
  modify main_name varchar(100) not null comment 'main category name',
  modify sub_name varchar(100) not null comment 'sub category name',
  modify start varchar(8) not null comment 'start date',
  modify end varchar(8) not null comment 'end date';

alter table product
  modify prod_id int not null auto_increment comment 'product id',
  modify main_id varchar(4) not null comment 'main category id',
  modify sub_id varchar(4) not null comment 'sub category id',
  modify name varchar(100) not null comment 'product name',
  modify price int not null comment 'price',
  modify stock int not null comment 'stock',
  modify brand varchar(50) not null comment 'brand',
  modify supplier varchar(50) not null comment 'supplier',
  modify image varchar(50) comment 'product image';

alter table boardtype
  modify type_id int not null auto_increment comment 'board type id',
  modify title varchar(200) not null comment 'board title',
  modify description varchar(400) comment 'board description',
  modify write_YN varchar(1) not null comment 'customer write permission',
  modify re_YN varchar(1) not null comment 'manager reply permission',
  modify numPerPage int comment 'rows per page';

alter table board
  modify type_id int comment 'board type id',
  modify board_id int not null auto_increment comment 'board id',
  modify p_id int comment 'parent board id',
  modify loginid varchar(10) not null comment 'writer id',
  modify password varchar(20) comment 'post password',
  modify title varchar(200) not null comment 'title',
  modify date varchar(50) comment 'write date',
  modify content text comment 'content';

alter table purchase
  modify purchase_id int not null auto_increment comment 'purchase id',
  modify loginid varchar(10) not null comment 'customer id',
  modify prod_id int comment 'product id',
  modify date varchar(30) not null comment 'purchase date',
  modify price int comment 'price',
  modify point int comment 'point',
  modify qty int comment 'quantity',
  modify total int comment 'total',
  modify payYN varchar(1) not null default 'N' comment 'payment status',
  modify cancel varchar(1) not null default 'N' comment 'cancel status';

alter table cart
  modify cart_id int not null auto_increment comment 'cart id',
  modify loginid varchar(10) not null comment 'customer id',
  modify prod_id int comment 'product id',
  modify date varchar(30) not null comment 'cart date';

insert ignore into person values('M', 'M', 'Manager', 'm', 'Seoul', '010', '00000000', 'MNG');
insert ignore into person values('C', 'C', 'CEO', 'm', 'Seoul', '010', '00000000', 'CEO');
insert ignore into person values('C1', 'C1', 'Customer1', 'm', 'Seoul', '010', '00000000', 'CST');

insert into boardtype(title, description, write_YN, re_YN, numPerPage)
select 'Q&A', 'Question and Answer', 'Y', 'Y', 5
where not exists (select 1 from boardtype where title = 'Q&A');
