const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Devices_being_dismantled= db.define('devices_being_dismantled',
{
    id_being_dismantled:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_Examination:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.STRING, 
    },
}, 
{
    timestamps: false,
    tableName: 'devices_being_dismantled',
    freezetaTableName: true ,
}
)
module.exports =Devices_being_dismantled