const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('validators_operators_map', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    validator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'validators',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    idx: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    operator_pk: {
      type: DataTypes.STRING(700),
      allowNull: false,
      references: {
        model: 'operators',
        key: 'pk'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    shared_pk: {
      type: DataTypes.STRING(700),
      allowNull: false
    },
    encrypted_key: {
      type: DataTypes.STRING(700),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'validators_operators_map',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "validator_map",
        using: "BTREE",
        fields: [
          { name: "validator_id" },
        ]
      },
      {
        name: "operator_map",
        using: "BTREE",
        fields: [
          { name: "operator_pk" },
        ]
      },
    ]
  });
};
