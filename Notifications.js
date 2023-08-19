const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Notifications= db.define('notifications',
{
    id_notify:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_donor:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.BOOLEAN,
    },
    Title:{
        type: Sequelize.STRING, 
    },

}, 
{
    timestamps: false,
    tableName: 'notifications',
    freezetaTableName: true ,
}
)
module.exports =Notifications