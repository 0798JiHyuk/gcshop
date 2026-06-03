const db = require('../lib/db');

const queries = [
  `create table if not exists code (
    main_id varchar(4) not null,
    sub_id varchar(4) not null,
    main_name varchar(100) not null,
    sub_name varchar(100) not null,
    start varchar(8) not null,
    end varchar(8) not null,
    primary key (main_id, sub_id, start)
  )`,
  `alter table person add column mf varchar(1) null after name`,
  `alter table product change column id prod_id int not null auto_increment`,
  `alter table product add column main_id varchar(4) not null default '0000' after prod_id`,
  `alter table product add column sub_id varchar(4) not null default '0000' after main_id`,
  `alter table product add column stock int not null default 0 after price`,
  `alter table product add column brand varchar(50) not null default '' after stock`,
  `alter table product add column supplier varchar(50) not null default '' after brand`,
  `alter table product add column image varchar(50) null after supplier`
];

const ignoredErrors = new Set(['ER_DUP_FIELDNAME', 'ER_BAD_FIELD_ERROR']);

function run(index) {
  if (index >= queries.length) {
    console.log('schema ready');
    db.end();
    return;
  }

  db.query(queries[index], (error) => {
    if (error && !ignoredErrors.has(error.code)) {
      console.error(`${error.code}: ${error.message}`);
      db.end();
      process.exit(1);
    }

    run(index + 1);
  });
}

run(0);
