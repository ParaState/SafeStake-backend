// 引入web库
var Web3 = require("web3");
var schedule = require('node-schedule');
var config = require("../config/config");
var Db = require("./db");

class Dvf {
  async OperatorAddedCallBack(error, event) {
    if (error) {
      console.log(error);
    }
    const res = event.returnValues;
    const hash = event.transactionHash;
    try {
      let exist = await this.db.tx_check(hash);
      if (!exist) {
        await this.db.operator_add(
          res.name,
          res.ownerAddress,
          this.web3.eth.abi.decodeParameter("string", res.publicKey)
        );
        const block_num = event.blockNumber;
        await this.db.block_num_update(block_num);
        await this.db.tx_add(hash);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async OperatorDeletedCallBack(error, event) {
    if (error) {
      console.log(error);
    }
    const res = event.returnValues;
    const hash = event.transactionHash;

    try {
      let exist = await this.db.tx_check(hash);
      if (!exist) {
        await this.db.operator_delete(
          res.name,
          this.web3.eth.abi.decodeParameter("string", res.publicKey)
        );
        const block_num = event.blockNumber;
        await this.db.block_num_update(block_num);
        await this.db.tx_add(hash);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async ValidatorAddedCallBack(error, event) {
    if (error) {
      console.log(error);
    }
    const res = event.returnValues;
    const hash = event.transactionHash;
    try {
      let exist = await this.db.tx_check(hash);
      if (!exist) {
        await this.db.validator_add(
          res.ownerAddress,
          res.publicKey,
          res.oessList
        );
        const block_num = event.blockNumber;
        await this.db.block_num_update(block_num);
        await this.db.tx_add(hash);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async ValidatorDeletedCallBack(error, event) {
    if (error) {
      console.log(error);
    }
    const res = event.returnValues;
    const hash = event.transactionHash;
    try {
      let exist = await this.db.tx_check(hash);
      if (!exist) {
        await this.db.validator_delete(res.ownerAddress, res.publicKey);
        const block_num = event.blockNumber;
        await this.db.block_num_update(block_num);
        await this.db.tx_add(hash);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async ValidatorUpdatedCallBack(error, event) {
    if (error) {
      console.log(error);
    }
    const res = event.returnValues;
    const hash = event.transactionHash;
    try {
      let exist = await this.db.tx_check(hash);
      if (!exist) {
        await this.db.validator_update(res.name, res.publicKey, res.oessList);
        const block_num = event.blockNumber;
        await this.db.block_num_update(block_num);
        await this.db.tx_add(hash);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async Sync() {
    const t = this;
    const block_num = await this.db.get_block_num();
    this.contract.getPastEvents(
      "allEvents",
      { fromBlock: block_num, toBlock: "latest" },
      async function (error, events) {
        for (const item of events) {
          try {
            // console.log(item.event);
            if (item.event == "OperatorAdded") {
              await t.OperatorAddedCallBack(null, item);
            } else if (item.event == "OperatorDeleted") {
              await t.OperatorDeletedCallBack(null, item);
            } else if (item.event == "ValidatorAdded") {
              await t.ValidatorAddedCallBack(null, item);
            } else if (item.event == "ValidatorDeleted") {
              await t.ValidatorDeletedCallBack(null, item);
            } else if (item.event == "ValidatorUpdated") {
              await t.ValidatorUpdatedCallBack(null, item);
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
    );
  }

  scheduleListen() {
    let rule = new schedule.RecurrenceRule();
    rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    this.job = schedule.scheduleJob(rule, () => {
      this.Sync();
    });
  }

  scheduleContract() {
    let rule = new schedule.RecurrenceRule();
    rule.minute = [30];
    this.job = schedule.scheduleJob(rule, () => {
      delete this.web3;
      delete this.contract;
      this.web3 = new Web3(
        Web3.givenProvider ||
          new Web3.providers.WebsocketProvider(config.WEB_PROVIDER)
      );
      this.contract = new this.web3.eth.Contract(
        config.ABI,
        config.CONTRACT_ADDRESS
      );
      this.contract.events.allEvents(this.Sync.bind(this));
    });
  }

  GetOperatorNum() {
    this.contract.methods
      .operatorCount()
      .call()
      .then((res) => {
        return res;
      });
  }

  GetValidatorNum() {
    this.contract.methods
      .validatorCount()
      .call()
      .then((res) => {
        return res;
      });
  }

  operators_list(
    page,
    perPage,
    validatorsCount,
    status,
    ordering,
    current_epoch,
    search
  ) {
    return this.db.operators_list(
      page,
      perPage,
      validatorsCount,
      status,
      ordering,
      current_epoch,
      search
    );
  }
  operators_list_by_address(page, perPage, current_epoch, address) {
    return this.db.operators_list(
      page,
      perPage,
      true,
      true,
      "validators_count:desc",
      current_epoch,
      null,
      address
    );
  }
  validators_list(page, perPage, operators) {
    return this.db.validators_list(page, perPage, operators);
  }
  validators_list_by_address(page, perPage, address) {
    return this.db.validators_list(page, perPage, false, address);
  }
  get_validators_by_node(operator_pk, offset, limit) {
    return this.db.get_validators_by_node(operator_pk, offset, limit);
  }
  collect_performance(params) {
    return this.db.collect_performance(params);
  }
  operator_get_performance(operator_address, period, current_epoch) {
    return this.db.operator_get_performance(
      operator_address,
      period,
      current_epoch
    );
  }
  validator_get_performance(validator_pk, period) {
    return this.db.validator_get_performance(validator_pk, period);
  }
  validator_get_duties(validator_pk, page, perPage) {
    return this.db.validator_get_duties(validator_pk, page, perPage);
  }
  validators_list_in_operator(page, perPage, operator_address) {
    return this.db.validators_list_in_operator(page, perPage, operator_address);
  }
  key_search(key) {
    return this.db.key_search(key);
  }

  constructor() {
    const init = (async () => {
      this.db = new Db();
      await this.db.init();
      this.web3 = new Web3(
        Web3.givenProvider ||
          new Web3.providers.WebsocketProvider(config.WEB_PROVIDER)
      );
      this.contract = new this.web3.eth.Contract(
        config.ABI,
        config.CONTRACT_ADDRESS
      );
      await this.Sync();
      this.contract.events
      .allEvents(this.Sync.bind(this)).on("connected",()=>{
        console.log("ETH monitor init success");
      })
      this.scheduleListen();
      this.scheduleContract();
      delete this.then;
      return this;
    })();
    this.then = init.then.bind(init);
  }
}

module.exports = Dvf;
