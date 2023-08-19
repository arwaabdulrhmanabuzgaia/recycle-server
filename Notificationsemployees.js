const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Notificationsemployees= db.define('notificationsemployees',
{
    id_notify:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    tableName: 'notificationsemployees',
    freezetaTableName: true ,
}
)
module.exports =Notificationsemployees