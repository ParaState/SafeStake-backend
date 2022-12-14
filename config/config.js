module.exports = {
    SERVER_PORT: process.env.SERVER_PORT,
    WEB_PROVIDER: process.env.WEB_PROVIDER,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    BEACONCHA_API:process.env.BEACONCHA_API,
    MYSQL: {
        host: process.env.MYSQLDB_HOST,
        port: process.env.MYSQLDB_PORT,
        user: process.env.MYSQLDB_USER,
        password: process.env.MYSQLDB_ROOT_PASSWORD,
        database: process.env.MYSQLDB_DATABASE,
    },
    SEQUELIZE:{
        host: process.env.MYSQLDB_HOST,
        port: process.env.MYSQLDB_PORT,
        username: process.env.MYSQLDB_USER,
        password: process.env.MYSQLDB_ROOT_PASSWORD,
        database: process.env.MYSQLDB_DATABASE,
        dialect:"mysql"
    },
    "ABI": [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "validatorPublicKey",
                    "type": "bytes"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "index",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "operatorPublicKey",
                    "type": "bytes"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "sharedPublicKey",
                    "type": "bytes"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "encryptedKey",
                    "type": "bytes"
                }
            ],
            "name": "OessAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "ownerAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "publicKey",
                    "type": "bytes"
                }
            ],
            "name": "OperatorAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "publicKey",
                    "type": "bytes"
                }
            ],
            "name": "OperatorDeleted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "ownerAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "publicKey",
                    "type": "bytes"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "index",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes",
                            "name": "operatorPublicKey",
                            "type": "bytes"
                        },
                        {
                            "internalType": "bytes",
                            "name": "sharedPublicKey",
                            "type": "bytes"
                        },
                        {
                            "internalType": "bytes",
                            "name": "encryptedKey",
                            "type": "bytes"
                        }
                    ],
                    "indexed": false,
                    "internalType": "struct ISafeStakeNetwork.Oess[]",
                    "name": "oessList",
                    "type": "tuple[]"
                }
            ],
            "name": "ValidatorAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "ownerAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "publicKey",
                    "type": "bytes"
                }
            ],
            "name": "ValidatorDeleted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "ownerAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "publicKey",
                    "type": "bytes"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "index",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes",
                            "name": "operatorPublicKey",
                            "type": "bytes"
                        },
                        {
                            "internalType": "bytes",
                            "name": "sharedPublicKey",
                            "type": "bytes"
                        },
                        {
                            "internalType": "bytes",
                            "name": "encryptedKey",
                            "type": "bytes"
                        }
                    ],
                    "indexed": false,
                    "internalType": "struct ISafeStakeNetwork.Oess[]",
                    "name": "oessList",
                    "type": "tuple[]"
                }
            ],
            "name": "ValidatorUpdated",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_name",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "_ownerAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "_publicKey",
                    "type": "bytes"
                }
            ],
            "name": "addOperator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_ownerAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "_publicKey",
                    "type": "bytes"
                },
                {
                    "internalType": "bytes[]",
                    "name": "_operatorPublicKeys",
                    "type": "bytes[]"
                },
                {
                    "internalType": "bytes[]",
                    "name": "_sharesPublicKeys",
                    "type": "bytes[]"
                },
                {
                    "internalType": "bytes[]",
                    "name": "_encryptedKeys",
                    "type": "bytes[]"
                }
            ],
            "name": "addValidator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "_publicKey",
                    "type": "bytes"
                }
            ],
            "name": "deleteOperator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "_publicKey",
                    "type": "bytes"
                }
            ],
            "name": "deleteValidator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "operatorCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "",
                    "type": "bytes"
                }
            ],
            "name": "operators",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "ownerAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "publicKey",
                    "type": "bytes"
                },
                {
                    "internalType": "uint256",
                    "name": "score",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "_operatorPublicKey",
                    "type": "bytes"
                },
                {
                    "internalType": "uint256",
                    "name": "_validatorsPerOperator",
                    "type": "uint256"
                }
            ],
            "name": "setValidatorsPerOperator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_validatorsPerOperatorLimit",
                    "type": "uint256"
                }
            ],
            "name": "setValidatorsPerOperatorLimit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "_publicKey",
                    "type": "bytes"
                },
                {
                    "internalType": "bytes[]",
                    "name": "_operatorPublicKeys",
                    "type": "bytes[]"
                },
                {
                    "internalType": "bytes[]",
                    "name": "_sharesPublicKeys",
                    "type": "bytes[]"
                },
                {
                    "internalType": "bytes[]",
                    "name": "_encryptedKeys",
                    "type": "bytes[]"
                }
            ],
            "name": "updateValidator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "validatorCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "_operatorPublicKey",
                    "type": "bytes"
                }
            ],
            "name": "validatorsPerOperatorCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "validatorsPerOperatorLimit",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}