const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Collected_requests= db.define('collected_request',
{
    id_collected:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_collect:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.STRING, 
    },
}, 
{
    timestamps: false,
    tableName: 'collected_request',
    freezetaTableName: true ,
}
)
module.exports =Collected_requests