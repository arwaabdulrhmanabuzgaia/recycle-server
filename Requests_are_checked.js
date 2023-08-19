const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Requests_are_checked= db.define('requests_are_checked',
{
    id_checked:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_collected:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.STRING, 
    },
}, 
{
    timestamps: false,
    tableName: 'requests_are_checked',
    freezetaTableName: true ,
}
)
module.exports =Requests_are_checked