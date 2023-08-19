const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const Employees= db.define('employees',
{
    id_employee:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name_employee:{
        type: Sequelize.STRING,
    },
    phone_employee:{
        type: Sequelize.STRING,
    },
    email_employee:{
        type: Sequelize.STRING,
    },
    password:{
        type: Sequelize.STRING,
    },
    department:{
        type: Sequelize.STRING, 
    },
    address_employee:{
        type: Sequelize.STRING, 
    },
    is_verified:{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    token:{
        type: Sequelize.STRING,
    },
    reset_pass:{
        type: Sequelize.STRING,
    },
    activation:{
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    roles:{
        type: DataTypes.INTEGER,
    },
    employeetype:{
        type: Sequelize.STRING,
    }

   
}, 
{
    timestamps: false,
    tableName: 'employees',
    freezetaTableName: true ,
}
)


module.exports =Employees