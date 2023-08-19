const {Sequelize } = require('sequelize');
const Donationrequests=require('./models/Donation_requests.js');
const db = new Sequelize( 'e_recycle2' , 'anas3' , 'root123' , {
    dialect:'mysql',
    host: '78.135.89.69',
    port: 3306,
    define: {
        timestamps: false
      }
    }
)

async function testConnection (){
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
}

testConnection();

const allrequests =  Donationrequests.findAll({
    where: {
      Status:"انتظار",
    },
    if(allrequests){
      res.send(
          {
              success : true,
              requests : allrequests
          }
      )
      console.log(allrequests)
  }
 
  });


//module.exports = db