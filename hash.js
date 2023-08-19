const bcrypt = require('bcrypt');
const hashpassword =  (password) =>{
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
}
const verifypassword = (password ,hash) =>{
    return bcrypt.compare(password, hash)
}

module.exports ={
    hashpassword,verifypassword
}
