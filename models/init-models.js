var DataTypes = require("sequelize").DataTypes;
var _config = require("./config");
var _duties = require("./duties");
var _duties_operators_map = require("./duties_operators_map");
var _operators = require("./operators");
var _tx_records = require("./tx_records");
var _validators = require("./validators");
var _validators_operators_map = require("./validators_operators_map");

function initModels(sequelize) {
  var config = _config(sequelize, DataTypes);
  var duties = _duties(sequelize, DataTypes);
  var duties_operators_map = _duties_operators_map(sequelize, DataTypes);
  var operators = _operators(sequelize, DataTypes);
  var tx_records = _tx_records(sequelize, DataTypes);
  var validators = _validators(sequelize, DataTypes);
  var validators_operators_map = _validators_operators_map(sequelize, DataTypes);

  duties_operators_map.belongsTo(duties, { as: "duty", foreignKey: "duty_id"});
  duties.hasMany(duties_operators_map, { as: "duties_operators_maps", foreignKey: "duty_id"});
  duties_operators_map.belongsTo(operators, { as: "operator", foreignKey: "operator_id"});
  operators.hasMany(duties_operators_map, { as: "duties_operators_maps", foreignKey: "operator_id"});
  validators_operators_map.belongsTo(operators, { as: "operator_pk_operator", foreignKey: "operator_pk"});
  operators.hasMany(validators_operators_map, { as: "validators_operators_maps", foreignKey: "operator_pk"});
  duties.belongsTo(validators, { as: "validator", foreignKey: "validator_id"});
  validators.hasMany(duties, { as: "duties", foreignKey: "validator_id"});
  validators_operators_map.belongsTo(validators, { as: "validator", foreignKey: "validator_id"});
  validators.hasMany(validators_operators_map, { as: "validators_operators_maps", foreignKey: "validator_id"});

  return {
    config,
    duties,
    duties_operators_map,
    operators,
    tx_records,
    validators,
    validators_operators_map,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
