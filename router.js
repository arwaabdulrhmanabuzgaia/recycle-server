const  express = require('express');
const router = express.Router();
const usersmodel=require('../models/Users.js')
const Employees=require('../models/Employee.js')
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const Notificationsemployees = require('../models/notificationsemployees');
const Donationrequests=require('../models/Donation_requests.js')
const {hashpassword,verifypassword}=require('../utils/hash.js')
const {validationResult,check} = require("express-validator");
const {sendConfirmEmail}=require('./nodemailer.js')
const Collect_requests=require('../models/Collect_requests.js')
const Notifications = require('../models/Notifications.js')
const Collected_requests=require('../models/Collected_requests.js')
const Requests_are_checked=require('../models/Requests_are_checked.js')
const Information_destruction=require('../models/Information_destruction.js')
const Examination_requests = require('../models/Examination_requests.js')
const Devices_being_develope=require('../models/Devices_being_developed.js')
const Device_developed=require('../models/Device_developed.js')
const Devices_being_dismantled=require('../models/Devices_being_dismantled.js')
const Devices_parts=require('../models/Devices_parts.js')

/////////////////////////login////////////////////////////
router.post('/', [
    check('donor_email').trim().isEmail().normalizeEmail(),
    check('password').trim().isLength({ min: 8, max: 20 }).escape()
  ], async (req, res) => {
  
    const { donor_email, password } = req.body;
    console.log(req.body);
  
    try {
      const user = await usersmodel.findOne({
        where: {
          donor_email: donor_email,
        }
      });
      if (user && verifypassword(password, user.password) && user.is_verified) {
        // User exists, password is correct, and email is verified
        res.send({
          success: true,
          msg: 'User exists and verified',
          id_donor: user.id_donor,
          donor_email: user.donor_email,
          password: user.password
        });
      } else {
        // User does not exist or password is incorrect or email is not verified
        res.send({
          success: false,
          msg: 'User does not exist or credentials are incorrect'
        });
      }
    } catch (error) {
      console.error(error.message);
      res.send({
        success: false,
        msg: 'An error occurred'
      });
    }
  });
 ///////////////////////// signup/////////////////////// 
router.post('/signup' ,[
    check('donor_name').isLength({ max: 90 }).whitelist("[a-zA-Z]+"),
    check('donor_email').trim().isEmail().normalizeEmail(),
    check('password').trim().isLength({ min: 8 , max: 20 }).escape(),
    check('donor_address').isLength({ max: 90 }),
    check('phone_number').isMobilePhone()
], async (req, res) => {
    console.log("Body==>", req.body);
       // Errors in a single json...
  const errors = validationResult(req)
    
        // If there error return the error json...
   if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() ,
        message:"check your fields"

     });
    }  
  
  try {
    const characters =
    "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let token="";
    for(let i = 0; i < characters.length; i++) {
        token += characters[Math.floor(Math.random()* characters.length)];
    }

    const {donor_name ,donor_email, password,donor_address,phone_number} = req.body
    const hash = hashpassword (password)
    console.log(hash)
    const check = await usersmodel.findOne({
        where : {
            donor_email : donor_email 
        }
    })
    if(check) {
        return res.send({
            success: false,
            msg: 'Username already exists'
    })}else{
        sendConfirmEmail(donor_email,token)
        const createuser = await usersmodel.create({
            donor_name : donor_name,
            donor_email: donor_email,
            password : hash,
            donor_address:donor_address,
            phone_number:phone_number,
            token:token
            
        })
        if(createuser) {
        const getid = await usersmodel.findOne(
            {
                where : {
                    donor_email : donor_email
                }
            }
        )
        if(getid) {
            res.send({
                success: true,
                id_donor : getid.id_donor,
                donor_name : getid.donor_name,
                donor_email : getid.donor_email,
                password : getid.hash,
                donor_address : getid.donor_address,
                phone_number : getid.phone_number,
                token:getid.token
        })
       
       
        }
       
    }else{
        res.send({
            success: false,
            
        })
    }
   }
  
  }
  catch(err){
    return  res.status(500).json({
        message:err.message
    })
  } 
});
router.post('/verify/:token', async (req, res) => {
    let token = req.params.token;
    const check = await usersmodel.findOne({
        where : {
            token : token
        }
    })
    check.is_verified=true;
    check.save();
    res.send("Verfied");
    
})
//////////////////////////// reset password ////////////////////////////////
const jwt = require('jsonwebtoken');
const secretKey = 'your-secret-key';
// Send password reset email to the user
router.post('/forgot-password', async (req, res) => {
  const { donor_email } = req.body;
  const user = await usersmodel.findOne({ where: { donor_email:donor_email } });
  if (!user) {
    res.status(404).send({
      success: false,
      msg: 'User not found'
    });
  } else {
    // Create a reset token that expires in 1 hour
    const resetToken = jwt.sign({ id: user.id }, secretKey, { expiresIn: 3600 });
    // Send the reset token to the user's email
    // ...
    res.send({
      success: true,
      msg: 'Password reset link sent successfully'
    });
  }
});

// Handle password reset request
router.post('/reset-password-user', async (req, res) => {
  const { reset_token, new_password } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(reset_token, secretKey);
    const user = await usersmodel.findOne({ where: { id: decoded.id } });
    if (!user) {
      res.status(404).send({
        success: false,
        msg: 'User not found'
      });
    } else {
      // Update password
      const hashedPassword = await hashPassword(new_password);
      await user.update({ password: hashedPassword });
      res.send({
        success: true,
        msg: 'Password updated successfully'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(401).send({
      success: false,
      msg: 'Invalid or expired reset token'
    });
  }
});
/////////////////////////////////////////update donor data//////////////////////////////////////////
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { donor_email, password , donor_name ,donor_address,phone_number } = req.body;
    console.log(id)
    try {
      const donor = await usersmodel.findOne({ where: { id_donor: id } });
      if (!donor) {
        res.status(404).send({
          success: false,
          msg: 'Donor not found'
        });
      } else {
        // Update donor data
        await usersmodel.update(
          {
            donor_name : donor_name,
            donor_emai:donor_email,
            password : hashpassword(password),
            donor_address : donor_address,
            phone_number : phone_number,
          },
          { where: { id_donor: id } }
        );
        
        res.send({
          success: true,
          msg: 'Donor data updated successfully'
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        success: false,
        msg: 'Failed to update donor data'
      });
    }
  });
//////////////////////// change pass /////////////////////////
router.put('/:id/change-password', async (req, res) => {
    const { current_password, new_password } = req.body;
    const id = req.params.id;
  
    try {
      // Find donor by id_donor
      const donor = await usersmodel.findByPk(id);
      if (!donor) {
        res.status(404).send({
          success: false,
          msg: 'donor not found'
        });
      } else {
        // Verify current password
        const isPasswordValid = verifypassword(current_password, donor.password);
        if (!isPasswordValid) {
          res.status(401).send({
            success: false,
            msg: 'Invalid current password'
          });
        } else {
          // Update password
          const hashedPassword = hashpassword(new_password);
          await donor.update({ password: hashedPassword });
          res.send({
            success: true,
            msg: 'Password updated successfully'
          });
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        success: false,
        msg: 'Failed to update password'
      });
    }
  });
///////////////// update user data //////////////////
router.post('/updatedatauser' , async(req , res) => {
    try {    
        const { donor_name , donor_email , donor_address ,phone_number,id_donor} = req.body 
            const updatedatauser =  usersmodel.update(
                {          
                    donor_name:donor_name,
                    donor_email: donor_email,
                    donor_address:donor_address,
                    phone_number:phone_number,
                 }, {
                where: {
                    id_donor:id_donor
                }
              });
            if(updatedatauser) {
                res.send(
                    {
                        masg:"update  Successfully",
                        status:true
                    }
                )
            }else{
                res.send(
                    {
                        status: false,
                        msg : "the user was not update"
                    }
                ) 
            }

    }catch (err) {console.log(err)}       
})
/////////////////////// add device ////////////////////////
router.post('/addnewdevice', async (req , res) => {
    const {Trade_mark , number , Item_name , id_classification ,id_donor,Status_devices,classification} = req.body 
    console.log(req.body)
    try { 
            const addnewdevice =  Donationrequests.create({
                id_donor: id_donor,
                Trade_mark: Trade_mark,
                number:number,
                Item_name:Item_name,
                id_classification:id_classification,
                classification:classification,
                Status:"انتظار",
                Status_devices:Status_devices

            })      
            if(addnewdevice) {
              const newNotification = Notificationsemployees.create({
                Status: 0,
                Title: 'تمت إضافة جهاز'
               });
        
               if (newNotification) {
                  console.log('تم إرسال الإشعار بنجاح');
                } else {
                  console.log('لم يتم إرسال الإشعار');
                }
                res.send(
                    {
                        success: true,
                        message: ' device Added Successfully'
                    }
                )
            }else{
                res.send(
                    {
                        success: false,
                         message: 'Something Went Wrong'
                    }
                )
            }
    }catch (err) {console.log(err.message)}       
})
///////////// delete device /////////////////
router.post('/deletdevice' , async(req , res) => {
    const {id_request} = req.body

    const deletedevice = await Donationrequests.destroy(
        {
            where:{
                id_request:id_request
            }
        }
    )
    if(deletedevice){
        res.send(
            {
                status: true,
                msg : "device was deleted successfully"
            }
        )
    }else{
        res.send(
            {
                status: false,
                msg : "the device was not deleted"
            }
        )
    }

})
///////////////////// update the device /////////////////
router.post('/updatedevice' , async(req , res) => {
    try {    
        const {Trade_mark , number , Item_name , id_classification,id_request,Status_devices} = req.body 
            const updatedevice =  Donationrequests.update(
                {          
                    Trade_mark: Trade_mark,
                    number:number,
                    Item_name:Item_name,
                    Status_devices:Status_devices
                 }, {
                where: {
                    id_request: id_request,
                    id_classification:id_classification,
                    Status:"انتظار"
                }
              });
            if(updatedevice) {
                res.send(
                    {
                        masg:"update  Successfully",
                        status:true
                    }
                )
            }else{
                res.send(
                    {
                        status: false,
                        msg : "the device was not update"
                    }
                ) 
            }

    }catch (err) {console.log(err)}       
})
///////////////// Bring the user's devices //////////////////
router.post('/getdevicesuser' , async(req , res ) => {
    const {id_donor} = req.body
    console.log(req.body)
    const getdevicesuser = await Donationrequests.findAll({
        where : {
            id_donor:id_donor
        }
    }
    );
    if(getdevicesuser){
        res.send(
            {
                success : true,
                devices : getdevicesuser
            }
        )
    }else{
        res.send(
            {
                success : false,
                masg : 'Something Went Wrong'
                
            }
        )
    }

})
//////////////// get all requests ///////////////
router.get('/allrequests' , async(req , res ) => {
    const allrequests = await Donationrequests.findAll({
      where: {
        Status:"انتظار",
      },
    });
    if(allrequests){
        res.send(
            {
                success : true,
                requests : allrequests
            }
        )
    }else{
        res.send(
            {
                success : false,
                masg : 'Something Went Wrong'
                
            }
        )
    }

})
////////////////// search request //////////////// 
router.post('/searchrequests' , async(req , res ) => {
  const {classification}=req.body
  const allrequests = await Donationrequests.findAll({
    where: {
      Status:"انتظار",
      classification:classification
    },
  });
  if(allrequests){
      res.send(
          {
              success : true,
              requests : allrequests
          }
      )
  }else{
      res.send(
          {
              success : false,
              masg : 'Something Went Wrong'
              
          }
      )
  }

})
//////////////// accept requests ////////////////
router.put('/:id/accept', (req, res) => {
    Donationrequests.update({ Status: "تم القبول" }, { where: { id_request: req.params.id } })
      .then(() => {
        Collect_requests.create({ id_request: req.params.id, Status: 'جارى تجميع' })
          .then(() => {
            res.send('تم قبول الطلب ونقل البيانات إلى جدول تجميع الطلبات');
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  });
////////// Reject the request and send a notice ///////
router.put('/:id/reject', (req, res) => {
    Donationrequests.update({ Status: 'مرفوض' }, { where: { id_request: req.params.id } })
    Donationrequests.findOne({ where: { id_request: req.params.id } })
    .then((donationRequest) => {
      const id_donor = donationRequest.id_donor;
      Notifications.create({
        Status: 'false',
        Title: 'تم رفض الطلب',
        id_donor: id_donor,
      })
      .then(() => {
        res.send('تم رفض الطلب وإرسال إشعار للمتبرع');
      })
      .catch(err => console.log(err.message));
    })
    .catch(err => console.log(err));
  });
//////////////// get all Collect requests  ///////////////
router.get('/allCollectrequests', async (req, res) => {
  try {
    const allCollectrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where:{
        Status: 'تم القبول'
      }
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectrequests.map(request => request.id_request),
        Status:'جارى تجميع'
      },
    });

    const responseData = allCollectrequests.map(collectRequest => {
      const relatedDonationRequests = donationRequests.filter(request => request.id_request === collectRequest.id_request && request.Status !== 'مرفوض');
      return {
        ...collectRequest.toJSON(),
        donationRequests: relatedDonationRequests,
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
///////////////  search collect ///////////////
router.post('/searchcollect', async (req, res) => {
  try {
    const {classification}=req.body
    const allCollectrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where:{
        Status: 'تم القبول',
        classification:classification
      }
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectrequests.map(request => request.id_request),
        Status:'جارى تجميع'
      },
    });

    const responseData = allCollectrequests.map(collectRequest => {
      const relatedDonationRequests = donationRequests.filter(request => request.id_request === collectRequest.id_request && request.Status !== 'مرفوض');
      return {
        ...collectRequest.toJSON(),
        donationRequests: relatedDonationRequests,
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
///////////// collected device ///////////////
router.put('/:id/collectdevice', (req, res) => {
        Collect_requests.update({ Status: 'تم التجميع' }, { where: { id_collect: req.params.id } })
         Collected_requests.create({ id_collect: req.params.id, Status: 'جارى الفحص' })
          .then(() => {
            res.send(' تم التجميع ونقل البيانات إلى جدول الطلبات تم تجميعها');
          })
          .catch(err => console.log(err));
    
  });
////////// get all collected devices //////////
router.get('/allCollectedrequests', async (req, res) => {
    try {
      const allCollectedrequests = await Donationrequests.findAll({
        attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
        where: {
          Status: 'تم القبول',
        },
      });
  
      const donationRequests = await Collect_requests.findAll({
        where: {
          id_request: allCollectedrequests.map(request => request.id_request),
          Status: 'تم التجميع',
        },
      });
  
      const collectedRequests = await Collected_requests.findAll({
        where: {
          id_collect: donationRequests.map(collect => collect.id_collect),
          Status: 'جارى الفحص'
        },
      });
  
      const responseData = collectedRequests.map(collectedRequest => {
        const relatedDonationRequest = donationRequests.find(request => request.id_collect === collectedRequest.id_collect);
        const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);
  
        return {
          collectedRequest: collectedRequest.toJSON(),
          donationRequest: relatedDonationRequest.toJSON(),
          allCollectedRequest: relatedAllCollectedRequest.toJSON(),
        };
      });
  
      res.send({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({
        success: false,
        message: 'Something went wrong',
      });
    }
  });
////////////requests_are_checked ////////////
router.put('/:id/collecteddevice', (req, res) => {
    Collected_requests.update({ Status: 'تم ارسال للفحص' }, { where: { id_collected: req.params.id } })
    Requests_are_checked.create({ id_collected: req.params.id, Status: 'جارى ارسال للاتلاف' })
      .then(() => {
        res.send(' تم ارسال للفحص ونقل البيانات إلى جدول طلبات جارى فحصها ');
      })
      .catch(err => console.log(err.message));
});
/////////////// search collected //////////
router.post('/searchcollected', async (req, res) => {
  try {
    const {classification}=req.body
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        classification:classification
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
        Status: 'تم التجميع',
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
        Status: 'جارى الفحص'
      },
    });

    const responseData = collectedRequests.map(collectedRequest => {
      const relatedDonationRequest = donationRequests.find(request => request.id_collect === collectedRequest.id_collect);
      const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);

      return {
        collectedRequest: collectedRequest.toJSON(),
        donationRequest: relatedDonationRequest.toJSON(),
        allCollectedRequest: relatedAllCollectedRequest.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
////////// get all requests_are_checked //////////
router.get('/allrequestsarechecked', async (req, res) => {
    try {
      const allCollectedrequests = await Donationrequests.findAll({
        attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
        where: {
          Status: 'تم القبول',
        },
      });
  
      const donationRequests = await Collect_requests.findAll({
        where: {
          id_request: allCollectedrequests.map(request => request.id_request),
          Status: 'تم التجميع',
        },
      });
  
      const collectedRequests = await Collected_requests.findAll({
        where: {
          id_collect: donationRequests.map(collect => collect.id_collect),
          Status: 'تم ارسال للفحص'
        },
      });
  
      const requestsAreChecked = await Requests_are_checked.findAll({
        where: {
          id_collected: collectedRequests.map(collected => collected.id_collected),
         
        },
      });
  
      const responseData = collectedRequests.map(collectedRequest => {
        const relatedDonationRequest = donationRequests.find(request => request.id_collect === collectedRequest.id_collect);
        const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);
        const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_collected === collectedRequest.id_collected);
  
        return {
          collectedRequest: collectedRequest.toJSON(),
          donationRequest: relatedDonationRequest.toJSON(),
          allCollectedRequest: relatedAllCollectedRequest.toJSON(),
          requestsAreChecked: relatedRequestsAreChecked.toJSON(),
        };
      });
  
      res.send({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({
        success: false,
        message: 'Something went wrong',
      });
    }
  });
////////////////// seacrch requests_are_checked /////////////
router.post('/searchrequestschecked', async (req, res) => {
  try {
    const {classification}=req.body
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        classification:classification
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
        Status: 'تم التجميع',
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
        Status: 'تم ارسال للفحص'
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
       
      },
    });

    const responseData = collectedRequests.map(collectedRequest => {
      const relatedDonationRequest = donationRequests.find(request => request.id_collect === collectedRequest.id_collect);
      const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);
      const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_collected === collectedRequest.id_collected);

      return {
        collectedRequest: collectedRequest.toJSON(),
        donationRequest: relatedDonationRequest.toJSON(),
        allCollectedRequest: relatedAllCollectedRequest.toJSON(),
        requestsAreChecked: relatedRequestsAreChecked.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});

/////////// information_destruction  //////////
router.put('/:id/informationdestruction', (req, res) => {
    Requests_are_checked.update({ Status: ' تم ارسال للاتلاف ' }, { where: { id_checked: req.params.id } })
    Information_destruction.create({ id_checked: req.params.id, Status: 'تحت اتلاف' })
      .then(() => {
        res.send(' تم ارسال للاتلاف ونقل البيانات إلى جدول اتلاف معلومات   ');
      })
      .catch(err => console.log(err.message));
});
////////// get all information_destruction //////////
router.get('/allinformationdestruction', async (req, res) => {
  try {
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
        Status: 'تم التجميع',
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
        Status: 'تم ارسال للفحص'
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
        Status: 'تحت اتلاف',
      },
    });

    const responseData = informationDestruction.map(information => {
      const relatedrequestsAreChecked = requestsAreChecked.find(checked => checked.id_checked === information.id_checked);
      const relatedallCollectedrequest = collectedRequests.find(collected => collected.id_collected === relatedrequestsAreChecked.id_collected);
      const relatedAllCollectRequest = donationRequests.find(collectRequest => collectRequest.id_collect === relatedallCollectedrequest.id_collect);
      const relatedallCollectedrequestsdata = allCollectedrequests.find(request => request.id_request === relatedAllCollectRequest.id_request);

      return {
        informationDestruction: information.toJSON(),
        collectedRequest: relatedallCollectedrequest.toJSON(),
        donationRequest: relatedAllCollectRequest.toJSON(),
        allCollectedRequest: relatedallCollectedrequestsdata.toJSON(),
        requestsAreChecked: relatedrequestsAreChecked.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
////////////////// seacrh  information_destruction /////////
router.post('/seacrhinformationdestruction', async (req, res) => {
  try {
    const {classification} = req.body
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        classification:classification
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
        Status: 'تم التجميع',
      },
    });
    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
        Status: 'تم ارسال للفحص'
      },
    });
    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
        Status: 'تحت اتلاف',
      },
    });

    const responseData = informationDestruction.map(information => {
      const relatedrequestsAreChecked = requestsAreChecked.find(checked => checked.id_checked === information.id_checked);
      const relatedallCollectedrequest = collectedRequests.find(collected => collected.id_collected === relatedrequestsAreChecked.id_collected);
      const relatedAllCollectRequest = donationRequests.find(collectRequest => collectRequest.id_collect === relatedallCollectedrequest.id_collect);
      const relatedallCollectedrequestsdata = allCollectedrequests.find(request => request.id_request === relatedAllCollectRequest.id_request);

      return {
        informationDestruction: information.toJSON(),
        collectedRequest: relatedallCollectedrequest.toJSON(),
        donationRequest: relatedAllCollectRequest.toJSON(),
        allCollectedRequest: relatedallCollectedrequestsdata.toJSON(),
        requestsAreChecked: relatedrequestsAreChecked.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
///////////// Examination_requests ////////////////
router.put('/:id/Examinationrequests', async (req, res) => {
    try {
      await Information_destruction.update({ Status: 'تم اتلاف' }, { where: { id_destruction: req.params.id } });
      await Examination_requests.create({ id_destruction: req.params.id, Status: 'تم الفحص' });
      res.send('تم الفحص ونقل البيانات إلى جدول الاجهزة تم فحصها');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Something went wrong');
    }
  });
///////////////// Save Report //////////////
router.post('/SaveReportExamination', async (req , res) => {
  const { id, Report } = req.body;
  console.log(req.body);
  try {
    const Devicedeveloped = await Examination_requests.update(
      {
        Report: Report,
      },
      {
        where: {
          id_Examination: id,
        },
      }
    );

    if (Devicedeveloped) {
      res.send({
        success: true,
        message: 'Report developed added successfully',
      });
    } else {
      res.send({
        success: false,
        message: 'Something went wrong',
      });
    }
  } catch (err) {
    console.log(err.message);
  }   
})
////////// show report //////////////////
router.post('/FetchReport', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const ReportExamination = await Examination_requests.findOne({
      where: {
        id_Examination: deviceId,
      },
      attributes: ['Report'],
    });

    if (ReportExamination) {
      res.send({
        success: true,
        ReportExamination: ReportExamination,
      });
    } else {
      res.send({
        success: false,
        message: 'Something went wrong',
      });
    }
  } catch (err) {
    console.log(err.message);
  }
});
///////////  get all Examination_requests ////////////
router.get('/allExaminationrequests', async (req, res) => {
  try {
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
        Status: 'تم التجميع',
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
        Status: 'تم ارسال للفحص'
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
        Status:'تم اتلاف',
      },
    });

    const Examinationrequests = await Examination_requests.findAll({
      where: {
        id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
        Status: 'تم الفحص',
      },
    });
    const responseData = Examinationrequests.map(destruction => {
      const relatedinformationDestruction = informationDestruction.find( information =>  information.id_destruction === destruction.id_destruction);
      const relatedrequestsAreChecked = requestsAreChecked.find(Checked => Checked.id_checked === relatedinformationDestruction.id_checked);
      const relatedcollectedRequests = collectedRequests.find(collectedRequest => collectedRequest.id_collected === relatedrequestsAreChecked.id_collected);
      const relateddonationRequests = donationRequests.find(collect => collect.id_collect === relatedcollectedRequests.id_collect);
      const relatedallCollectedrequestsdata = allCollectedrequests.find(request => request.id_request === relateddonationRequests.id_request);
      return {
        Examinationrequests:destruction.toJSON(),
        informationDestruction: relatedinformationDestruction.toJSON(),
        collectedRequest: relatedcollectedRequests.toJSON(),
        donationRequest: relateddonationRequests.toJSON(),
        allCollectedRequest: relatedallCollectedrequestsdata.toJSON(),
        requestsAreChecked: relatedrequestsAreChecked.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
////////////// search Examination_requests ///////////
router.post('/searchExaminationrequests', async (req, res) => {
  try {
    const {classification}=req.body
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        classification:classification
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
        Status: 'تم التجميع',
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
        Status: 'تم ارسال للفحص'
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
        Status:'تم اتلاف',
      },
    });

    const Examinationrequests = await Examination_requests.findAll({
      where: {
        id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
        Status: 'تم الفحص',
      },
    });
    const responseData = Examinationrequests.map(destruction => {
      const relatedinformationDestruction = informationDestruction.find( information =>  information.id_destruction === destruction.id_destruction);
      const relatedrequestsAreChecked = requestsAreChecked.find(Checked => Checked.id_checked === relatedinformationDestruction.id_checked);
      const relatedcollectedRequests = collectedRequests.find(collectedRequest => collectedRequest.id_collected === relatedrequestsAreChecked.id_collected);
      const relateddonationRequests = donationRequests.find(collect => collect.id_collect === relatedcollectedRequests.id_collect);
      const relatedallCollectedrequestsdata = allCollectedrequests.find(request => request.id_request === relateddonationRequests.id_request);
      return {
        Examinationrequests:destruction.toJSON(),
        informationDestruction: relatedinformationDestruction.toJSON(),
        collectedRequest: relatedcollectedRequests.toJSON(),
        donationRequest: relateddonationRequests.toJSON(),
        allCollectedRequest: relatedallCollectedrequestsdata.toJSON(),
        requestsAreChecked: relatedrequestsAreChecked.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
/////////// Devices_being_developed /////////////////
router.put('/:id/Devicesbeingdeveloped', async (req, res) => {
    try {
      await Examination_requests.update({ Status: 'تم النقل للتطوير' }, { where: { id_Examination: req.params.id } });
      await Devices_being_develope.create({ id_Examination: req.params.id, Status: 'جارى التطوير ' });
      res.send('تم الفحص ونقل البيانات إلى جدول الاجهزة جارى تطويرها ');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Something went wrong');
    }
  });
///////////  get all Devices_being_developed  ////////// 
router.get('/allDevicesbeingdeveloped', async (req, res) => {
    try {
      const allCollectedrequests = await Donationrequests.findAll({
        attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
        where: {
          Status: 'تم القبول',
        },
      });
  
      const donationRequests = await Collect_requests.findAll({
        where: {
          id_request: allCollectedrequests.map(request => request.id_request),
        },
      });
  
      const collectedRequests = await Collected_requests.findAll({
        where: {
          id_collect: donationRequests.map(collect => collect.id_collect),
        },
      });
  
      const requestsAreChecked = await Requests_are_checked.findAll({
        where: {
          id_collected: collectedRequests.map(collected => collected.id_collected),
        },
      });
  
      const informationDestruction = await Information_destruction.findAll({
        where: {
          id_checked: requestsAreChecked.map(checked => checked.id_checked),
        },
      });
  
      const examinationRequests = await Examination_requests.findAll({
        where: {
          id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
        
        },
      });
  
      const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);
  
      const devicesBeingDeveloped = await Devices_being_develope.findAll({
        where: {
          id_Examination: examinationRequestIds,
        },
      });
  
      const responseData = devicesBeingDeveloped.map(device => {
        const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === device.id_Examination);
        const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
        const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
        const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
        const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
        const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);
  
        return {
          device: device.toJSON(),
          examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
          informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
          requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
          collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
          donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
          allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
        };
      });
  
      res.send({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({
        success: false,
        message: 'Something went wrong',
      });
    }
  });
////////////////// search devices being developed ///////////
router.post('/searchbeingdeveloped', async (req, res) => {
  try {
    const {Trademark}=req.body
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        Trade_mark:Trademark,

      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
      },
    });

    const examinationRequests = await Examination_requests.findAll({
      where: {
        id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
      
      },
    });

    const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);

    const devicesBeingDeveloped = await Devices_being_develope.findAll({
      where: {
        id_Examination: examinationRequestIds,
      },
    });

    const responseData = devicesBeingDeveloped.map(device => {
      const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === device.id_Examination);
      const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
      const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
      const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
      const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
      const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);

      return {
        device: device.toJSON(),
        examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
        informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
        requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
        collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
        donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
        allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
////////// Device_developed   ////////////// 
router.put('/:id/Devicedeveloped', async (req, res) => {
    try {
      await Devices_being_develope.update({ Status: 'تم التطوير' }, { where: { id_being_developed: req.params.id } });
      await Device_developed.create({ id_being_developed: req.params.id, Status: 'تم التطوير ' });
      res.send('تم تطوير ونقل البيانات إلى جدول الاجهزة تم تطويرها ');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Something went wrong');
    }
  });
///////// get all Device_developed //////////
router.get('/allDevicesdeveloped', async (req, res) => {
    try {
      const allCollectedrequests = await Donationrequests.findAll({
        attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
        where: {
          Status: 'تم القبول',
        },
      });
  
      const donationRequests = await Collect_requests.findAll({
        where: {
          id_request: allCollectedrequests.map(request => request.id_request),
        },
      });
  
      const collectedRequests = await Collected_requests.findAll({
        where: {
          id_collect: donationRequests.map(collect => collect.id_collect),
        },
      });
  
      const requestsAreChecked = await Requests_are_checked.findAll({
        where: {
          id_collected: collectedRequests.map(collected => collected.id_collected),
        },
      });
  
      const informationDestruction = await Information_destruction.findAll({
        where: {
          id_checked: requestsAreChecked.map(checked => checked.id_checked),
        },
      });
  
      const examinationRequests = await Examination_requests.findAll({
        where: {
          id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
        },
      });
  
      const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);
  
      const devicesBeingDeveloped = await Devices_being_develope.findAll({
        where: {
          id_Examination: examinationRequestIds,
        },
      });
  
      const Devicedeveloped = await Device_developed.findAll({
        where: {
          id_being_developed: devicesBeingDeveloped.map(deviceBeingDeveloped => deviceBeingDeveloped.id_being_developed),
        },
      });
  
      const responseData = Devicedeveloped.map(device => {
        const relatedDeviceBeingDeveloped = devicesBeingDeveloped.find(deviceBeingDeveloped => deviceBeingDeveloped.id_being_developed === device.id_being_developed);
        const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === relatedDeviceBeingDeveloped.id_Examination);
        const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
        const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
        const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
        const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
        const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);
  
        return {
          device: device.toJSON(),
          deviceBeingDeveloped: relatedDeviceBeingDeveloped && relatedDeviceBeingDeveloped.toJSON(),
          examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
          informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
          requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
          collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
          donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
          allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
        };
      });
  
      res.send({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({
        success: false,
        message: 'Something went wrong',
      });
    }
  });
/////////////// search devices developed //////////////
router.post('/searchdeveloped', async (req, res) => {
  try {
    const {Trademark}=req.body
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        Trade_mark:Trademark
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
      },
    });

    const examinationRequests = await Examination_requests.findAll({
      where: {
        id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
      },
    });

    const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);

    const devicesBeingDeveloped = await Devices_being_develope.findAll({
      where: {
        id_Examination: examinationRequestIds,
      },
    });

    const Devicedeveloped = await Device_developed.findAll({
      where: {
        id_being_developed: devicesBeingDeveloped.map(deviceBeingDeveloped => deviceBeingDeveloped.id_being_developed),
      },
    });

    const responseData = Devicedeveloped.map(device => {
      const relatedDeviceBeingDeveloped = devicesBeingDeveloped.find(deviceBeingDeveloped => deviceBeingDeveloped.id_being_developed === device.id_being_developed);
      const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === relatedDeviceBeingDeveloped.id_Examination);
      const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
      const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
      const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
      const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
      const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);

      return {
        device: device.toJSON(),
        deviceBeingDeveloped: relatedDeviceBeingDeveloped && relatedDeviceBeingDeveloped.toJSON(),
        examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
        informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
        requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
        collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
        donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
        allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
//////////// report developed  ////////////
router.post('/SaveReportdeveloped', async (req, res) => {
  const { id, Report } = req.body;
  console.log(req.body);
  try {
    const Devicedeveloped = await Device_developed.update(
      {
        Report: Report,
      },
      {
        where: {
          id_developed: id,
        },
      }
    );

    if (Devicedeveloped) {
      res.send({
        success: true,
        message: 'Report developed added successfully',
      });
    } else {
      res.send({
        success: false,
        message: 'Something went wrong',
      });
    }
  } catch (err) {
    console.log(err.message);
  }
});
/////////// select report developed //////////
router.post('/FetchReportdeveloped', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const Devicedeveloped = await Device_developed.findOne({
      where: {
        id_developed: deviceId,
      },
      attributes: ['Report'],
    });

    if (Devicedeveloped) {
      res.send({
        success: true,
        Device_developed: Devicedeveloped,
      });
    } else {
      res.send({
        success: false,
        message: 'Something went wrong',
      });
    }
  } catch (err) {
    console.log(err.message);
  }
});
//////////// devices_being_dismantled ////////////
router.put('/:id/devicesbeingdismantled', async (req, res) => {
    try {
      await Examination_requests.update({ Status: 'تم النقل للتفكيك' }, { where: { id_Examination: req.params.id } });
      await Devices_being_dismantled.create({ id_Examination: req.params.id, Status: 'تم التفكيك ' });
      res.send('تم الفحص ونقل البيانات إلى جدول الاجهزة جارى تفكيكها ');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Something went wrong');
    }
  });
////////// get all devices_being_dismantled /////////
router.get('/alldevicesbeingdismantled', async (req, res) => {
    try {
      const allCollectedrequests = await Donationrequests.findAll({
        attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
        where: {
          Status: 'تم القبول',
        },
      });
  
      const donationRequests = await Collect_requests.findAll({
        where: {
          id_request: allCollectedrequests.map(request => request.id_request),
        },
      });
  
      const collectedRequests = await Collected_requests.findAll({
        where: {
          id_collect: donationRequests.map(collect => collect.id_collect),
        },
      });
  
      const requestsAreChecked = await Requests_are_checked.findAll({
        where: {
          id_collected: collectedRequests.map(collected => collected.id_collected),
        },
      });
  
      const informationDestruction = await Information_destruction.findAll({
        where: {
          id_checked: requestsAreChecked.map(checked => checked.id_checked),
        },
      });
  
      const examinationRequests = await Examination_requests.findAll({
        where: {
          id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
        },
      });
  
      const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);
  
      const Devicesbeingdismantled = await Devices_being_dismantled.findAll({
        where: {
          id_Examination: examinationRequestIds,
        },
      });

      const responseData = Devicesbeingdismantled.map(device => {
        const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === device.id_Examination);
        const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
        const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
        const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
        const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
        const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);
  
        return {
          device: device.toJSON(),
          examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
          informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
          requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
          collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
          donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
          allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
        };
      });
  
      res.send({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({
        success: false,
        message: 'Something went wrong',
      });
    }
  });
///////////////  search devices being dismantled ///////
router.post('/searchdismantled', async (req, res) => {
  try {
    const classification = req.body.classification;
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
        classification:classification
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
      },
    });

    const examinationRequests = await Examination_requests.findAll({
      where: {
        id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
      },
    });

    const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);

    const Devicesbeingdismantled = await Devices_being_dismantled.findAll({
      where: {
        id_Examination: examinationRequestIds,
      },
    });

    const responseData = Devicesbeingdismantled.map(device => {
      const relatedDeviceBeingDeveloped = Devicesbeingdismantled.find(Devicesbeingdismantled => Devicesbeingdismantled.id_being_developed === device.id_being_developed);
      const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === relatedDeviceBeingDeveloped.id_Examination);
      const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
      const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
      const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
      const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
      const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);

      return {
        device: device.toJSON(),
        deviceBeingDeveloped: relatedDeviceBeingDeveloped && relatedDeviceBeingDeveloped.toJSON(),
        examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
        informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
        requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
        collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
        donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
        allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
/////////// add devices_parts ///////////
router.post('/adddevicesparts', async (req , res) => {
    const {Trade_mark , Name_part , device_classification ,Status,amount} = req.body 
    console.log(req.body)
    try { 
            const addDevicesparts =  Devices_parts.create({
                Trade_mark: Trade_mark,
                Name_part:Name_part,
                device_classification:device_classification,
                Status:Status,
                amount:amount,
            })      
            if(addDevicesparts) {
                res.send(
                    {
                        success: true,
                        message: ' device parts Added Successfully'
                    }
                )
            }else{
                res.send(
                    {
                        success: false,
                         message: 'Something Went Wrong'
                    }
                )
            }
    }catch (err) {console.log(err.message)}       
})
//////  get all devices_parts /////////
router.get('/getalldevicesparts' , async(req , res ) => {
  const alldevicesparts = await Devices_parts.findAll();
  if(alldevicesparts){
      res.send(
          {
              success : true,
              devicesparts : alldevicesparts
          }
      )
  }else{
      res.send(
          {
              success : false,
              masg : 'Something Went Wrong'
              
          }
      )
  }

})
///////////////// Search ////////////////
router.post('/search', async (req, res) => {
  const { device_classification } = req.body;

  try {
    const devicesParts = await Devices_parts.findAll({
      where: {
        device_classification: device_classification
      }
    });

    if (devicesParts.length > 0) {
      res.send({
        success: true,
        devicesParts: devicesParts
      });
    } else {
      res.send({
        success: false,
        msg: 'لم يتم العثور على عناصر مطابقة'
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      msg: 'حدث خطأ أثناء البحث عن العناصر'
    });
  }
});
//////////// delete parts  /////////////
router.post('/deletparts' , async(req , res) => {
  const {id_part} = req.body

  const deletparts = await Devices_parts.destroy(
      {
          where:{
            id_part:id_part
          }
      }
  )
  if(deletparts){
      res.send(
          {
              status: true,
              msg : "part was deleted successfully"
          }
      )
  }else{
      res.send(
          {
              status: false,
              msg : "the part was not deleted"
          }
      )
  }

})
////////////////// updata parts //////////////
router.post('/updateparts' , async(req , res) => {
  try {    
      const {Trade_mark , device_classification , Name_part , Status,amount,id_part} = req.body 
          const updateparts =  Devices_parts.update(
              {          
                  Trade_mark: Trade_mark,
                  device_classification:device_classification,
                  Name_part:Name_part,
                  Status:Status,
                  amount:amount
               }, {
              where: {
                id_part: id_part,
              }
            });
          if(updateparts) {
              res.send(
                  {
                      masg:"update  Successfully",
                      status:true
                  }
              )
          }else{
              res.send(
                  {
                      status: false,
                      msg : "the parts was not update"
                  }
              ) 
          }

  }catch (err) {console.log(err)}       
})
///////// setting update data employess ////////////
router.post('/updatedataemployess' , async(req , res) => {
    try {    
        const { address_employee , phone_employee ,name_employee, department,id_employee} = req.body 
            const updatedataemployess =  Employees.update(
                {          
                    name_employee:name_employee,
                    address_employee: address_employee,
                    phone_employee:phone_employee,
                    department:department
                 }, {
                where: {
                    id_employee:id_employee
                }
              });
            if(updatedataemployess) {
                res.send(
                    {
                        masg:"update  Successfully",
                        status:true
                    }
                )
            }else{
                res.send(
                    {
                        status: false,
                        msg : "the employess was not update"
                    }
                ) 
            }

    }catch (err) {console.log(err)}       
})
//////////////get all employess /////////////////
router.post('/getemployess', async (req, res) => {
  const { id_employee } = req.body;
  const getemployess = await Employees.findOne({
    where: {
      id_employee: id_employee
    }
  });

  if (getemployess) {
    res.send({
      success: true,
      employess: getemployess
    });
  } else {
    res.send({
      success: false,
      masg: 'Something Went Wrong'
    });
  }
});
///////// change pass for employess ///////////// 
router.post('/changepasswordemployee', async (req, res) => {
  try {
    const { id_employee, current_password, new_password } = req.body;

    // Find employee by id_employee
    const employee = await Employees.findOne({
      where: {
        id_employee: id_employee
      }
    });

    if (!employee) {
      return res.status(404).send({
        success: false,
        msg: 'Employee not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        msg: 'Invalid current password'
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(new_password, 8);
    employee.password = hashedPassword;
    await employee.save();

    res.send({
      success: true,
      msg: 'Password updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      success: false,
      msg: 'Failed to update password'
    });
  }
});
/////////// login employess /////////// 
router.post('/login', [
    check('email_employee').trim().isEmail().normalizeEmail(),
    check('password').trim().isLength({ min: 8, max: 20 }).escape()
  ], async (req, res) => {
    
    const { email_employee, password } = req.body;
    console.log(req.body);
  
    try {
      const employee = await Employees.findOne({
        where: {
            email_employee: email_employee,
        }
      });
      if (!employee) {
        res.send({
          success: false,
          msg: 'employee does not exist or credentials are incorrect'
        });
      }
      else {
        const match = await bcrypt.compare(password, employee.password)
        if(!match) {
          console.log()
          res.send({
            success: false,
            msg: 'employee does not exist or credentials are incorrect'
          });
        } else 
         if(!employee.is_verified) {
          res.send({
            success: false,
            msg: 'employee does not exist or credentials are incorrect'
          });
        } if(!employee.activation){
          res.send({
            success: false,
            msg: 'employee does not exist or credentials are incorrect'
          });
        }
        
        else{ 
          res.send({
          success: true,
          msg: 'User exists and verified',
          id_employee: employee.id_employee,
          email_employee: employee.email_employee,
          password: employee.password,
          name_employee: employee.name_employee,
          department: employee.department,
          employeetype:employee.employeetype,
          roles: employee.roles,
          address_employee:employee.address_employee,
          phone_employee: employee.phone_employee
        });}
      }
        // User exists, password is correct, and email is verified
    } catch (error) {
      console.error(error.message);
      res.send({
        success: false,
        msg: 'An error occurred'
      });
    }
  });
///////////////// logout ////////////////
router.post('/logout', (req, res) => {
  req.session = null;
  res.status(200).json({ message: 'تم تسجيل الخروج بنجاح.' });
});
///////// signup employess ///////////
router.post('/signupemployess', [
  check('name_employee').isLength({ max: 90 }).whitelist("[a-zA-Z]+"),
  check('email_employee').trim().isEmail().normalizeEmail(),
  check('password').trim().isLength({ min: 8, max: 20 }).escape(),
  check('address_employee').isLength({ max: 90 }),
  check('department').isLength({ max: 90 }),
  check('phone_employee').isMobilePhone()
], async (req, res) => {
  console.log("Body==>", req.body);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: "Check your fields"
    });
  }

  try {
    const characters = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let token = "";
    for (let i = 0; i < characters.length; i++) {
      token += characters[Math.floor(Math.random() * characters.length)];
    }

    const { name_employee, phone_employee, password, email_employee, department, address_employee } = req.body;
    const hash = hashpassword(password);
    console.log(hash);

    const check = await Employees.findOne({
      where: {
        email_employee: email_employee
      }
    });

    if (check) {
      return res.send({
        success: false,
        msg: 'Employee already exists'
      });
    } else {
      sendConfirmEmail(email_employee, token);

      let roles = 1; // Default value for roles

      if (department === 'تجميع') {
        roles = 1;
      } else if (department === 'الفحص') {
        roles = 2;
      } else if (department === 'التطوير') {
        roles = 3;
      } else if (department === 'التفكيك') {
        roles = 4;
      } else {roles = 0;}

      const createemployee = await Employees.create({
        name_employee: name_employee,
        phone_employee: phone_employee,
        password: hash,
        email_employee: email_employee,
        department: department,
        address_employee: address_employee,
        token: token,
        roles: roles ,// Assigning the roles value based on department
        employeetype:'موظف'
      });

      if (createemployee) {
        const getid = await Employees.findOne({
          where: {
            email_employee: email_employee
          }
        });

        if (getid) {
          res.send({
            success: true,
            id_employee: getid.id_employee,
            name_employee: getid.name_employee,
            phone_employee: getid.phone_employee,
            password: getid.hash,
            email_employee: getid.email_employee,
            department: getid.department,
            address_employee: getid.address_employee,
            token: getid.token
          });
        }
      } else {
        res.send({
          success: false
        });
      }
    }
  } catch (err) {
    console.log(err.message);
  }
});
router.post('/verifyEmployees/:token', async (req, res) => {
    let token = req.params.token;
    const check = await Employees.findOne({
        where : {
            token : token
        }
    })
   if(check){
    check.is_verified=true;
    check.save();
    res.send("Verfied");
   }
   else {
    res.send({
      success: false,
  })
   }
})
///////// reset pass employess //////////
const jwt1 = require('jsonwebtoken');
const secretKey1 = 'your-secret-key';
const nodemailer = require('nodemailer');
// Send password reset email to the user
router.post('/forgot-password-Employees', async (req, res) => {
  const { email_employee } = req.body;
  const employee = await Employees.findOne({ where: { email_employee: email_employee } });
  
  if (!employee) {
    res.status(404).send({
      success: false,
      msg: 'employee not found'
    });
  } else {
    // Create a reset token that expires in 1 hour
    const reset_pass = jwt1.sign({ id_employee: employee.id }, secretKey1, { expiresIn: '1h' });
    await Employees.update({
      reset_pass: reset_pass,
    } , {
      where: {
        email_employee:email_employee
      }
    }
    
    );
    // Send the reset token to the user's email
    const transporter = nodemailer.createTransport({
      service:"Gmail",
      auth:{
          user:'arwaabdo880@gmail.com',
          pass:'ijtgkafvcwphuylz',
      },
    });

    const mailOptions = {
      from: 'arwa@gmail.com', 
      to: email_employee, 
      subject: 'Password Reset', 
      text: 'Please click the following link to reset your password:',
      html: `<a href=http://localhost:3000/Resetpassword/${reset_pass}> click here plz !</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send({
          success: false,
          msg: 'Failed to send password reset email'
        });
      } else {
        console.log('Email sent: ' + info.response);
        res.send({
          success: true,
          msg: 'Password reset link sent successfully'
        });
      }
    });
  }
});

  // Handle password reset request
  router.post('/reset-password/:reset_pass', async (req, res) => {
    const reset_pass = req.params.reset_pass;
    const { new_password } = req.body;
    
    try {
      // Find the employee with the matching reset token
      const employee = await Employees.findOne({ where: { reset_pass: reset_pass } });
      if (!employee) {
        res.status(404).send({
          success: false,
          msg: 'Employee not found'
        });
      } else {
        // Update the password
        const hashedPassword = hashpassword(new_password)
        console.log(hashedPassword)

        await Employees.update({ password: hashedPassword, reset_pass: null },
          { where: { reset_pass: reset_pass } }
          );
        res.send({
          success: true,
          msg: 'Password updated successfully'
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send({
        success: false,
        msg: 'Error resetting password'
      });
    }
  });
///////////////////////all user///////////////////
router.get('/allUser', async(req, res) => {
  try {
  const allUser = await Employees.findAll({
  where: {
  employeetype: {
  [Op.ne]: 'مدير'
  }
  }
  });
  if (allUser) {
  res.send({
  success: true,
  users: allUser
  });
  } else {
  res.send({
  success: false,
  message: 'Something Went Wrong'
  });
  }
  } catch (error) {
  res.send({
  success: false,
  message: error.message
  });
  }
  });
//////////////////// search user //////////////
router.post('/searchuser', async (req, res) => {
  const { name_employee } = req.body;

  try {
    const allUser = await Employees.findAll({
      where: {
        name_employee: name_employee
      }
    });

    if (allUser.length > 0) {
      res.send({
        success: true,
        data: allUser
      });
    } else {
      res.send({
        success: false,
        msg: 'لم يتم العثور على عناصر مطابقة'
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      msg: 'حدث خطأ أثناء البحث عن العناصر'
    });
  }
});
////////////////updatestatueoff////////////
router.put('/:id/updatestatueoff', async (req, res) => {
  try {
    await Employees.update({ activation: false }, { where: { id_employee: req.params.id } });
    res.send('تم الغاء تفعيل حساب بنجاح ');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Something went wrong');
  }
});
///////////////updatestatueon/////////////
router.put('/:id/updatestatueon', async (req, res) => {
  try {
    await Employees.update({ activation: true }, { where: { id_employee: req.params.id } });
    res.send('تم تفعيل حساب بنجاح ');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Something went wrong');
  }
});
//////////////////////////alldoner ////////////// 
router.get('/alldoner', async(req, res) => {
  try {
  const alldoner = await usersmodel.findAll();
  if (alldoner) {
  res.send({
  success: true,
  doner: alldoner
  });
  } else {
  res.send({
  success: false,
  message: 'Something Went Wrong'
  });
  }
  } catch (error) {
  res.send({
  success: false,
  message: error.message
  });
  }
  });
///////////////////// search doner ////////
router.post('/searchdoner', async (req, res) => {
  const { donor_name } = req.body;

  try {
    const alldoner = await usersmodel.findAll({
      where: {
        donor_name: donor_name
      }
    });

    if (alldoner.length > 0) {
      res.send({
        success: true,
        data: alldoner
      });
    } else {
      res.send({
        success: false,
        msg: 'لم يتم العثور على عناصر مطابقة'
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      msg: 'حدث خطأ أثناء البحث عن العناصر'
    });
  }
});
////////////// donation-requests/total-devices //////////////
router.get('/totaldevices', (req, res) => {
  Donationrequests.count()
    .then(count => {
      res.send({
        success: true,
        count: count
        });
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('حدث خطأ ما');
    });
});
/////////////////////   totaldevices Collectrequests ////////
router.get('/totalCollectrequests', (req, res) => {
  Collected_requests.count()
  .then(count => {
    res.json({
      success: true,
      count: count
      });
  })
    .catch(error => {
      console.log(error);
      res.status(500).send('حدث خطأ ما');
    });
});
//////////////  totaldevices Devices_parts ////////////
router.get('/totalDevicesparts', (req, res) => {
  Devices_parts.count()
  .then(count => {
    res.json({
      success: true,
      count: count
      });
  })
    .catch(error => {
      console.log(error);
      res.status(500).send('حدث خطأ ما');
    });
});
////////////// totaldevices Device_developed ////////// 

router.get('/totalDevicedeveloped', (req, res) => {
  Device_developed.count()
  .then(count => {
    res.json({
      success: true,
      count: count
      });
  })
    .catch(error => {
      console.log(error);
      res.status(500).send('حدث خطأ ما');
    });
});
///////////////// totaldevices Devices_being_dismantled //////////////
router.get('/totalDevicesbeingdismantled', (req, res) => {
  Devices_being_dismantled.count()
  .then(count => {
    res.json({
      success: true,
      count: count
      });
  })
    .catch(error => {
      console.log(error);
      res.status(500).send('حدث خطأ ما');
    });
});
////////////////// report request //////////////////
router.get('/allreportrequests' , async(req , res ) => {
  const allrequests = await Donationrequests.findAll();
  if(allrequests){
      res.send(
          {
              success : true,
              requests : allrequests
          }
      )
  }else{
      res.send(
          {
              success : false,
              masg : 'Something Went Wrong'
              
          }
      )
  }

})
///////////////////// ALL Employees /////////
router.get('/allreportEmployees' , async(req , res ) => {
  const allEmployees = await Employees.findAll();
  if(allEmployees){
      res.send(
          {
              success : true,
              Employees : allEmployees
          }
      )
  }else{
      res.send(
          {
              success : false,
              masg : 'Something Went Wrong'
              
          }
      )
  }

})
//////////////////// ALL PARTS  ///////////////
router.get('/allreportDevicesparts' , async(req , res ) => {
  const allreportDevicesparts = await Devices_parts.findAll();
  if(allreportDevicesparts){
      res.send(
          {
              success : true,
              parts : allreportDevicesparts
          }
      )
  }else{
      res.send(
          {
              success : false,
              masg : 'Something Went Wrong'
              
          }
      )
  }

})
////////////////// allreportDevicesdeveloped ///////////
router.get('/allreportDevicesdeveloped', async (req, res) => {
  try {
    const allCollectedrequests = await Donationrequests.findAll({
      attributes: ['id_request', 'Trade_mark', 'number', 'Item_name', 'classification', 'Status_devices'],
      where: {
        Status: 'تم القبول',
      },
    });

    const donationRequests = await Collect_requests.findAll({
      where: {
        id_request: allCollectedrequests.map(request => request.id_request),
      },
    });

    const collectedRequests = await Collected_requests.findAll({
      where: {
        id_collect: donationRequests.map(collect => collect.id_collect),
      },
    });

    const requestsAreChecked = await Requests_are_checked.findAll({
      where: {
        id_collected: collectedRequests.map(collected => collected.id_collected),
      },
    });

    const informationDestruction = await Information_destruction.findAll({
      where: {
        id_checked: requestsAreChecked.map(checked => checked.id_checked),
      },
    });

    const examinationRequests = await Examination_requests.findAll({
      where: {
        id_destruction: informationDestruction.map(destruction => destruction.id_destruction),
      },
    });

    const examinationRequestIds = examinationRequests.map(examinationRequest => examinationRequest.id_Examination);

    const devicesBeingDeveloped = await Devices_being_develope.findAll({
      where: {
        id_Examination: examinationRequestIds,
      },
    });

    const Devicedeveloped = await Device_developed.findAll({
      where: {
        id_being_developed: devicesBeingDeveloped.map(deviceBeingDeveloped => deviceBeingDeveloped.id_being_developed),
      },
    });

    const responseData = Devicedeveloped.map(device => {
      const relatedDeviceBeingDeveloped = devicesBeingDeveloped.find(deviceBeingDeveloped => deviceBeingDeveloped.id_being_developed === device.id_being_developed);
      const relatedExaminationRequest = examinationRequests.find(examinationRequest => examinationRequest.id_Examination === relatedDeviceBeingDeveloped.id_Examination);
      const relatedInformationDestruction = informationDestruction.find(information => information.id_destruction === relatedExaminationRequest.id_destruction);
      const relatedRequestsAreChecked = requestsAreChecked.find(request => request.id_checked === relatedInformationDestruction.id_checked);
      const relatedCollectedRequest = collectedRequests.find(collect => collect.id_collected === relatedRequestsAreChecked.id_collected);
      const relatedDonationRequest = donationRequests.find(request => request.id_collect === relatedCollectedRequest.id_collect);
      const relatedAllCollectedRequest = allCollectedrequests.find(collectRequest => collectRequest.id_request === relatedDonationRequest.id_request);

      return {
        device: device.toJSON(),
        deviceBeingDeveloped: relatedDeviceBeingDeveloped && relatedDeviceBeingDeveloped.toJSON(),
        examinationRequest: relatedExaminationRequest && relatedExaminationRequest.toJSON(),
        informationDestruction: relatedInformationDestruction && relatedInformationDestruction.toJSON(),
        requestsAreChecked: relatedRequestsAreChecked && relatedRequestsAreChecked.toJSON(),
        collectedRequest: relatedCollectedRequest && relatedCollectedRequest.toJSON(),
        donationRequest: relatedDonationRequest && relatedDonationRequest.toJSON(),
        allCollectedRequest: relatedAllCollectedRequest && relatedAllCollectedRequest.toJSON(),
      };
    });

    res.send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({
      success: false,
      message: 'Something went wrong',
    });
  }
});
////////////// SHOW Notificationsemployees //////////////
router.post('/changestatuenotify' , async(req , res ) => {
  const {id}=req.body
  try {
    await Notificationsemployees.update({ Status: true }, { where: { id_notify: id} });
    res.send('تم تغيير حالة بنجاح ');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Something went wrong');
  }
});

////////////////////////////////////////////////////////////// 
router.get('/showNotificationsemployees', async (req, res) => {
  const showNotificationsemployees = await Notificationsemployees.findAll({
    where: {
      Status:false
    }
  });
  if(showNotificationsemployees) {
    res.send({
      success: true,
      Notification: showNotificationsemployees
    });
  } else {
    res.send({
      success: false,
      masg: 'Something Went Wrong'
    });
  }
});
module.exports = router