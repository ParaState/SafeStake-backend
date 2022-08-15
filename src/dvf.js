// 引入web库
var Web3 = require('web3');

var config = require("../config/config")
var Db = require("./db")

// 使用WebSocket协议 连接节点
let web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider(config.WEB_PROVIDER));
let decodeParameter = web3.eth.abi.decodeParameter;

class Dvf{

    async OperatorAddedCallBack(error, event) {
        if (error) {
            console.log(error);
        }
        const res = event.returnValues;
        try{
            await this.db.operator_add(res.name, res.ownerAddress,web3.eth.abi.decodeParameter("string", res.publicKey) );
            const block_num = event.blockNumber;
            this.db.block_num_update(block_num);
        }catch(e){
            console.log(e)
        }

    }

    async OperatorDeletedCallBack (error, event) {
        if (error) {
            console.log(error);
        }
        const res = event.returnValues;
        
        try{
            this.db.operator_delete(res.name, web3.eth.abi.decodeParameter("string", res.publicKey));
            const block_num = event.blockNumber;
            this.db.block_num_update(block_num);
        }catch(e){
            console.log(e)
        }
    }
    
    async ValidatorAddedCallBack (error, event) {
        if (error) {
            console.log(error);
        }
        const res = event.returnValues;
        try{
            await this.db.validator_add(res.ownerAddress,res.publicKey, res.oessList);
            const block_num = event.blockNumber;
            this.db.block_num_update(block_num);
        }catch(e){
            console.log(e)
        }
    }

    async ValidatorDeletedCallBack(error,event){
        if (error) {
            console.log(error);
        }
        const res = event.returnValues;
        try{
            await this.db.validator_delete(res.ownerAddress,res.publicKey);
            const block_num = event.blockNumber;
            this.db.block_num_update(block_num);
        }catch(e){
            console.log(e)
        }
    }

    async ValidatorUpdatedCallBack(error,event){
        if (error) {
            console.log(error);
        }
        const res = event.returnValues;
        try{
            this.db.validator_update(res.name, res.publicKey,res.oessList);
            const block_num = event.blockNumber;
            this.db.block_num_update(block_num);
        }catch(e){
            console.log(e)
        }
    }

    async EventListen() {
        // 监听OperatorAdded
        this.contract.events.OperatorAdded(this.OperatorAddedCallBack.bind(this)).on("connected", function () {
            console.log("OperatorAdded monitor init success");
        });
        // 监听OperatorDeleted
        this.contract.events.OperatorDeleted(this.OperatorDeletedCallBack.bind(this)).on("connected", function () {
            console.log("OperatorDeleted monitor init success");
        });
        // 监听ValidatorAdded
        this.contract.events.ValidatorAdded(this.ValidatorAddedCallBack.bind(this)).on("connected", function () {
            console.log("ValidatorAdded monitor init success");
        });
        // 监听ValidatorDeleted
        this.contract.events.ValidatorDeleted(this.ValidatorDeletedCallBack.bind(this)).on("connected", function () {
            console.log("ValidatorDeleted monitor init success");
        });
        // 监听ValidatorUpdate
        this.contract.events.ValidatorUpdated(this.ValidatorUpdatedCallBack.bind(this)).on("connected", function () {
            console.log("ValidatorUpdated monitor init success");
        });
    }

    async Sync() {
        const t = this;
        const block_num = await this.db.get_block_num();
        this.contract.getPastEvents("allEvents", { fromBlock: block_num + 1, toBlock: 'latest' }, async function (error, events) {
            for (const item of events) {
            try{
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
            }catch(e){
                console.log(e)
            }

            }
        });
    }

    GetOperatorNum(){
        this.contract.methods.operatorCount().call().then(res=>{
            return res;
        })
    }

    GetValidatorNum(){
        this.contract.methods.validatorCount().call().then(res=>{
            return res;
        })
    }

    operators_list(page,perPage,validatorsCount,status,ordering){
        return this.db.operators_list(page,perPage,validatorsCount,status,ordering);
    }
    validators_list(page, perPage, operators){
        return this.db.validators_list(page, perPage, operators);
    }
    get_validators_by_node(operator_pk, offset, limit){
        return this.db.get_validators_by_node(operator_pk,offset,limit);
    }
    collect_performance(params){
        return this.db.collect_performance(params);
    }
    operator_get_performance(operator_address, period, current_epoch){
        return this.db.operator_get_performance(operator_address, period, current_epoch);
    }
    validator_get_performance(validator_pk, period){
        return this.db.validator_get_performance(validator_pk, period);
    }
    validator_get_duties(validator_pk, page, perPage){
        return this.db.validator_get_duties(validator_pk, page, perPage);
    }
    validators_list_in_operator(page, perPage, operator_address){
        return this.db.validators_list_in_operator(page, perPage, operator_address);
    }

    constructor(){
        const init = (async ()=>{
            // 获取合约实例
            this.contract = new web3.eth.Contract(
                config.ABI,
                config.CONTRACT_ADDRESS
            );
            this.db = new Db();
            await this.Sync();
            this.EventListen();
            delete this.then;
            return this;
        })();
        this.then = init.then.bind(init);
    }
}

module.exports = Dvf