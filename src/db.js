var mysql = require("mysql2");
var config = require("../config/config");
var beacon = require("./beacon");
var sequelize = require("../models/index");

class Db {
  constructor() {
    this.pool = mysql.createPool({
      ...config.MYSQL,
      waitForConnections: true, //当无连接池可用时，等待(true) 还是抛错(false)
      connectionLimit: 500, //连接限制
      queueLimit: 0, //最大连接等待数(0为不限制)
    });
  }

  async init() {
    await sequelize.sequelize.sync({ alter: true, logging: false });
    console.debug("Databse sync success");
    // await this.pool
    //   .promise()
    //   .getConnection()
    //   .then(async (conn) => {
    //     let sql =
    //       "CREATE TABLE IF NOT EXISTS operators (\
    //         id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
    //         name VARCHAR(255) NOT NULL,\
    //         address VARCHAR(512) NOT NULL,\
    //         pk VARCHAR(700) NOT NULL UNIQUE)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn.query(sql).then(console.log("Table operators created"));
    //     sql =
    //       "CREATE TABLE IF NOT EXISTS validators (\
    //         id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
    //         address VARCHAR(512) NOT NULL,\
    //         pk VARCHAR(700) NOT NULL UNIQUE\
    //         )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn.query(sql).then(console.log("Table validators created"));
    //     sql =
    //       "CREATE TABLE IF NOT EXISTS validators_operators_map (\
    //         id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
    //         validator_id INTEGER NOT NULL,\
    //         idx INTEGER NOT NULL,\
    //         operator_pk VARCHAR(700) NOT NULL,\
    //         shared_pk VARCHAR(700) NOT NULL,\
    //         encrypted_key VARCHAR(700) NOT NULL,\
    //         FOREIGN KEY validator_map(validator_id) \
    //         REFERENCES validators(id) \
    //         ON UPDATE CASCADE \
    //         ON DELETE CASCADE, \
    //         FOREIGN KEY operator_map(operator_pk) \
    //         REFERENCES operators(pk) \
    //         ON UPDATE CASCADE \
    //         ON DELETE CASCADE \
    //         )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn
    //       .query(sql)
    //       .then(console.log("Table validators_operators_map created"));
    //     sql =
    //       "CREATE TABLE IF NOT EXISTS config(\
    //             k VARCHAR(100) NOT NULL UNIQUE,\
    //             v VARCHAR(100) NOT NULL)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn.query(sql).then(console.log("Table config created"));
    //     sql =
    //       "CREATE TABLE IF NOT EXISTS duties(\
    //         id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
    //         validator_id INTEGER NOT NULL,\
    //         duty_time timestamp default current_timestamp,\
    //         duty VARCHAR(20) NOT NULL,\
    //         epoch INTEGER NOT NULL,\
    //         slot INTEGER NOT NULL,\
    //         time INTEGER NOT NULL,\
    //         status VARCHAR(20) NOT NULL,\
    //         FOREIGN KEY validator_map(validator_id) \
    //         REFERENCES validators(id) \
    //         ON UPDATE CASCADE \
    //         ON DELETE CASCADE \
    //         )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn.query(sql).then(console.log("Table duties created"));
    //     sql =
    //       "CREATE TABLE IF NOT EXISTS duties_operators_map(\
    //         id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
    //         duty_id INTEGER NOT NULL,\
    //         operator_id INTEGER NOT NULL,\
    //         status VARCHAR(20) NOT NULL,\
    //         FOREIGN KEY duty_map(duty_id) \
    //         REFERENCES duties(id) \
    //         ON UPDATE CASCADE \
    //         ON DELETE CASCADE, \
    //         FOREIGN KEY opearator_map(operator_id) \
    //         REFERENCES operators(id) \
    //         ON UPDATE CASCADE \
    //         ON DELETE CASCADE\
    //         )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn
    //       .query(sql)
    //       .then(console.log("Table duties_operators_map created"));
    //     sql =
    //       "CREATE TABLE IF NOT EXISTS tx_records(\
    //     id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
    //     hash varchar(100) NOT NULL\
    //     )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
    //     await conn.query(sql).then(console.log("Table tx_records created"));
    //     conn.release();
    //   });
  }

  async operator_add(name, address, pk) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "insert into operators (name,address,pk) values (?,?,?);";
        await conn.query(sql, [name, address, pk]).then((row) => {
          console.debug("operator_add with id = " + row[0].insertId);
        });
        conn.release();
      });
  }

  async operator_delete(name, pk) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "delete from operators  where name =? and pk = ?";
        await conn.query(sql, [name, pk]);
        console.debug("operator_delete with pk = " + pk);
        conn.release();
      });
  }

  async validator_add(address, pk, oessList) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        conn.beginTransaction();
        try {
          if (oessList.length < 1) {
            throw new Error("OessList empty");
          }
          let sql = "insert into validators (address,pk) values (?,?)";
          let id = 0;
          await conn.query(sql, [address, pk]).then((res) => {
            id = res[0].insertId;
          });
          sql =
            "insert into validators_operators_map (validator_id,idx,operator_pk,shared_pk,encrypted_key) values(?,?,?,?,?)";
          for (const item of oessList) {
            conn.query(sql, [
              id,
              item.index,
              Buffer.from(item.operatorPublicKey.slice(2), "hex").toString(
                "base64"
              ),
              item.sharedPublicKey,
              item.encryptedKey,
            ]);
          }
          console.debug("validator_add with id = " + id);
        } catch (err) {
          conn.rollback();
          conn.release();
          throw err;
        }
        conn.commit();
        conn.release();
      });
  }

  async validator_delete(address, pk) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "delete from validators where address=? and pk=?";
        await conn.query(sql, [address, pk]);
        console.debug("validator_delete called");
        conn.release();
      });
  }

  async validator_update(address, pk, oessList) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        conn.beginTransaction();
        try {
          if (oessList.length < 1) {
            throw new Error("OessList empty");
          }
          let sql = "select id from validators where address=? and pk=?";
          let id = 0;
          await conn.query(sql, [address, pk]).then((res) => {
            if (!res || !res[0] || res[0].length == 0 || !res[0][0].id) {
              throw new Error("Can't find validator to update");
            }
            id = res[0][0].id;
          });
          await conn.query(
            "delete from validators_operators_map where validator_id=?",
            [id]
          );
          sql =
            "insert into validators_operators_map (validator_id,idx,operator_pk,shared_pk,encrypted_key) values(?,?,?,?,?)";
          for (const item of oessList) {
            await conn.query(sql, [
              id,
              item.index,
              Buffer.from(item.operatorPublicKey.slice(2), "hex").toString(
                "base64"
              ),
              item.sharedPublicKey,
              item.encryptedKey,
            ]);
          }
        } catch (err) {
          conn.rollback();
          conn.release();
          throw err;
        }
        conn.commit();
        conn.release();
      });
  }

  async tx_add(hash) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "insert into tx_records (hash) values(?);";
        await conn.query(sql, hash);
        conn.release();
      });
  }

  async tx_check(hash) {
    let res = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "select * from tx_records where hash=?";
        let res = await conn.query(sql, hash).then((res) => {
          if (res && res[0] && res[0].length) return true;
          return false;
        });
        conn.release();
        return res;
      });
    return res;
  }

  async block_num_update(block_num) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "select v from config where k='block_num'";
        let cur_num = 0;
        await conn.query(sql).then((res) => {
          if (!res || !res[0] || res[0].length == 0 || !res[0][0].v) {
            conn.release();
            throw new Error("Can't get blockNum");
          }
          cur_num = parseInt(res[0][0].v);
        });
        if (block_num <= cur_num) {
          conn.release();
          return;
        }
        sql = "update config set v=? where k='block_num'";
        await conn.query(sql, block_num);
        conn.release();
      });
  }

  async get_block_num() {
    let cur_num = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let sql = "select v from config where k='block_num'";
        let cur_num = 0;
        await conn.query(sql).then(async (res) => {
          if (!res || !res[0] || res[0].length == 0) {
            sql = "INSERT INTO config (k,v) VALUES('block_num','0')";
            await conn.query(sql);
          } else {
            cur_num = res[0][0].v;
          }
        });
        conn.release();
        return cur_num;
      });
    return cur_num;
  }

  async operators_list(
    page,
    perPage,
    validatorsCount,
    status,
    ordering,
    current_epoch,
    search,
    address = null
  ) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let result = {};
        let sql_param = [];
        let real_key = null;
        if (search){
          real_key = "%" + search + "%";
        }
        let sql = "select count(*) as count from operators";
        if (address){
          sql += " where address=?";
          sql_param.push(address);
        }
        if (search){
          sql += " where address like ? or pk like ? or name like ?";
          sql_param.push(real_key, real_key, real_key);
        }
        let total = 0;
        result.pagination = {
          page,
          per_page: perPage,
          pages: Math.ceil(total / perPage),
          total,
        };
        result.operators = [];
        await conn.query(sql, sql_param).then((response) => {
          let res = response[0];
          if (!res || !res[0] || res[0].count === null) {
            conn.release();
            throw new Error("can't get operators_list");
          }
          total = res[0].count;
        });
        if (total === 0) {
          conn.release();
          return result;
        }
        sql_param = [perPage * (page - 1), perPage];
        sql =
          "select id as operator_id,name,address,pk as public_key";
        if (validatorsCount){
          sql += ",(select count(*) as count from validators_operators_map where operator_pk=pk) as validators_count"
        }
        sql += " from operators";
        if (address){
          sql += " where address=?";
          sql_param = [address,perPage * (page - 1), perPage];
        }
        if (search){
          sql += " where address like ? or pk like ? or name like ?";
          sql_param = [
            real_key,
            real_key,
            real_key,
            perPage * (page - 1),
            perPage,
          ];
        }
        if (validatorsCount && ordering === "validators_count:desc") {
          sql += " order by validators_count desc";
        }
        sql += " limit ?,?";
        await conn.query(sql, sql_param).then((res) => {
          result.pagination = {
            page,
            per_page: perPage,
            pages: Math.ceil(total / perPage),
            total,
          };
          result.operators = res[0];
        });
        if (status){
          sql =
          "SELECT (case when T2.totalCo=0 then 0 else ROUND(T1.co/T2.totalCo*10,1) end) as res \
        FROM \
         (select count(*) as co from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.epoch>? and a.status='success') T1, \
         (select count(*) as totalCo from validators_operators_map a where operator_pk=? and (select count(*) from duties where validator_id=a.validator_id and epoch>?)>0)T2";
        for (const index in result.operators) {
          result.operators[index].status = await conn
            .query(sql, [
              result.operators[index].operator_id,
              current_epoch - 10,
              result.operators[index].public_key,
              current_epoch - 10,
            ])
            .then((res) => {
              if (!res[0] || !res[0][0] || res[0][0].res === null) {
                conn.release();
                throw new Error("Can't find duty");
              }
              return res[0][0].res >= 60 ? "Active" : "Inactive";
            });
        }
        }
        conn.release();
        return result;
      });
    return result;
  }

  async validators_list(page, perPage, operators,address=null) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let result = {};
        let sql = "select count(*) as count from validators";
        let sql_params = []
        if (address)
        {
          sql += " where address=?";
          sql_params = [address];
        }
        let total = 0;
        result.pagination = {
          page,
          per_page: perPage,
          pages: Math.ceil(total / perPage),
          total,
        };
        result.validators = [];
        await conn.query(sql,sql_params).then((response) => {
          let res = response[0];
          if (!res || !res[0] || res[0].count === null) {
            conn.release();
            throw new Error("can't get operators_list");
          }
          total = res[0].count;
        });
        if (total === 0) {
          conn.release();
          return result;
        }
        sql_params = [perPage * (page - 1), perPage];
        sql =
          "select id,pk as public_key,address from validators";
        if (address){
          sql += " where address=?"
          sql_params = [address,perPage * (page - 1), perPage];
        }
        sql += " order by id desc limit ?,?";
        await conn.query(sql, sql_params).then((res) => {
          result.pagination = {
            page,
            per_page: perPage,
            pages: Math.ceil(total / perPage),
            total,
          };
          result.validators = res[0];
        });
        if (address) {
          let current_epoch = await beacon.get_latest_state().then((res) => {
            return res.currentEpoch;
          });
          sql =
          "select a.id as id,a.duty as duty,a.epoch as epoch,a.slot as slot,a.time as time,a.status as status from duties a left join validators b on a.validator_id=b.id where b.pk=? and a.status='success' and a.epoch>? order by epoch desc limit 4";
          for (const i in result.validators) {
            await beacon
              .get_validator_by_public(result.validators[i].public_key)
              .then((res) => {
                if (!res || !res.data || !res.data.status) {
                  result.validators[i].status = "Offline";
                  return;
                }
                if (res.data.status == "active_online") {
                  result.validators[i].status = "Inactive";
                } else {
                  result.validators[i].status = "Offline";
                }
              });
            await conn
              .query(sql, [result.validators[i].public_key, current_epoch - 4])
              .then((res) => {
                if (res[0].length > 1) {
                  result.validators[i].status = "Active";
                }
              });
          }
        }
        if (operators) {
          for (const i in result.validators) {
            sql =
              "select b.name as name,b.id as operator_id,b.address as address,b.pk as public_key,? as owner_address from validators_operators_map a left join operators b on a.operator_pk=b.pk where a.validator_id=?";
            await conn
              .query(sql, [
                result.validators[i].address,
                result.validators[i].id,
              ])
              .then((res) => {
                result.validators[i].operators = res[0];
              });
          }
        }
        conn.release();
        return result;
      });
    return result;
  }

  async validators_list_in_operator(page, perPage, operator_address) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let result = {};
        let total = 0;
        result.pagination = {
          page,
          per_page: perPage,
          pages: Math.ceil(total / perPage),
          total,
        };
        result.validators = [];
        let sql =
          "select count(*) as count from validators_operators_map a left join operators b on a.operator_pk=b.pk where b.address=?";
        await conn.query(sql, operator_address).then((response) => {
          let res = response[0];
          if (!res || !res[0] || res[0].count === null) {
            conn.release();
            throw new Error("can't get validators_list_in_operator");
          }
          total = res[0].count;
        });
        if (total === 0) {
          conn.release();
          return result;
        }
        sql =
          "select c.pk as public_key from validators_operators_map a left join operators b on a.operator_pk=b.pk left join validators c on a.validator_id=c.id where b.address=? limit ?,?";
        await conn
          .query(sql, [operator_address, perPage * (page - 1), perPage])
          .then((res) => {
            result.pagination = {
              page,
              per_page: perPage,
              pages: Math.ceil(total / perPage),
              total,
            };
            result.validators = res[0];
          });
        conn.release();
        return result;
      });
    return result;
  }

  async get_validators_by_node(operator_pk, offset, limit) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let result = {};
        let sql =
          "select a.validator_id as id,b.address as address,b.pk as pk from validators_operators_map a left join validators on a.validator_id=b.id where operator_pk=? limit ?,?";
        await conn.query(sql, [operator_pk, offset, limit]).then((res) => {
          result.validators = res[0];
        });
        sql =
          "select idx,operator_pk,shared_pk,encrypted_key from validators_operators_map where validator_id=?";
        for (const i in result.validators) {
          await conn.query(sql, [result.validators[i].id]).then((res) => {
            result.validators[i].operators = res[0];
          });
        }
        conn.release();
        return result;
      });
    return result;
  }

  async collect_performance(params) {
    await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        conn.beginTransaction();
        try {
          let sql = "select id from validators where pk=?";
          let validator_id = 0;
          let insertId = 0;
          await conn.query(sql, params.publicKey).then((res) => {
            validator_id = res[0][0].id;
          });
          let status = params.operators.length >= 3 ? "success" : "failed";
          // let lastEpoch = 0;
          // sql =
          //   "select epoch from duties where validator_id=? and epoch<? order by epoch desc limit 1";
          // await conn.query(sql, [validator_id, params.epoch]).then((res) => {
          //   if (!res[0] || !res[0][0] || !res[0][0].epoch) {
          //     lastEpoch = params.epoch - 1;
          //   }
          //   lastEpoch = res[0][0].epoch;
          // });
          sql =
            "insert into duties (validator_id,duty,epoch,slot,time,status) values(?,?,?,?,?,?)";
          await conn
            .query(sql, [
              validator_id,
              params.duty,
              params.epoch,
              params.slot,
              params.time,
              status,
            ])
            .then((res) => {
              insertId = res[0].insertId;
            });
          let operators = [];
          sql =
            "select b.id as id,a.idx as idx from validators_operators_map a left join operators b on a.operator_pk=b.pk where a.validator_id=? order by a.idx asc";
          await conn.query(sql, [validator_id]).then((res) => {
            operators = res[0];
          });
          params.operators.sort();
          let cmp_id = 0;
          sql =
            "insert into duties_operators_map (duty_id,operator_id,status) values(?,?,?)";
          for (const idx of params.operators) {
            if (idx > 4 || idx < 1) {
              throw new Error("error idx");
            }
            while (idx - 1 != operators[cmp_id].idx) {
              await conn.query(sql, [insertId, operators[cmp_id].id, "failed"]);
              cmp_id += 1;
            }
            if (cmp_id >= operators.length) {
              throw new Error("cpm_id overflow");
            }
            await conn.query(sql, [insertId, operators[idx - 1].id, "success"]);
            cmp_id += 1;
          }
          // if (lastEpoch < params.epoch - 1) {
          //   let failed_id = 0;
          //   for (let i = lastEpoch + 1; i < params.epoch; i++) {
          //     sql =
          //       "insert into duties (validator_id,duty,epoch,slot,time,status) values(?,?,?,?,?,?)";
          //     await conn
          //       .query(sql, [validator_id, params.duty, i, -1, 0, "failed"])
          //       .then((res) => {
          //         failed_id = res[0].insertId;
          //       });
          //     sql =
          //       "insert into duties_operators_map (duty_id,operator_id,status) values(?,?,?)";
          //     for (const op of operators) {
          //       await conn.query(sql, [failed_id, op.id, "failed"]);
          //     }
          //   }
          // }
        } catch (e) {
          conn.rollback();
          conn.release();
          throw e;
        }
        conn.commit();
        conn.release();
      });
  }

  async operator_get_performance_internal(
    operator_address,
    period,
    current_epoch,
    conn,
    validator_id
  ) {
    let period_num = 1;
    if (period == "30days") {
      period_num = 30;
    }
    let result = {};
    let sql = "select * from operators where address=?";
    await conn.query(sql, operator_address).then((res) => {
      if (!res[0] || !res[0][0]) {
        throw new Error("Can't find operator");
      }
      result = res[0][0];
    });
    let query_params = [result.id, current_epoch - 10, result.pk, current_epoch - 10];
    sql =
      "SELECT (case when T2.totalCo=0 then 0 else ROUND(T1.co/T2.totalCo*10,1) end) as res \
      FROM \
       (select count(*) as co from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.epoch>? and a.status='success') T1, \
       (select count(*) as totalCo from validators_operators_map a where operator_pk=? and (select count(*) from duties where validator_id=a.validator_id and epoch>?)>0)T2";
    if (validator_id) {
      sql = `SELECT ROUND(T1.co*10,1) as res
      FROM
       (select count(*) as co from duties_operators_map a left join duties b on a.duty_id=b.id where b.validator_id=${validator_id} and a.operator_id=? and b.epoch>? and a.status='success') T1`;
      query_params = [result.id, current_epoch - 10];
    }
    result.status = await conn.query(sql, query_params).then((res) => {
      if (!res[0] || !res[0][0] || res[0][0].res === null) {
        conn.release();
        throw new Error("Can't get performance");
      }
      return res[0][0].res >= 60 ? "Active" : "Inactive";
    });
    result.performances = {};
    result.performances[period] = 0;
    let total = 240;
    if (period_num > 1)
      total = 240 * 30;
    // 判断period之前是否op是否有任务
    sql =
      "select * from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.duty_time<(NOW() - interval ? day)";
    if (validator_id) {
      sql += ` and b.validator_id=${validator_id}`;
    }
    sql += " limit 1";
    let over1Day = await conn
      .query(sql, [result.id, period_num])
      .then((res) => {
        if (res[0] && res[0].length) {
          return true;
        }
        return false;
      });
    // 如果未满需要调整总数
    if (!over1Day) {
      sql =
        "select b.epoch as epoch from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.duty_time>(NOW() - interval ? day)";
      if (validator_id) {
        sql += ` and b.validator_id=${validator_id}`;
      }
      sql += " order by epoch limit 1";
      total = await conn.query(sql, [result.id, period_num]).then((res) => {
        if (res[0] && res[0][0] && res[0][0].epoch) {
          return current_epoch - res[0][0].epoch;
        }
        return 0;
      });
    }
    if (total != 0) {
      if (!validator_id) {
        sql =
          "select count(*) as count from validators_operators_map a where operator_pk=? and (select count(*) from duties where validator_id=a.validator_id and duty_time>(NOW() - interval ? day))>0";
        total = await conn.query(sql, [result.pk, period_num]).then((res) => {
          if (res[0] && res[0][0] && res[0][0].count)
            return total * res[0][0].count;
          else return 0;
        });
      }
      sql =
        "select count(*) as count from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.duty_time > (NOW() - interval ? day) and a.status='success'";
      if (validator_id) {
        sql += ` and b.validator_id=${validator_id}`;
      }
      let success = await conn
        .query(sql, [result.id, period_num])
        .then((res) => {
          return res[0][0].count;
        });
      console.log(success, total, current_epoch);
      result.performances[period] = Math.round((success / total) * 1000) / 10;
      if (result.performances[period] > 100)
        result.performances[period] = 100;
    }
    return result;
  }

  async operator_get_performance(
    operator_address,
    period,
    current_epoch,
    Conn = null,
    validator_id = null
  ) {
    if (validator_id) validator_id = parseInt(validator_id);
    let result = {};
    if (Conn === null) {
      result = await this.pool
        .promise()
        .getConnection()
        .then(async (conn) => {
          let result = await this.operator_get_performance_internal(
            operator_address,
            period,
            current_epoch,
            conn,
            validator_id
          );
          conn.release();
          return result;
        });
    } else {
      result = await this.operator_get_performance_internal(
        operator_address,
        period,
        current_epoch,
        Conn,
        validator_id
      );
    }
    return result;
  }
  // async sync_duties(){

  // }

  async sync_duties(validator_pk, current_epoch = null, conn = null) {
    let releaseNeed = false;
    if (conn === null) {
      conn = await this.pool.promise().getConnection();
      releaseNeed = true;
    }
    if (current_epoch === null) {
      current_epoch = await beacon.get_latest_state().then((res) => {
        return res.currentEpoch;
      });
    }
    let sql = "select id from validators where pk=?";
    let validator_id = await conn.query(sql, validator_pk).then((res) => {
      return res[0][0].id;
    });

    sql =
      "select epoch from duties where validator_id=? and epoch<? order by epoch desc limit 1";
    let lastEpoch = await conn
      .query(sql, [validator_id, current_epoch])
      .then((res) => {
        if (!res[0] || !res[0][0] || !res[0][0].epoch) {
          return current_epoch - 1;
        }
        return res[0][0].epoch;
      });
    if (lastEpoch < current_epoch - 1) {
      sql =
        "select b.id as id,a.idx as idx from validators_operators_map a left join operators b on a.operator_pk=b.pk where a.validator_id=? order by a.idx asc";
      let operators = await conn.query(sql, [validator_id]).then((res) => {
        return res[0];
      });
      let failed_id = 0;
      for (let i = lastEpoch + 1; i < current_epoch - 1; i++) {
        sql =
          "insert into duties (validator_id,duty,epoch,slot,time,status) values(?,?,?,?,?,?)";
        await conn
          .query(sql, [validator_id, "PROPOSER", i, -1, 0, "failed"])
          .then((res) => {
            failed_id = res[0].insertId;
          });
        sql =
          "insert into duties_operators_map (duty_id,operator_id,status) values(?,?,?)";
        for (const op of operators) {
          await conn.query(sql, [failed_id, op.id, "failed"]);
        }
      }
    }
    if (releaseNeed) conn.release();
  }

  async validator_get_performance(validator_pk, period) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let period_num = 1;
        if (period == "30days") {
          period_num = 30;
        }
        let result = {};
        // let lastSlot = -1;
        result.public_key = validator_pk;
        await beacon.get_validator_by_public(validator_pk).then((res) => {
          if (!res || !res.data || !res.data.status) {
            result.status = "Offline";
            return;
          }
          if (res.data.status == "active_online") {
            result.status = "Inactive";
          } else {
            result.status = "Offline";
          }
          // if (res.data.lastattestationslot)
          //   lastSlot = res.data.lastattestationslot
        });
        await beacon.get_latest_state().then((res) => {
          result.current_epoch = res.currentEpoch;
        });
        let sql =
          "select a.validator_id as validator_id,b.address as address from validators_operators_map a left join operators b on a.operator_pk=b.pk left join validators c on a.validator_id=c.id where c.pk=?";
        let operator_addresses = [];
        result.operators = [];
        await conn.query(sql, validator_pk).then((res) => {
          if (!res[0] || !res[0].length) {
            conn.release();
            throw new Error("can't validator_get_performance");
          }
          operator_addresses = res[0];
        });
        for (const address of operator_addresses) {
          await this.operator_get_performance(
            address.address,
            period,
            result.current_epoch,
            conn,
            address.validator_id
          ).then((res) => {
            result.operators.push(res);
          });
        }
        sql =
          "select a.id as id,a.duty as duty,a.epoch as epoch,a.slot as slot,a.time as time,a.status as status from duties a left join validators b on a.validator_id=b.id where b.pk=? and a.status='success' and a.epoch>? order by epoch desc limit 4";
        await conn
          .query(sql, [validator_pk, result.current_epoch - 4])
          .then((res) => {
            if (res[0][0] && res[0][0].epoch >= result.current_epoch - 1)
              result.lastDuty = res[0][0];
            else {
              result.lastDuty = {
                duty: "PROPOSER",
                epoch: result.current_epoch,
                slot: "-",
                time: 0,
                status: "failed",
                operators: [],
              };
            }
            if (res[0].length > 1) {
              result.status = "Active";
            }
          });
        if (result.lastDuty && result.lastDuty.status === "success") {
          sql =
            "select a.status as status,b.address as address,b.name as name from duties_operators_map a left join operators b on a.operator_id=b.id where a.duty_id=? and a.status='success'";
          await conn.query(sql, result.lastDuty.id).then((res) => {
            result.lastDuty.operators = res[0];
          });
        }
        conn.release();
        return result;
      });
    return result;
  }

  async validator_get_duties(validator_pk, page, perPage) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let result = {};
        let total = 0;
        let validator_id = 0;
        result.pagination = {
          page,
          per_page: perPage,
          pages: Math.ceil(total / perPage),
          total,
        };
        result.duties = [];
        let sql = "select id from validators where pk=?";
        await conn.query(sql, validator_pk).then((response) => {
          const res = response[0];
          if (!res || !res[0] || !res[0].id) {
            throw new Error("can't validator_get_duties");
          }
          validator_id = res[0].id;
        });
        sql =
          "select count(*) as count from duties where validator_id=? and status='success'";
        await conn.query(sql, validator_id).then((response) => {
          const res = response[0];
          if (!res || !res[0] || res[0].count === null) {
            conn.release();
            throw new Error("can't validator_get_duties");
          }
          total = res[0].count;
        });
        if (total === 0) {
          conn.release();
          return result;
        }
        result.pagination = {
          page,
          per_page: perPage,
          pages: Math.ceil(total / perPage),
          total,
        };
        sql =
          "select id,duty,epoch,slot,status,? as publicKey from duties where validator_id=? and status='success' order by epoch desc limit ?,?";
        await conn
          .query(sql, [
            validator_pk,
            validator_id,
            perPage * (page - 1),
            perPage,
          ])
          .then((res) => {
            result.duties = res[0];
          });
        sql =
          "select a.status as status,b.address as address,b.name as name from duties_operators_map a left join operators b on a.operator_id=b.id where a.duty_id=? and a.status='success'";
        for (const i in result.duties) {
          await conn.query(sql, result.duties[i].id).then((res) => {
            result.duties[i].operators = res[0];
          });
        }
        conn.release();
        return result;
      });
    return result;
  }

  async key_search(key) {
    let result = await this.pool
      .promise()
      .getConnection()
      .then(async (conn) => {
        let result = {
          operators: [],
          query: key,
          validators: [],
        };
        let real_key = "%" + key + "%";
        let sql =
          "select pk as public_key from validators where address like ? or pk like ? limit 5";
        let sql_ret = await conn.query(sql, [real_key, real_key]);
        if (sql_ret && sql_ret[0] && sql_ret[0].length) {
          result.validators = sql_ret[0];
        }
        sql =
          "select address,pk as public_key,name,'operator' as type from operators where address like ? or pk like ? or name like ? limit 5";
        sql_ret = await conn.query(sql, [real_key, real_key, real_key]);
        if (sql_ret && sql_ret[0] && sql_ret[0].length) {
          result.operators = sql_ret[0];
        }
        conn.release();
        return result;
      });
    return result;
  }
}

module.exports = Db;
