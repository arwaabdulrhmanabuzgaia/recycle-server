const {Sequelize  , DataTypes }  = require ('sequelize')
const db = require ('../config/db.js')
const users= db.define('users',
{
    id_donor:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    donor_name:{
        type: Sequelize.STRING,
    },
    donor_email:{
        type: Sequelize.STRING,
    },
    password:{
        type: Sequelize.STRING,
    },
    profile_image:{
        type: Sequelize.STRING,
    },
    donor_address:{
        type: Sequelize.STRING, 
    },
    phone_number:{
        type:  Sequelize.STRING,
    },
    is_verified:{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    token:{
        type: Sequelize.STRING,
    },
    reset_password_token:{
        type: Sequelize.STRING,
    },
   
}, 
{
    timestamps: false,
    tableName: 'users',
    freezetaTableName: true ,
}

)
module.exports =users