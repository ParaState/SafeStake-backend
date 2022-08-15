var Web3 = require('web3');

var config = require("../config/config.json")

// 使用WebSocket协议 连接节点
let web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider(config.WEB_PROVIDER));

console.log("OperatorAdded:"+web3.utils.sha3('OperatorAdded(string,address,bytes)'))
console.log("OperatorDeleted:"+web3.utils.sha3('OperatorDeleted(string,bytes)'))
console.log("ValidatorAdded:0x8674c0b4bd63a0814bf1ae6d64d71cf4886880a8bdbd3d7c1eca89a37d1e9271")
console.log("ValidatorDeleted:"+web3.utils.sha3("ValidatorDeleted(address,bytes)"))