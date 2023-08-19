const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Information_destruction= db.define('information_destruction',
{
    id_destruction :{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_checked:{
        type: DataTypes.INTEGER,
    },
    Status:{
        type: Sequelize.STRING, 
    },
}, 
{
    timestamps: false,
    tableName: 'information_destruction',
    freezetaTableName: true ,
}
)
module.exports =Information_destruction