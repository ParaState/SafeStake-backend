var mysql = require("mysql2")
var config = require("../config/config")
var beacon = require("./beacon")

class Db {
    constructor() {
        this.con = mysql.createConnection(config.MYSQL);
        this.con.connect(function (err) {
            if (err) throw err;
            console.log("Database connected success!");
        });

        // 创建数据库连接
        this.init();
    }
    init() {
        let sql = "CREATE TABLE IF NOT EXISTS operators (\
            id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
            name VARCHAR(255) NOT NULL,\
            address VARCHAR(512) NOT NULL,\
            pk VARCHAR(700) NOT NULL UNIQUE)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
        this.con.query(sql, function (err, result) {
            if (err)
                throw err;
            console.log("Table operators created");
        });
        sql = "CREATE TABLE IF NOT EXISTS validators (\
            id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
            address VARCHAR(512) NOT NULL,\
            pk VARCHAR(700) NOT NULL UNIQUE\
            )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
        this.con.query(sql, function (err, result) {
            if (err)
                throw err;
            console.log("Table validators created");
        });
        sql = "CREATE TABLE IF NOT EXISTS validators_operators_map (\
            id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
            validator_id INTEGER NOT NULL,\
            idx INTEGER NOT NULL,\
            operator_pk VARCHAR(700) NOT NULL,\
            shared_pk VARCHAR(700) NOT NULL,\
            encrypted_key VARCHAR(700) NOT NULL,\
            FOREIGN KEY validator_map(validator_id) \
            REFERENCES validators(id) \
            ON UPDATE CASCADE \
            ON DELETE RESTRICT, \
            FOREIGN KEY operator_map(operator_pk) \
            REFERENCES operators(pk) \
            ON UPDATE CASCADE \
            ON DELETE RESTRICT \
            )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
        this.con.query(sql, function (err, result) {
            if (err)
                throw err;
            console.log("Table validators_operators_map created");
        });
        sql = "CREATE TABLE IF NOT EXISTS config(\
                k VARCHAR(100) NOT NULL UNIQUE,\
                v VARCHAR(100) NOT NULL)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
        this.con.query(sql, function (err, result) {
            if (err)
                throw err;
            console.log("Table config created");
        });
        sql = "CREATE TABLE IF NOT EXISTS duties(\
            id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
            validator_id INTEGER NOT NULL,\
            duty_time timestamp default current_timestamp,\
            duty VARCHAR(20) NOT NULL,\
            epoch INTEGER NOT NULL,\
            slot INTEGER NOT NULL,\
            time INTEGER NOT NULL,\
            status VARCHAR(20) NOT NULL,\
            FOREIGN KEY validator_map(validator_id) \
            REFERENCES validators(id) \
            ON UPDATE CASCADE \
            ON DELETE RESTRICT \
            )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
        this.con.query(sql, function (err, result) {
            if (err)
                throw err;
            console.log("Table duties created");
        });
        sql = "CREATE TABLE IF NOT EXISTS duties_operators_map(\
            id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,\
            duty_id INTEGER NOT NULL,\
            operator_id INTEGER NOT NULL,\
            status VARCHAR(20) NOT NULL,\
            FOREIGN KEY duty_map(duty_id) \
            REFERENCES duties(id) \
            ON UPDATE CASCADE \
            ON DELETE RESTRICT, \
            FOREIGN KEY opearator_map(operator_id) \
            REFERENCES operators(id) \
            ON UPDATE CASCADE \
            ON DELETE RESTRICT\
            )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
        this.con.query(sql, function (err, result) {
            if (err)
                throw err;
            console.log("Table duties_operators_map created");
        });
    }

    async operator_add(name, address, pk) {
        let sql = "insert into operators (name,address,pk) values (?,?,?);";
        await this.con.promise().query(sql, [name, address, pk]).then(row => {
            console.debug("operator_add with id = "
                + row[0].insertId);
        })
    }

    async operator_delete(name, pk) {
        let sql = "delete from operators  where name =? and pk = ?";
        await this.con.promise().query(sql, [name, pk]);
        console.debug("operator_delete with pk = " + pk);
    }

    async validator_add(address, pk, oessList) {
        this.con.beginTransaction();
        try {
            if (oessList.length < 1) {
                throw new Error('OessList empty')
            }
            let sql = "insert into validators (address,pk) values (?,?)";
            let id = 0;
            await this.con.promise().query(sql, [address, pk]).then(res => {
                id = res[0].insertId;
            })
            sql = "insert into validators_operators_map (validator_id,idx,operator_pk,shared_pk,encrypted_key) values(?,?,?,?,?)";
            for (const item of oessList) {
                this.con.promise().query(sql, [id, item.index, Buffer.from(item.operatorPublicKey.slice(2), "hex").toString('base64'), item.sharedPublicKey, item.encryptedKey]);
            }
            console.debug("validator_add with id = "
                + id);
        } catch (err) {
            this.con.rollback();
            throw err;
        }
        this.con.commit();
    }

    async validator_delete(address, pk) {
        let sql = "delete from validators where address=? and pk=?"
        await this.con.promise().query(sql, [address, pk]);
        console.debug("validator_delete called");
    }

    async validator_update(address, pk, oessList) {
        this.con.beginTransaction();
        try {
            if (oessList.length < 1) {
                throw new Error('OessList empty')
            }
            let sql = "select id from validators where address=? and pk=?";
            let id = 0;
            await this.con.promise().query(sql, [address, pk]).then(res => {
                if (!res || !res[0] || res[0].length == 0 || !res[0][0].id) {
                    throw new Error("Can't find validator to update");
                }
                id = res[0][0].id
            })
            await this.con.promise().query("delete from validators_operators_map where validator_id=?", [id]);
            sql = "insert into validators_operators_map (validator_id,idx,operator_pk,shared_pk,encrypted_key) values(?,?,?,?,?)";
            for (const item of oessList) {
                await this.con.promise().query(sql, [id, item.index, Buffer.from(item.operatorPublicKey.slice(2), "hex").toString('base64'), item.sharedPublicKey, item.encryptedKey]);
            }
        } catch (err) {
            this.con.rollback();
            throw err;
        }
        this.con.commit();
    }


    async block_num_update(block_num) {
        let sql = "select v from config where k='block_num'";
        let cur_num = 0;
        await this.con.promise().query(sql).then(res => {
            if (!res || !res[0] || res[0].length == 0 || !res[0][0].v) {
                throw new Error("Can't get blockNum");
            }
            cur_num = parseInt(res[0][0].v);
        })
        if (block_num <= cur_num) {
            return;
        }
        sql = "update config set v=? where k='block_num'";
        await this.con.promise().query(sql, block_num);
    }

    async get_block_num() {
        let sql = "select v from config where k='block_num'";
        let cur_num = 0;
        await this.con.promise().query(sql, "aaa").then(async res => {
            if (!res || !res[0] || res[0].length == 0) {
                sql = "INSERT INTO config VALUES('block_num','0')";
                await this.con.promise().query(sql);
            } else {
                cur_num = res[0][0].v;
            }
        });
        return cur_num;
    }

    async operators_list(page, perPage, validatorsCount, status, ordering) {
        let result = {}
        let sql = "select count(*) as count from operators";
        let total = 0;
        await this.con.promise().query(sql).then(response => {
            let res = response[0];
            if (!res || !res[0] || !res[0].count) {
                throw new Error("can't get operators_list")
            }
            total = res[0].count;
        })
        sql = "select id as operator_id,name,address,pk as public_key from operators limit ?,?";
        await this.con.promise().query(sql, [perPage * (page - 1), perPage]).then(res => {
            result.pagination = {
                page,
                per_page: perPage,
                pages: Math.ceil(total / perPage),
                total
            }
            result.operators = res[0];
        })
        sql = "select count(*) as count from validators_operators_map where operator_pk=?";
        for (const i in result.operators) {
            await this.con.promise().query(sql, result.operators[i].public_key).then(res => {
                if (res[0] && res[0][0] && res[0][0].count)
                    result.operators[i].validators_count = res[0][0].count;
                else
                    result.operators[i].validators_count = 0;
            })
        }
        return result;
    }

    async validators_list(page, perPage, operators) {
        let result = {}
        let sql = "select count(*) as count from validators";
        let total = 0;
        await this.con.promise().query(sql).then(response => {
            let res = response[0]
            if (!res || !res[0] || !res[0].count) {
                throw new Error("can't get operators_list");
            }
            total = res[0].count;
        })
        sql = "select id,pk as public_key,address from validators limit ?,?";
        await this.con.promise().query(sql, [perPage * (page - 1), perPage]).then(res => {
            result.pagination = {
                page,
                per_page: perPage,
                pages: Math.ceil(total / perPage),
                total
            }
            result.validators = res[0];
        })
        if (operators) {
            for (const i in result.validators) {
                sql = "select b.name as name,b.id as operator_id,b.address as address,b.pk as public_key,? as owner_address from validators_operators_map a left join operators b on a.operator_pk=b.pk where a.validator_id=?";
                await this.con.promise().query(sql, [result.validators[i].address, result.validators[i].id]).then(res => {
                    result.validators[i].operators = res[0];
                })
            }
        }
        return result;
    }

    async validators_list_in_operator(page, perPage, operator_address) {
        let result = {}
        let sql = "select count(*) as count from validators_operators_map a left join operators b on a.operator_pk=b.pk where b.address=?";
        let total = 0;
        await this.con.promise().query(sql, operator_address).then(response => {
            let res = response[0]
            if (!res || !res[0] || !res[0].count) {
                throw new Error("can't get validators_list_in_operator");
            }
            total = res[0].count;
        })
        sql = "select c.pk as public_key from validators_operators_map a left join operators b on a.operator_pk=b.pk left join validators c on a.validator_id=c.id where b.address=? limit ?,?";
        await this.con.promise().query(sql, [operator_address, perPage * (page - 1), perPage]).then(res => {
            result.pagination = {
                page,
                per_page: perPage,
                pages: Math.ceil(total / perPage),
                total
            }
            result.validators = res[0];
        })
        return result;
    }

    async get_validators_by_node(operator_pk, offset, limit) {
        let result = {}
        let sql = "select a.validator_id as id,b.address as address,b.pk as pk from validators_operators_map a left join validators on a.validator_id=b.id where operator_pk=? limit ?,?";
        await this.con.promise().query(sql, [operator_pk, offset, limit]).then(res => {
            result.validators = res[0];
        })
        sql = "select idx,operator_pk,shared_pk,encrypted_key from validators_operators_map where validator_id=?";
        for (const i in result.validators) {
            await this.con.promise().query(sql, [result.validators[i].id]).then(res => {
                result.validators[i].operators = res[0];
            })
        }
        return result;
    }

    async collect_performance(params) {
        this.con.beginTransaction();
        try {
            let sql = "select id from validators where pk=?";
            let validator_id = 0;
            let insertId = 0;
            await this.con.promise().query(sql, params.publicKey).then(res => {
                validator_id = res[0][0].id;
            })
            let status = params.operators.length >= 3 ? "success" : "failed";
            sql = "insert into duties (validator_id,duty,epoch,slot,time,status) values(?,?,?,?,?,?)";
            await this.con.promise().query(sql, [validator_id, params.duty, params.epoch, params.slot,params.time, status]).then(res => {
                insertId = res[0].insertId;
            })
            let operators = []
            sql = "select b.id as id,a.idx as idx from validators_operators_map a left join operators b on a.operator_pk=b.pk where a.validator_id=? order by a.idx asc";
            await this.con.promise().query(sql, [validator_id]).then(res => {
                operators = res[0];
            })
            params.operators.sort();
            let cmp_id = 0;
            sql = "insert into duties_operators_map (duty_id,operator_id,status) values(?,?,?)";
            for (const idx of params.operators) {
                if (idx >3)
                    throw new Error("error idx");
                while (idx != operators[cmp_id].idx) {
                    await this.con.promise().query(sql, [insertId, operators[cmp_id].id, "failed"]);
                    cmp_id += 1;
                }
                if (cmp_id >= operators.length) {
                    throw new Error("cpm_id overflow");
                }
                await this.con.promise().query(sql, [insertId, operators[idx].id, "success"]);
                cmp_id += 1;
            }
        } catch (e) {
            this.con.rollback();
            throw e;
        }
        this.con.commit();
    }

    async operator_get_performance(operator_address, period, current_epoch) {
        let period_num = 1;
        if (period == "30days") {
            period_num = 30
        }
        let result = {};
        let sql = "select * from operators where address=?";
        await this.con.promise().query(sql, operator_address).then(res => {
            if (!res[0] || !res[0][0]) {
                throw new Error("Can't find operator");
            }
            result = res[0][0];
        })
        sql = "select b.id from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.epoch>?";
        await this.con.promise().query(sql, [result.id, current_epoch - 10]).then(res => {
            if (!res[0]) {
                throw new Error("Can't find duty");
            }
            if (res[0].length < 1) {
                result.status = "Inactive";
            } else {
                result.status = "Active";
            }
        })
        result.performances = {}
        result.performances[period] = 0;
        if (result.status == "Active") {
            let total = 0;
            let success = 0;
            sql = "select count(*) as count from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.duty_time > (NOW() - interval ? day)";
            await this.con.promise().query(sql, [result.id, period_num]).then(res => {
                total == res[0][0].count;
            })
            if (total != 0) {
                sql = "select count(*) as count from duties_operators_map a left join duties b on a.duty_id=b.id where a.operator_id=? and b.duty_time > (NOW() - interval ? day) and a.status='success'";
                await this.con.promise().query(sql, [result.id, period_num]).then(res => {
                    success == res[0][0].count;
                })
                result.performances[period] = success / total;
            }
        }
        return result;
    }

    async validator_get_performance(validator_pk, period) {
        let period_num = 1;
        if (period == "30days") {
            period_num = 30
        }
        let result = {}
        result.public_key = validator_pk;
        await beacon.get_validator_by_public(validator_pk).then(res => {
            if (!res || !res.data || !res.data.status) {
                throw new Error("can't get_validator_by_public")
            }
            if (res.data.status == "active_online") {
                result.status = "Active";
            } else {
                result.status = "Inactive";
            }
        })
        await beacon.get_latest_state().then(res => {
            result.current_epoch = res.currentEpoch;
        })
        let sql = "select b.address as address from validators_operators_map a left join operators b on a.operator_pk=b.pk left join validators c on a.validator_id=c.id where c.pk=?";
        let operator_addresses = []
        result.operators = []
        await this.con.promise().query(sql, validator_pk).then(res => {
            if (!res[0] || !res[0].length) {
                throw new Error("can't validator_get_performance");
            }
            operator_addresses = res[0];
        })
        for (const address of operator_addresses) {
            await this.operator_get_performance(address.address, period, result.current_epoch).then(res => {
                result.operators.push(res)
            })
        }
        sql = "select a.id as id,a.duty as duty,a.epoch as epoch,a.slot as slot,a.time as time,a.status as status from duties a left join validators b on a.validator_id=b.id where b.pk=? order by id desc limit 1";
        await this.con.promise().query(sql, [validator_pk]).then(res => {
            if (res[0][0])
                result.lastDuty = res[0][0];
        })
        sql = "select a.status as status,b.address as address,b.name as name from duties_operators_map a left join operators b on a.operator_id=b.id where a.duty_id=? and a.status='success'";
            await this.con.promise().query(sql, result.lastDuty.id).then(res => {
                result.lastDuty.operators = res[0];
            })
        return result;
    }

    async validator_get_duties(validator_pk, page, perPage) {
        let result = {}
        let total = 0;
        let validator_id = 0;
        let sql = "select id from validators where pk=?";
        await this.con.promise().query(sql, validator_pk).then(response => {
            const res = response[0];
            if (!res || !res[0] || !res[0].id) {
                throw new Error("can't validator_get_duties")
            }
            validator_id = res[0].id;
        })
        sql = "select count(*) as count from duties where validator_id=?";
        await this.con.promise().query(sql, validator_id).then(response => {
            const res = response[0];
            if (!res || !res[0] || !res[0].count) {
                throw new Error("can't validator_get_duties")
            }
            total = res[0].count;
        })
        result.pagination = {
            page,
            per_page: perPage,
            pages: Math.ceil(total / perPage),
            total
        }
        sql = "select id,duty,epoch,slot,status,? as publicKey from duties where validator_id=? order by id desc limit ?,?";
        await this.con.promise().query(sql, [validator_pk, validator_id, perPage * (page - 1), perPage]).then(res => {
            result.duties = res[0];
        })
        sql = "select a.status as status,b.address as address,b.name as name from duties_operators_map a left join operators b on a.operator_id=b.id where a.duty_id=? and a.status='success'";
        for (const i in result.duties) {
            await this.con.promise().query(sql, result.duties[i].id).then(res => {
                result.duties[i].operators = res[0];
            })
        }
        return result;
    }
}

module.exports = Db;