const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Examination_requests= db.define('examination_requests',
{
    id_Examination:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_destruction:{
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
    tableName: 'examination_requests',
    freezetaTableName: true ,
}
)
module.exports =Examination_requests