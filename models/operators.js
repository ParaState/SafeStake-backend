const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('operators', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
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
    tableName: 'operators',
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
