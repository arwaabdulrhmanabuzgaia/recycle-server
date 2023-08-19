const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Devices_parts = db.define('devices_parts', 
{
      id_part:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Trade_mark:{
          type: Sequelize.STRING,
      },
      Name_part:{
          type: DataTypes.INTEGER,
      },
      device_classification:{
        type: DataTypes.STRING,
      },
      Status:{
          type: Sequelize.STRING, 
      },
      amount:{
        type: DataTypes.INTEGER,
      }
     
  }, 
  {
      timestamps: false,
      tableName: 'devices_parts',
      freezetaTableName: true ,
  
  });
  

module.exports =Devices_parts