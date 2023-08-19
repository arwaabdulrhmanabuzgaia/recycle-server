const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Device_developed= db.define('device_developed',
{
    id_developed:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_being_developed:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.STRING, 
    },
    Report:{
        type: Sequelize.STRING, 
    }
}, 
{
    timestamps: false,
    tableName: 'device_developed',
    freezetaTableName: true ,
}
)
module.exports =Device_developed