const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Donation_requests = db.define('Donation_requests', 
{
    id_request:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      id_donor:{
          type: DataTypes.INTEGER,
      },
      Trade_mark:{
          type: Sequelize.STRING,
      },
      number:{
          type: DataTypes.INTEGER,
      },
      Item_name:{
          type: Sequelize.STRING,
      },
      id_classification:{
          type: DataTypes.INTEGER,
      },
      classification:{
          type: DataTypes.STRING,
      },
      Status:{
          type: Sequelize.STRING, 
      },
      Status_devices:{
          type: Sequelize.STRING, 
      }
     
  }, 
  {
      timestamps: false,
      tableName: 'donation_requests',
      freezetaTableName: true ,
  
  });
  
  Donation_requests.associate = (models) => {
    Donation_requests.belongsTo(models.Collect_requests, {
      foreignKey: 'collectRequestId',
      as: 'collectRequest',
    });
  };

module.exports =Donation_requests