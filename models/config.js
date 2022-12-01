const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('config', {
    k: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    v: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'config',
    timestamps: false,
    indexes: [
      {
        name: "k",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "k" },
        ]
      },
    ]
  });
};
