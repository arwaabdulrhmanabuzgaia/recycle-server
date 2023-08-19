const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Devices_being_developed= db.define('devices_being_developed',
{
    id_being_developed :{
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
    tableName: 'devices_being_developed',
    freezetaTableName: true ,
}
)
module.exports =Devices_being_developed