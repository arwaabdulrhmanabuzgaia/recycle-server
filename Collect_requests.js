const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Collect_requests = db.define('Collect_requests', {
    id_collect:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_request:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.STRING, 
    },
}, 
{
    timestamps: false,
    tableName: 'collect_requests',
    freezetaTableName: true ,
});
  
  Collect_requests.associate = (models) => {
    Collect_requests.hasOne(models.Donation_requests, {
      foreignKey: 'collectRequestId',
      as: 'donationRequest',
    });
  };
module.exports =Collect_requests