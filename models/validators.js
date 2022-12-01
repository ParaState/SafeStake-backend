const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('validators', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    address: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    pk: {
      type: DataTypes.STRING(700),
      allowNull: false,
      unique: "pk"
    }
  }, {
    sequelize,
    tableName: 'validators',
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
        name: "pk",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
