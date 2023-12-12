const User = require("../models").users;
const Subscription = require("../models").subscriptions;
const Subscriptiondata = require("../models").subscriptiondata;
const Automation = require("../models").automations;
const Endpoint = require("../models").endpoints;
const Withdraw = require("../models").withdraws;
const Transaction = require("../models").transactions;
const Admintransaction = require("../models").admintransactions;
const Airtime = require("../models").airtimes;
const Cable = require("../models").cables;
const Elec = require("../models").electricities;
const Exam = require("../models").exams;
const Apiplan = require("../models").apiplans;
const slug = require("slug");
const otpGenerator = require("otp-generator");
const axios = require("axios");
const { ServerError, ServerCurrency } = require("../config/utils");
const Level = require('../models').levels
const Levelpack = require('../models').levelpackages
const LevelSub = require('../models').levelsubs
const Kyclimit = require('../models').kyclimits
const Kyctrack = require('../models').kyctracks
const Reftrack = require('../models').reftracks
const moment = require('moment')



// purchasing data
exports.DataBills = async (req, res) => {
  try {
    const { network, package, mobile, pin } = req.body;
    if (!network || !package || !mobile || !pin)
      return res.json({
        status: 400,
        msg: `Request Failed, incomplete request found`,
      });
    // check if user exists
    const user = await User.findByPk(req.user);
    if (!user) return res.json({ status: 400, msg: `User Not Found` });

    // check if subscription exists
    // const sub = await Subscription.findOne({ where: { id: network } });
    const getLevelSub = await LevelSub.findOne({
      where: {sub: network},
      include: [{model: Subscription, as: 'subs'}]
    })
    if (!getLevelSub) return res.json({ status: 400, msg: `Subscription not found` });
    const sub = getLevelSub.subs

    // check is package exists
    // const pack = await Subscriptiondata.findOne({ where: { id: package } });
    const getLevelPackage = await Levelpack.findOne({
      where: {id: package},
      include: [{model: Subscriptiondata, as: 'packs'}]
    })
    if (!getLevelPackage) return res.json({ status: 400, msg: `Package Not Found` });
    const pack = getLevelPackage


    // check if there is an automation service connected to the package
    const autos = await Automation.findOne({
      where: { id: pack.packs?.automation },
      include: [{ model: Endpoint, as: "autos" }],
    });
    if (!autos)
      return res.json({
        status: 400,
        msg: "No service connected to this package yet",
      });

    // check if there is an alternate automation service standby
    const altAutos = await Automation.findOne({
      where: { id: pack.packs?.altAutomation },
      include: [{ model: Endpoint, as: "autos" }],
    });

    // check if transaction pin matches
    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Invalid Transaction Pin detected` });

    // check if user has enough balance
    if (user.balance < parseFloat(pack.pricing))
      return res.json({ status: 400, msg: `Insufficient Balance` });

    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "data", automation: autos.id },
      });

      const url = `${autos.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autos.tokenName]: autos.token,
        [autos.mobileName]: mobile,
        [autos.planName]: pack.packs?.deal,
        [autos.networkName]: pack.packs?.autoNetwork,
        [autos.refName]: autos.refid,
        [autos.callbackName]: autos.callback,
        [autos.portedName]: autos.portedNumber === "true" ? true : false,
      };
      let options;
      if (autos.auths === "yes") {
        options = {
          headers: {
            Authorization: `Token ${autos.token}`,
          },
        };
      } else {
        options = {};
      }

      const getFormdata = `${url}?${autos?.tokenName}=${autos.token}${autos.refName ? `&${autos.refName}=${autos.refid}` : ""
        }${autos.planName ? `&${autos.planName}=${pack.packs?.deal}` : ""}${autos.networkName ? `&${autos.networkName}=${pack.packs?.autoNetwork}` : ""
        }${autos.mobileName ? `&${autos.mobileName}=${mobile}` : ""}${autos.callbackName ? `&${autos.callbackName}=${autos.callback}` : ""
        }${autos.portedNumber ? `&${autos.portedName}=${autos.portedNumber === "true" ? true : false}` : ""
        }`;

      console.log(
        options,
        "options",
        getFormdata,
        postFormdata,
        autos.method,
        autos.format
      );
      let result;
      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata, options);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata, options);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata, options);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata, options);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }
      const date = new Date();
      // const note = `${sub.network} ${pack.title} Purchase Successful to ${mobile},  [You have successfull shared ${pack.title} Data to ${mobile}.]`;
      const note = `${sub.network} ${pack.packs?.title} Purchase Successful to ${mobile} - [${result.data.message ||
        result.data.msg ||
        result.data.api_response ||
        result.data.data.server_message ||
        result.data.data.true_response
        }]`;

      const failnote = `Unable to purchase ${sub.network} ${pack.packs?.title} data plan to ${mobile}`;
      const txid = `TXID_${otpGenerator.generate(5, {
        digits: true,
        specialChars: false,
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
      })}${date.getTime()}`;
      const errmsg = `Transaction Not Successful`;
      const title = "data purchase";
      const adminnote = `${sub.network} ${pack.packs?.title} Purchase Successful to ${mobile} - [${result.data.message ||
        result.data.msg ||
        result.data.api_response ||
        result.data.data.server_message ||
        result.data.data.true_response
        }]`;

      console.log(
        "zoned",
        result,
        "data coming from zoner",
        getFormdata,
        postFormdata,
        "first plight"
      );

      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {
        //deduct from user balance
        user.prevbalance = user.balance;
        user.balance = eval(`${user.balance} - ${pack.pricing}`);

        await user.save();
        const newWithData = {
          user: user.id,
          autos: autos.title,
          note,
          amount: pack.pricing,
          txid,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: sub.id,
          title,
        };
        const withd = await Withdraw.create(newWithData);

        const newtrans = {
          user: user.id,
          autos: autos.title,
          note,
          amount: pack.pricing,
          txid,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: sub.id,
          title,
        };
        await Transaction.create(newtrans);

        const adminnewtrans = {
          user: user.id,
          autos: autos.title,
          note: adminnote,
          txid,
          amount: pack.pricing,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: sub.id,
          title,
        };
        await Admintransaction.create(adminnewtrans);
        return res.json({
          status: 200,
          msg: `Data Purchased Successfully!.`,
          user,
        });
      } else {
        // this is where the alternate api service goes to only if there is specified service api
        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "data", automation: altAutos.id },
          });

          const altUrl = `${altAutos.apiurl}${altEndpoint.title}`;
          const altPostFormdata = {
            [altAutos.tokenName]: altAutos.token,
            [altAutos.mobileName]: mobile,
            [altAutos.planName]: pack.packs?.altDeal,
            [altAutos.networkName]: pack.packs?.altAutoNetwork,
            [altAutos.refName]: altAutos.refid,
            [altAutos.callbackName]: altAutos.callback,
            [altAutos.portedName]: altAutos.portedNumber,
          };
          let altoptions;
          if (altAutos.auths === "yes") {
            altoptions = {
              headers: {
                Authorization: `Token ${altAutos.token}`,
              },
            };
          } else {
            altoptions;
          }

          const altGetFormdata = `${altUrl}?${altAutos?.tokenName}=${altAutos.token
            }${altAutos.refName ? `&${altAutos.refName}=${altAutos.refid}` : ""}${altAutos.planName ? `&${altAutos.planName}=${pack.packs?.altDeal}` : ""
            }${altAutos.networkName
              ? `&${altAutos.networkName}=${pack.packs?.altAutoNetwork}`
              : ""
            }${altAutos.mobileName ? `&${altAutos.mobileName}=${mobile}` : ""}${altAutos.callbackName
              ? `&${altAutos.callbackName}=${altAutos.callback}`
              : ""
            }${altAutos.portedNumber
              ? `&${altAutos.portedName}=${altAutos.portedNumber === "true" ? true : false
              }`
              : ""
            }`;
          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(altGetFormdata, altoptions);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(altUrl, altPostFormdata, altoptions);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(altGetFormdata, altoptions);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(altUrl, altPostFormdata, altoptions);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }

          // result = await axios.post(`https://zoedata.ng/api/v2/datashare/?api_key=6tg7x6CJ1LGKQuuRMTaIGy2MxFKX1oahJNqKZHYyMb8GjkAwGRxUPdPhGTkwV5gtdcwbeWhiKoB5TnqztNV2MbdXXrk3zeWnYEWHQFq2o2GKQdaAwT8moNHfmgEzK7aU&product_code=data_share_1gb&phone=08029706970&callback=https://zoedata.ng/webhook.php`)
          const date = new Date();
          // const note = `${sub.network} ${pack.title} Purchase Successful to ${mobile},  [You have successfull shared ${pack.title} Data to ${mobile}.]`;
          const note = `${sub.network} ${pack.packs?.title} Purchase Successful to ${mobile} - [${result.data.message ||
            result.data.msg ||
            result.data.api_response ||
            result.data.data.server_message ||
            result.data.data.true_response
            }]`;
          const failnote = `Unable to purchase ${sub.network} ${pack.packs?.title} data plan to ${mobile}`;
          const txid = `TXID_${otpGenerator.generate(5, {
            digits: true,
            specialChars: false,
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
          })}${date.getTime()}`;
          const errmsg = `Transaction Not Successful`;
          const title = "data purchase";
          const adminnote = `${sub.network} ${pack.packs?.title} Purchase Successful to ${mobile} - [${result.data.message ||
            result.data.msg ||
            result.data.api_response ||
            result.data.data.server_message ||
            result.data.data.true_response
            }]`;

          console.log(
            "zoned",
            result,
            "data coming from zoner",
            getFormdata,
            postFormdata,
            "second plight"
          );

          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            //deduct from user balance
            user.prevbalance = user.balance;
            user.balance = eval(`${user.balance} - ${pack.pricing}`);

            await user.save();
            const newWithData = {
              user: user.id,
              autos: altAutos.title,
              note,
              amount: pack.pricing,
              txid,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: sub.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              note,
              autos: altAutos.title,
              amount: pack.pricing,
              txid,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: sub.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutos.title,
              note: adminnote,
              txid,
              amount: pack.pricing,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: sub.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({
              status: 200,
              msg: `Data Purchased Successfully!.`,
              user,
            });
          } else {
            //open up to email addressing, but fail onthe user's end
            const newWithData = {
              user: user.id,
              autos: altAutos.title,
              note: failnote,
              amount: pack.pricing,
              txid,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: sub.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              autos: altAutos.title,
              note: failnote,
              amount: pack.pricing,
              txid,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: sub.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutos.title,
              note: `${failnote} - ${adminnote}`,
              txid,
              amount: pack.pricing,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: sub.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({ status: 400, msg: errmsg });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          const newWithData = {
            user: user.id,
            autos: autos.title,
            note: failnote,
            amount: pack.pricing,
            txid,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: sub.id,
            title,
          };
          const withd = await Withdraw.create(newWithData);

          const newtrans = {
            user: user.id,
            autos: autos.title,
            note: failnote,
            amount: pack.pricing,
            txid,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: sub.id,
            title,
          };
          await Transaction.create(newtrans);

          const adminnewtrans = {
            user: user.id,
            autos: autos.title,
            note: `${failnote} - ${adminnote}`,
            txid,
            amount: pack.pricing,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: sub.id,
            title,
          };
          await Admintransaction.create(adminnewtrans);
          return res.json({ status: 400, msg: errmsg });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};

// purchasing airtime
exports.AirtimeBill = async (req, res) => {
  try {
    //         amount// : // "55000"// mobile// : // "07015582135"// network// : // "200"// pin// : // "1111"// sub// : // 20
    const { amount, mobile, network, pin, sub, dataAmount } = req.body;
    if (!amount || !mobile || !network || !pin || !sub || !dataAmount)
      return res.json({ status: 400, msg: `Incomplete Parameters` });
    const user = await User.findByPk(req.user);
    if (!user) return res.json({ status: 400, msg: `User Not Found` });

    // check if subscription exists
    const service = await Subscription.findOne({ where: { id: sub } });
    if (!service)
      return res.json({ status: 400, msg: `Subscription not found` });

    // check is package exists

    const pack = await Subscriptiondata.findOne({ where: { id: network } });
    if (!pack) return res.json({ status: 400, msg: `Package Not Found` });

    const level = await Level.findOne({ where: { id: user.level } })

    const levelPack = await Levelpack.findOne({ where: { level: level.id, pack: pack.id } })

    // check if transaction pin matches
    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Invalid Transaction Pin detected` });

    // check if user has enough balance
    if (user.balance < dataAmount)
      return res.json({ status: 400, msg: `Insufficient Balance` });

    // check if there is an automation service connected to the package
    const autos = await Airtime.findOne({
      where: { id: pack.automation },
    });


    if (!autos)
      return res.json({
        status: 400,
        msg: "No automation service connected to this package yet",
      });


    let autosParent, altAutosParent;
    if (autos) {
      autosParent = await Automation.findOne({
        where: { id: autos.automation },
        include: [{ model: Endpoint, as: "autos" }],
      });
    }

    // check if there is an alternate automation service standby
    const altAutos = await Automation.findOne({
      where: { id: pack.altAutomation },
    });
    // return res.json({ status: 400, msg: pack, news: 'good' })


    if (altAutos) {
      altAutosParent = await Automation.findOne({
        where: { id: altAutos.automation },
        include: [{ model: Endpoint, as: "autos" }],
      });
    }

    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "airtime", automation: autosParent.id },
      });
      const url = `${autosParent.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autosParent.tokenName]: autosParent.token,
        [autos.mobileName]: mobile,
        [autos.amountName]: amount,
        [autos.refName]: autosParent.refid,
        [autos.networkName]: pack.autoNetwork,
      };

      const getFormdata = `${url}?${autosParent?.tokenName}=${autosParent.token
        }${autos.refName ? `&${autos.refName}=${autosParent.refid}` : ""}${autos.amountName ? `&${autos.amountName}=${amount}` : ""
        }${autos.networkName ? `&${autos.networkName}=${pack.autoNetwork}` : ""}${autos.mobileName ? `&${autos.mobileName}=${mobile}` : ""
        }`;

      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }
      const date = new Date();
      // const note = `${pack.title} Purchase Successful to ${mobile},  [You have successfull shared ${pack.title} Airtime to ${mobile}.]`;
      const note = `${pack.title} Purchase Successful to ${mobile} - [${result.data.message ||
        result.data.msg ||
        result.data.api_response ||
        result.data.data.server_message ||
        result.data.data.true_response
        }]`;
      const failnote = `Unable to purchase ${service.network} ${pack.title} airtime plan to ${mobile}`;
      const txid = `TXID_${otpGenerator.generate(5, {
        digits: true,
        specialChars: false,
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
      })}${date.getTime()}`;
      const errmsg = `Transaction Not Successful`;
      const title = "airtime purchase";
      const adminnote = `${pack.title} Purchase Successful to ${mobile} - [${result.data.message ||
        result.data.msg ||
        result.data.api_response ||
        result.data.data.server_message ||
        result.data.data.true_response
        }]`;

      console.log(
        "zoned",
        result,
        "airtime coming from zoner",
        getFormdata,
        postFormdata,
        "first plight"
      );
      // =================
      if (user.verified !== "verified") {
        const kyctrack = await Kyctrack.findAll({ where: { user: user.id } })

        let kycamount = 0
        kyctrack.map(ele => {
          if (date === moment().format('DD-MM-YYYY')) {
            kycamount += parseInt(ele.amount)
          }
        })
        if (kycamount > 1000) return res.json({ status: 400, msg: `you cannot spend more than per ${ServerCurrency}30 day. Please verify your account to spend more` })

      }
      //upline recieves the bonus
      //downline gives out the bonus

      const userupline = await User.findOne({ where: { refid: user.upline } })
      if (userupline) {
        const findreftrack = await Reftrack.findOne({ where: { downline: user.id, upline: userupline.id } })

        if (findreftrack) {
          findreftrack.amount += parseInt(dataAmount)
          await findreftrack.save()
        }
        if (findreftrack) {
          if (findreftrack.amount >= 10) {
            userupline.bonus += parseInt(10)
          }
        }
      }


      // }
      // if (userupline) {
      //   if (findreftrack) {
      //     if (findreftrack.amount >= 100) {
      //       userupline.bonus += parseInt(10)
      //     }
      //   }
      // }


      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {

        //write code to track kyc limit
        await Kyctrack.create({ user: user.id, amount: dataAmount, date: moment().format('DD-MM-YYYY') })

        //deduct from user balance
        user.prevbalance = user.balance;
        user.balance = eval(`${user.balance} - ${dataAmount}`);

        await user.save();
        const newWithData = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: dataAmount,
          txid,
          status: "success",
          prevbal: user.prevbalance,
          service: service.id,
          currbal: user.balance,
          title,
        };
        const withd = await Withdraw.create(newWithData);

        const newtrans = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: dataAmount,
          txid,
          tag: withd.id,
          status: "success",
          service: service.id,
          prevbal: user.prevbalance,
          currbal: user.balance,
          title,
        };
        await Transaction.create(newtrans);

        const adminnewtrans = {
          user: user.id,
          autos: autosParent.title,
          note: adminnote,
          txid,
          amount: dataAmount,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          service: service.id,
          currbal: user.balance,
          title,
        };
        await Admintransaction.create(adminnewtrans);
        return res.json({
          status: 200,
          msg: `Data Purchased Successfully!.`,
          user,
        });
      } else {
        // this is where the alternate api service goes to only if there is specified service api
        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "airtime", automation: altAutosParent.id },
          });

          const url = `${altAutosParent.apiurl}${altEndpoint.title}`;
          const postFormdata = {
            [altAutosParent.tokenName]: altAutosParent.token,
            [altAutos.mobileName]: mobile,
            [altAutos.amountName]: amount,
            [altAutos.refName]: altAutosParent.refid,
            [altAutos.networkName]: pack.altAutoNetwork,
          };

          const getFormdata = `${url}?${altAutosParent?.tokenName}=${altAutosParent.token
            }${altAutos.refName
              ? `&${altAutos.refName}=${altAutosParent.refid}`
              : ""
            }${altAutos.amountName ? `&${altAutos.amountName}=${amount}` : ""}${altAutos.networkName
              ? `&${altAutos.networkName}=${pack.autoNetwork}`
              : ""
            }${altAutos.mobileName ? `&${altAutos.mobileName}=${mobile}` : ""}`;

          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(getFormdata);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(url, postFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(getFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(url, postFormdata);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }
          const date = new Date();
          // const note = `${pack.title} Purchase Successful to ${mobile},  [You have successfull shared ${pack.title} Airtime to ${mobile}.]`;
          const note = `${pack.title} Purchase Successful to ${mobile} - [${result.data.message || result.data.msg || result.data.api_response || result.data.data.server_message
            }]`;
          const failnote = `Unable to purchase ${service.network} ${pack.title} airtime plan to ${mobile}`;
          const txid = `TXID_${otpGenerator.generate(5, {
            digits: true,
            specialChars: false,
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
          })}${date.getTime()}`;
          const errmsg = `Transaction Not Successful`;
          const title = "airtime purchase";
          const adminnote = `${pack.title} Purchase Successful to ${mobile} - [${result.data.message || result.data.msg || result.data.api_response ||
            result.data.data.server_message
            }]`;

          console.log(
            "zoned",
            result,
            "airtime coming from zoner",
            getFormdata,
            postFormdata,
            "second plight"
          );
          if (user.verified !== "verified") {
            const kyctrack = await Kyctrack.findAll({ where: { user: user.id } })
            let kycamount = 0
            kyctrack.map(ele => {
              if (date === moment().format('DD-MM-YYYY')) {
                kycamount += parseInt(ele.amount)
              }
            })
            if (kycamount > 1000) return res.json({ status: 400, msg: `you cannot spend more than per ${ServerCurrency}30 day. Please verify your account to spend more` })

          }
          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            await Kyctrack.create({ user: user.id, amount: dataAmount, date: moment().format('DD-MM-YYYY') })
            //deduct from user balance
            user.prevbalance = user.balance;
            user.balance = eval(`${user.balance} - ${dataAmount}`);

            await user.save();
            const newWithData = {
              user: user.id,
              autos: altAutos.title,
              note,
              amount: dataAmount,
              txid,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              note,
              autos: altAutos.title,
              amount: dataAmount,
              txid,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutos.title,
              note: adminnote,
              txid,
              amount: dataAmount,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({
              status: 200,
              msg: `Data Purchased Successfully!.`,
              user,
            });
          } else {
            //open up to email addressing, but fail onthe user's end
            const newWithData = {
              user: user.id,
              autos: altAutos.title,
              note: failnote,
              amount: dataAmount,
              txid,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              autos: altAutos.title,
              note: failnote,
              amount: dataAmount,
              txid,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutos.title,
              note: `${failnote} - ${adminnote}`,
              txid,
              amount: dataAmount,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({ status: 400, msg: errmsg });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          const newWithData = {
            user: user.id,
            autos: autos.title,
            note: failnote,
            amount: dataAmount,
            txid,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          const withd = await Withdraw.create(newWithData);

          const newtrans = {
            user: user.id,
            autos: autos.title,
            note: failnote,
            amount: dataAmount,
            txid,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          await Transaction.create(newtrans);

          const adminnewtrans = {
            user: user.id,
            autos: autos.title,
            note: `${failnote} - ${adminnote}`,
            txid,
            amount: dataAmount,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          await Admintransaction.create(adminnewtrans);
          return res.json({ status: 400, msg: errmsg });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};


// cable data setting
exports.CableBill = async (req, res) => {
  try {
    const { iuc, plan, pin, sub } = req.body;
    if (!iuc || !plan || !pin || !sub)
      return res.json({ status: 400, msg: `Incomplete Parameters` });
    const user = await User.findByPk(req.user);
    if (!user) return res.json({ status: 400, msg: `User Not Found` });

    // check if subscription exists
    const service = await Subscription.findOne({ where: { id: sub } });
    if (!service)
      return res.json({ status: 400, msg: `Subscription not found` });

    // check is package exists
    const pack = await Subscriptiondata.findOne({ where: { id: plan } });
    if (!pack) return res.json({ status: 400, msg: `Package Not Found` });

    const level = await Level.findOne({ where: { id: user.level } })
    const levelPack = await Levelpack.findOne({ where: { level: level.id, pack: plan } })

    // check if transaction pin matches
    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Invalid Transaction Pin detected` });

    // check if user has enough balance
    if (user.balance < pack.price)
      return res.json({ status: 400, msg: `Insufficient Balance` });

    // fetch APiPlan
    const Apis = await Apiplan.findOne({ where: { pack: pack.id } })
    if (!Apis) return res.json({ status: 400, msg: `Something went wrong` })
    // check if there is an automation service connected to the package
    const autos = await Cable.findOne({
      where: { id: pack.automation },
    });

    if (!autos)
      return res.json({
        status: 400,
        msg: "No automation service connected to this package yet",
      });

    let autosParent, altAutosParent;
    if (autos) {
      autosParent = await Automation.findOne({
        where: { id: autos.automation },
        include: [{ model: Endpoint, as: "autos" }],
      });
    }

    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "cable", automation: autosParent.id },
      });

      const url = `${autosParent.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autosParent.tokenName]: autosParent.token,
        [autos.serviceName]: service.network,
        [autos.decoderName]: iuc,
        [autos.planName]: Apis.plan,
      };

      const getFormdata = `${url}?${autosParent?.tokenName}=${autosParent.token
        }${autos.serviceName ? `&${autos.serviceName}=${service.network}` : ""}${autos.planName ? `&${autos.planName}=${Apis.plan}` : ""
        }${autos.decoderName ? `&${autos.decoderName}=${iuc}` : ""}`;

      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }
      const date = new Date();
      // const note = `${pack.title} Purchase Successful to ${iuc}.`;
      const note = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response || result.data.data.server_message
        }]`;
      const failnote = `Unable to purchase ${service.network} ${pack.title} cable plan to ${iuc}`;
      const txid = `TXID_${otpGenerator.generate(5, {
        digits: true,
        specialChars: false,
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
      })}${date.getTime()}`;
      const errmsg = `Transaction Not Successful`;
      const title = "cable purchase";
      const adminnote = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response || result.data.data.server_message
        }]`;

      console.log(
        "zoned",
        result,
        "cable coming from zoner",
        getFormdata,
        postFormdata,
        "first plight"
      );
      // =================

      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {
        //deduct from user balance
        user.prevbalance = user.balance;
        user.balance = eval(`${user.balance} - ${levelPack?.pricing ? levelPack.pricing : pack.price}`);


        await user.save();
        const newWithData = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: levelPack?.pricing ? levelPack.pricing : pack.price,
          txid,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: service.id,
          title,
        };
        const withd = await Withdraw.create(newWithData);

        const newtrans = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: levelPack?.pricing ? levelPack.pricing : pack.price,
          txid,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: service.id,
          title,
        };
        await Transaction.create(newtrans);

        const adminnewtrans = {
          user: user.id,
          autos: autosParent.title,
          note: adminnote,
          txid,
          amount: levelPack?.pricing ? levelPack.pricing : pack.price,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: service.id,
          title,
        };
        await Admintransaction.create(adminnewtrans);
        return res.json({
          status: 200,
          msg: `${service.network} Cable Purchased Successfully!.`,
          user,
        });
      } else {
        // this is where the alternate api service goes to only if there is specified service api
        // check if there is an alternate automation service standby
        const altAutos = await Cable.findOne({
          where: { id: pack.altAutomation },
        });
        if (altAutos) {
          altAutosParent = await Automation.findOne({
            where: { id: altAutos.automation },
            include: [{ model: Endpoint, as: "autos" }],
          });
        }

        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "cable", automation: altAutosParent.id },
          });

          const url = `${altAutosParent.apiurl}${altEndpoint.title}`;
          const postFormdata = {
            [altAutosParent.tokenName]: altAutosParent.token,
            [altAutos.serviceName]: service.network,
            [altAutos.decoderName]: iuc,
            [altAutos.planName]: Apis.plan,
          };

          const getFormdata = `${url}?${altAutosParent?.tokenName}=${altAutosParent.token
            }${altAutos.serviceName
              ? `&${altAutos.serviceName}=${service.network}`
              : ""
            }${altAutos.planName ? `&${altAutos.planName}=${Apis.plan}` : ""
            }${altAutos.decoderName ? `&${altAutos.decoderName}=${iuc}` : ""}`;

          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(getFormdata);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(url, postFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(getFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(url, postFormdata);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }
          const date = new Date();
          // const note = `${pack.title} Purchase Successful to ${iuc}.`;
          const note = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response || result.data.data.server_message
            }]`;
          const failnote = `Unable to purchase ${service.network} ${pack.title} cable plan to ${iuc}`;
          const txid = `TXID_${otpGenerator.generate(5, {
            digits: true,
            specialChars: false,
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
          })}${date.getTime()}`;
          const errmsg = `Transaction Not Successful`;
          const title = "cable purchase";
          const adminnote = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response || result.data.data.server_message
            }]`;

          console.log(
            "zoned",
            result,
            "cable coming from zoner",
            getFormdata,
            postFormdata,
            "second plight"
          );

          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            //deduct from user balance
            user.prevbalance = user.balance;
            user.balance = eval(`${user.balance} - ${levelPack?.pricing ? levelPack.pricing : pack.price}`);

            await user.save();
            const newWithData = {
              user: user.id,
              autos: altAutosParent.title,
              note,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              note,
              autos: altAutosParent.title,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: adminnote,
              txid,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({
              status: 200,
              msg: `Cable Purchased Successfully!.`,
              user,
            });
          } else {
            //open up to email addressing, but fail onthe user's end
            const newWithData = {
              user: user.id,
              autos: altAutosParent.title,
              note: failnote,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: failnote,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: `${failnote} - [${result?.data?.desc}]`,
              txid,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({ status: 400, msg: errmsg });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          const newWithData = {
            user: user.id,
            autos: autosParent.title,
            note: failnote,
            amount: levelPack?.pricing ? levelPack.pricing : pack.price,
            txid,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          const withd = await Withdraw.create(newWithData);

          const newtrans = {
            user: user.id,
            autos: autosParent.title,
            note: failnote,
            amount: levelPack?.pricing ? levelPack.pricing : pack.price,
            txid,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          await Transaction.create(newtrans);

          const adminnewtrans = {
            user: user.id,
            autos: autosParent.title,
            note: `${failnote} - [${result?.data?.desc}]`,
            txid,
            amount: levelPack?.pricing ? levelPack.pricing : pack.price,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          await Admintransaction.create(adminnewtrans);
          return res.json({ status: 400, msg: errmsg });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};


// verifying cable number
exports.VerifyIUCNumber = async (req, res) => {
  try {
    const { pack, pin, service, iuc } = req.body;
    if (!pack || !pin || !service || !iuc)
      return res.json({ status: 400, msg: `Incomplete Parameters` });

    const user = await User.findOne({ where: { id: req.user } });
    if (!user) return res.json({ status: 404, msg: `User Not found` });

    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Wrong Transaction Pin Detected` });

    const sub = await Subscription.findOne({ where: { id: service } });
    if (!sub) return res.json({ status: 404, msg: `Subscription Not found` });

    const subdata = await Subscriptiondata.findOne({ where: { id: pack } });
    if (!subdata) return res.json({ status: 404, msg: `Package not found` });

    const autos = await Cable.findOne({ where: { id: subdata.automation } });
    if (!autos)
      return res.json({
        status: 400,
        msg: `No Service Connected to this package yet!..`,
      });

    const autosParent = await Automation.findOne({
      where: { id: autos.automation },
    });
    if (!autosParent) return res.json({ status: 404, msg: `No Service found` });

    // check if user has enough balance
    if (user.balance < subdata.price)
      return res.json({ status: 400, msg: `Insufficient Balance` });

    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "verifyiuc", automation: autosParent.id },
      });

      const url = `${autosParent.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autos.tokenName]: autosParent.token,
        [autos.serviceName]: sub.network,
        [autos.decoderName]: iuc,
      };
      let options;
      if (autosParent.auths === "yes") {
        options = {
          headers: {
            Authorization: `Token ${autosParent.token}`,
          },
        };
      } else {
        options = {};
      }

      const getFormdata = `${url}?${autosParent?.tokenName}=${autosParent.token
        }${autos.serviceName ? `&${autos.serviceName}=${sub.network}` : ""}${autos.decoderName ? `&${autos.decoderName}=${iuc}` : ""
        }`;

      console.log(
        options,
        "options",
        getFormdata,
        postFormdata,
        autos.method,
        autos.format
      );
      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata, options);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata, options);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata, options);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata, options);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }
      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {
        const resultData = result.data.desc;

        return res.json({ status: 200, msg: resultData });
      } else {
        // this is where the alternate api service goes to only if there is specified service api

        const altAutos = await Cable.findOne({
          where: { id: subdata.altAutomation },
        });
        if (!altAutos)
          return res.json({
            status: 400,
            msg: `No Service Connected to this package yet!!..`,
          });

        const altAutosParent = await Automation.findOne({
          where: { id: altAutos.automation },
        });
        if (!altAutosParent)
          return res.json({ status: 404, msg: `No Service found!!` });

        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "verifyiuc", automation: altAutosParent.id },
          });

          const url = `${altAutosParent.apiurl}${altEndpoint.title}`;
          const postFormdata = {
            [altAutos.tokenName]: altAutosParent.token,
            [altAutos.serviceName]: sub.network,
            [altAutos.decoderName]: iuc,
          };
          let options;
          if (altAutosParent.auths === "yes") {
            options = {
              headers: {
                Authorization: `Token ${altAutosParent.token}`,
              },
            };
          } else {
            options = {};
          }

          const getFormdata = `${url}?${altAutosParent?.tokenName}=${altAutosParent.token
            }${altAutos.serviceName
              ? `&${altAutos.serviceName}=${sub.network}`
              : ""
            }${altAutos.decoderName ? `&${altAutos.decoderName}=${iuc}` : ""}`;

          console.log(
            options,
            "options",
            getFormdata,
            postFormdata,
            altAutos.method,
            altAutos.format
          );
          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(getFormdata, options);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(url, postFormdata, options);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(getFormdata, options);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(url, postFormdata, options);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }

          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            const resultData = result.data.desc;

            return res.json({ status: 200, msg: resultData });
          } else {
            //open up to email addressing, but fail onthe user's end
            return res.json({
              status: 400,
              msg: `Verification Not Successful`,
            });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          return res.json({ status: 400, msg: `Verification Not Successful` });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};


// electricity setting
exports.ElectricityBill = async (req, res) => {
  try {
    const { iuc, serviceType, amount, pin, sub } = req.body;
    if (!iuc || !serviceType || !amount || !pin || !sub)
      return res.json({ status: 400, msg: `Incomplete Parameters` });
    const user = await User.findByPk(req.user);
    if (!user) return res.json({ status: 400, msg: `User Not Found` });
    const newAmount = parseFloat(amount)
    // check if subscription exists
    const service = await Subscription.findOne({ where: { id: sub } });
    if (!service)
      return res.json({ status: 400, msg: `Subscription not found` });

    // check is package exists
    const pack = await Subscriptiondata.findOne({ where: { id: serviceType } });
    if (!pack) return res.json({ status: 400, msg: `Package Not Found` });

    const level = await Level.findOne({ where: { id: user.level } })
    const levelPack = await Levelpack.findOne({ where: { level: level.id, pack: pack.id } })

    // check if transaction pin matches
    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Invalid Transaction Pin detected` });

    // check if user has enough balance
    if (user.balance < newAmount)
      return res.json({ status: 400, msg: `Insufficient Balance` });

    // check if there is an automation service connected to the package
    const autos = await Elec.findOne({
      where: { id: pack.automation },
    });
    if (!autos)
      return res.json({
        status: 400,
        msg: "No automation service connected to this package yet",
      });

    let autosParent;
    if (autos) {
      autosParent = await Automation.findOne({
        where: { id: autos.automation },
        include: [{ model: Endpoint, as: "autos" }],
      });
    }

    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "electricity", automation: autosParent.id },
      });

      const url = `${autosParent.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autosParent.tokenName]: autosParent.token,
        [autos.serviceName]: service.network,
        [autos.meterName]: iuc,
        [autos.serviceTypeName]: pack.title,
        [autos.amountName]: newAmount,
      };
      let options;
      if (autosParent.auths === "yes") {
        options = {
          headers: {
            Authorization: `Token ${autosParent.token}`,
          },
        };
      } else {
        options = {};
      }

      const getFormdata = `${url}?${autosParent?.tokenName}=${autosParent.token
        }${autos.serviceName ? `&${autos.serviceName}=${service.network}` : ""}${autos.meterName ? `&${autos.meterName}=${iuc}` : ""
        }${autos.serviceTypeName
          ? `&${autos.serviceTypeName}=${pack.title.toLowerCase()}`
          : ""
        }${autos.amountName ? `&${autos.amountName}=${newAmount}` : ""}`;

      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }
      const date = new Date();
      // const note = `${pack.title} Purchase Successful to ${iuc}.`;
      const note = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response ||
        result.data.data.server_message
        }]`;
      const failnote = `Unable to purchase ${service.network} ${pack.title} electricity plan to ${iuc}`;
      const txid = `TXID_${otpGenerator.generate(5, {
        digits: true,
        specialChars: false,
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
      })}${date.getTime()}`;
      const errmsg = `Transaction Not Successful`;
      const title = "electricity purchase";
      const adminnote = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response ||
        result.data.data.server_message
        }]`;

      console.log(
        "zoned",
        result,
        "electricity coming from zoner",
        getFormdata,
        postFormdata,
        "first plight"
      );
      // =================

      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {
        //deduct from user balance
        user.prevbalance = user.balance;
        user.balance = eval(`${user.balance} - ${newAmount}`);

        await user.save();
        const newWithData = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: newAmount,
          txid,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: service.id,
          title,
        };
        const withd = await Withdraw.create(newWithData);

        const newtrans = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: newAmount,
          txid,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: service.id,
          title,
        };
        await Transaction.create(newtrans);

        const adminnewtrans = {
          user: user.id,
          autos: autosParent.title,
          note: adminnote,
          txid,
          amount: newAmount,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          service: service.id,
          title,
        };
        await Admintransaction.create(adminnewtrans);
        return res.json({
          status: 200,
          msg: `${service.network} Electricity Purchased Successfully!.`,
          user,
        });
      } else {
        // this is where the alternate api service goes to only if there is specified service api

        let altAutosParent;
        // check if there is an alternate automation service standby
        const altAutos = await Elec.findOne({
          where: { id: pack.altAutomation },
        });
        if (altAutos) {
          altAutosParent = await Automation.findOne({
            where: { id: altAutos.automation },
            include: [{ model: Endpoint, as: "autos" }],
          });
        }

        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "electricity", automation: altAutosParent.id },
          });

          const url = `${altAutosParent.apiurl}${altEndpoint.title}`;
          const postFormdata = {
            [altAutosParent.tokenName]: altAutosParent.token,
            [altAutos.serviceName]: service.network,
            [altAutos.meterName]: iuc,
            [altAutos.serviceTypeName]: pack.title,
            [altAutos.amountName]: newAmount,
          };
          let options;
          if (altAutosParent.auths === "yes") {
            options = {
              headers: {
                Authorization: `Token ${altAutosParent.token}`,
              },
            };
          } else {
            options = {};
          }

          const getFormdata = `${url}?${altAutosParent?.tokenName}=${altAutosParent.token
            }${altAutos.serviceName
              ? `&${altAutos.serviceName}=${service.network}`
              : ""
            }${altAutos.meterName ? `&${altAutos.meterName}=${iuc}` : ""}${altAutos.serviceTypeName
              ? `&${altAutos.serviceTypeName}=${pack.title.toLowerCase()}`
              : ""
            }${altAutos.amountName ? `&${altAutos.amountName}=${newAmount}` : ""}`;

          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(getFormdata);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(url, postFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(getFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(url, postFormdata);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }
          const date = new Date();
          // const note = `${pack.title} Purchase Successful to ${iuc}.`;
          const note = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response ||
            result.data.data.server_message
            }]`;
          const failnote = `Unable to purchase ${service.network} ${pack.title} electricity plan to ${iuc}`;
          const txid = `TXID_${otpGenerator.generate(5, {
            digits: true,
            specialChars: false,
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
          })}${date.getTime()}`;
          const errmsg = `Transaction Not Successful`;
          const title = "electricity purchase";
          const adminnote = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response ||
            result.data.data.server_message
            }]`;

          console.log(
            "zoned",
            result,
            "electricity coming from zoner",
            getFormdata,
            postFormdata,
            "second plight"
          );

          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            //deduct from user balance
            user.prevbalance = user.balance;
            user.balance = eval(`${user.balance} - ${newAmount}`);

            await user.save();
            const newWithData = {
              user: user.id,
              autos: altAutosParent.title,
              note,
              amount: newAmount,
              txid,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              note,
              autos: altAutosParent.title,
              amount: newAmount,
              txid,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: adminnote,
              txid,
              amount: newAmount,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({
              status: 200,
              msg: `Electricity Purchased Successfully!.`,
              user,
            });
          } else {
            //open up to email addressing, but fail onthe user's end
            const newWithData = {
              user: user.id,
              autos: altAutosParent.title,
              note: failnote,
              amount: newAmount,
              txid,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: failnote,
              amount: newAmount,
              txid,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: `${failnote} - ${adminnote}`,
              txid,
              amount: newAmount,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              service: service.id,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({ status: 400, msg: errmsg });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          const newWithData = {
            user: user.id,
            autos: autosParent.title,
            note: failnote,
            amount: newAmount,
            txid,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          const withd = await Withdraw.create(newWithData);

          const newtrans = {
            user: user.id,
            autos: autosParent.title,
            note: failnote,
            amount: newAmount,
            txid,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          await Transaction.create(newtrans);

          const adminnewtrans = {
            user: user.id,
            autos: autosParent.title,
            note: `${failnote} - ${adminnote}`,
            txid,
            amount: newAmount,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            service: service.id,
            title,
          };
          await Admintransaction.create(adminnewtrans);
          return res.json({ status: 400, msg: errmsg });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};


// verifying electricity number
exports.VerifyMeterNumber = async (req, res) => {
  try {
    const { pin, service, iuc, serviceType } = req.body;
    if (!pin || !service || !iuc || !serviceType)
      return res.json({ status: 400, msg: `Incomplete Parameters` });

    const user = await User.findOne({ where: { id: req.user } });
    if (!user) return res.json({ status: 404, msg: `User Not found` });

    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Wrong Transaction Pin Detected` });

    const sub = await Subscription.findOne({ where: { id: service } });
    if (!sub) return res.json({ status: 404, msg: `Subscription Not found` });

    const subdata = await Subscriptiondata.findOne({
      where: { id: serviceType },
    });
    if (!subdata) return res.json({ status: 404, msg: `Package not found` });
    const autos = await Elec.findOne({ where: { id: subdata.automation } });
    if (!autos)
      return res.json({
        status: 400,
        msg: `No Service Connected to this package yet!..`,
      });

    const autosParent = await Automation.findOne({
      where: { id: autos.automation },
    });
    if (!autosParent) return res.json({ status: 404, msg: `No Service found` });
    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "verifymeter", automation: autosParent.id },
      });

      const url = `${autosParent.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autosParent.tokenName]: autosParent.token,
        [autos.serviceName]: sub.network,
        [autos.meterName]: iuc,
        [autos.serviceTypeName]: subdata.title,
      };
      let options;
      if (autosParent.auths === "yes") {
        options = {
          headers: {
            Authorization: `Token ${autosParent.token}`,
          },
        };
      } else {
        options = {};
      }

      const getFormdata = `${url}?${autosParent?.tokenName}=${autosParent.token
        }${autos.serviceName ? `&${autos.serviceName}=${sub.network}` : ""}${autos.meterName ? `&${autos.meterName}=${iuc}` : ""
        }${autos.serviceTypeName
          ? `&${autos.serviceTypeName}=${subdata.title.toLowerCase()}`
          : ""
        }`;

      console.log(
        options,
        "options",
        getFormdata,
        postFormdata,
        autos.method,
        autos.format
      );
      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata, options);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata, options);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata, options);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata, options);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }

      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {
        const resultData = result.data.desc;

        return res.json({ status: 200, msg: resultData });
      } else {
        // this is where the alternate api service goes to only if there is specified service api

        const altAutos = await Elec.findOne({
          where: { id: subdata.altAutomation },
        });
        if (!altAutos)
          return res.json({
            status: 400,
            msg: `No Service Connected to this package yet!!..`,
          });

        const altAutosParent = await Automation.findOne({
          where: { id: altAutos.automation },
        });
        if (!altAutosParent)
          return res.json({ status: 404, msg: `No Service found!!` });

        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "verifymeter", automation: altAutosParent.id },
          });

          const url = `${altAutosParent.apiurl}${altEndpoint.title}`;
          const postFormdata = {
            [altAutosParent.tokenName]: altAutosParent.token,
            [altAutos.serviceName]: sub.network,
            [altAutos.meterName]: iuc,
            [altAutos.serviceTypeName]: subdata.title,
          };
          let options;
          if (altAutosParent.auths === "yes") {
            options = {
              headers: {
                Authorization: `Token ${altAutosParent.token}`,
              },
            };
          } else {
            options = {};
          }

          const getFormdata = `${url}?${altAutosParent?.tokenName}=${altAutosParent.token
            }${altAutos.serviceName
              ? `&${altAutos.serviceName}=${sub.network}`
              : ""
            }${altAutos.meterName ? `&${altAutos.meterName}=${iuc}` : ""}${altAutos.serviceTypeName
              ? `&${altAutos.serviceTypeName}=${subdata.title.toLowerCase()}`
              : ""
            }`;

          console.log(
            options,
            "options",
            getFormdata,
            postFormdata,
            altAutos.method,
            altAutos.format
          );
          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(getFormdata, options);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(url, postFormdata, options);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(getFormdata, options);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(url, postFormdata, options);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }

          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            const resultData = result.data.desc;

            return res.json({ status: 200, msg: resultData });
          } else {
            //open up to email addressing, but fail onthe user's end
            return res.json({
              status: 400,
              msg: `Verification Not Successful`,
            });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          return res.json({ status: 400, msg: `Verification Not Successful` });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};
// 45700848851


// exam setting
exports.ExamBill = async (req, res) => {
  try {
    const { sub, variation, pin, mobile } = req.body;
    if (!variation || !mobile || !pin || !sub)
      return res.json({ status: 400, msg: `Incomplete Parameters` });
    const user = await User.findByPk(req.user);
    if (!user) return res.json({ status: 400, msg: `User Not Found` });

    // check if subscription exists
    // const service = await Subscription.findOne({ where: { id: sub } });
    // if (!service)
    //   return res.json({ status: 400, msg: `Subscription not found` });

    // check is package exists
    const pack = await Subscriptiondata.findOne({ where: { id: sub } });
    if (!pack) return res.json({ status: 400, msg: `Package Not Found` });

    const level = await Level.findOne({ where: { id: user.level } })
    const levelPack = await Levelpack.findOne({ where: { level: level.id, pack: pack.id } })

    // check if transaction pin matches
    if (pin !== user.datapin)
      return res.json({ status: 400, msg: `Invalid Transaction Pin detected` });

    // check if user has enough balance
    if (user.balance < pack.price)
      return res.json({ status: 400, msg: `Insufficient Balance` });

    // check if there is an automation service connected to the package
    const autos = await Exam.findOne({
      where: { id: pack.automation },
    });
    if (!autos)
      return res.json({
        status: 400,
        msg: "No automation service connected to this package yet",
      });

    let autosParent, altAutosParent;
    if (autos) {
      autosParent = await Automation.findOne({
        where: { id: autos.automation },
        include: [{ model: Endpoint, as: "autos" }],
      });
    }

    if (autos) {
      const endpoint = await Endpoint.findOne({
        where: { category: "exam", automation: autosParent.id },
      });

      const url = `${autosParent.apiurl}${endpoint.title}`;
      const postFormdata = {
        [autosParent.tokenName]: autosParent.token,
        [autos.servcieName]: pack.title,
        [autos.mobileName]: mobile,
        [autos.variationName]: variation,
      };

      const getFormdata = `${url}?${autosParent?.tokenName}=${autosParent.token
        }${autos.serviceName ? `&${autos.serviceName}=${pack.title}` : ""}${autos.variationName ? `&${autos.variationName}=${variation}` : ""
        }${autos.mobileName ? `&${autos.mobileName}=${mobile}` : ""}`;

      // test for all request cases that matches
      if (autos.method === "GET" && autos.format === "HEAD") {
        result = await axios.get(getFormdata);
      } else if (autos.method === "GET" && autos.format === "BODY") {
        result = await axios.get(url, postFormdata);
      } else if (autos.method === "POST" && autos.format === "HEAD") {
        result = await axios.post(getFormdata);
      } else if (autos.method === "POST" && autos.format === "BODY") {
        result = await axios.post(url, postFormdata);
      } else {
        return res.json({ status: 400, msg: `Provide a valid Api Service` });
      }
      const date = new Date();
      // const note = `${pack.title} Purchase Successful to ${mobile}.`;
      const note = `${pack.title} Purchase Successful to ${mobile}. - [${result.data.message || result.data.msg || result.data.api_response ||
        result.data.data.server_message
        }]`;
      const failnote = `Unable to purchase ${pack.title} exam plan to ${mobile}`;
      const txid = `TXID_${otpGenerator.generate(5, {
        digits: true,
        specialChars: false,
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
      })}${date.getTime()}`;
      const errmsg = `Transaction Not Successful`;
      const title = "exam purchase";
      const adminnote = `${pack.title} Purchase Successful to ${mobile}. - [${result.data.message || result.data.msg || result.data.api_response ||
        result.data.data.server_message
        }]`;

      console.log(
        "zoned",
        result,
        "exam coming from zoner",
        getFormdata,
        postFormdata,
        "first plight"
      );
      // =================

      // if all is good move forward else move to the second api service
      if (
        result.data.status_code === "200" ||
        result.data.code === "200" ||
        result.data.status === "success" ||
        result.data.Status === "successful" ||
        result.data.status === true
      ) {
        //deduct from user balance
        user.prevbalance = user.balance;
        user.balance = eval(`${user.balance} - ${levelPack?.pricing ? levelPack.pricing : pack.price}`);


        await user.save();
        const newWithData = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: levelPack?.pricing ? levelPack.pricing : pack.price,
          txid,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          title,
        };
        const withd = await Withdraw.create(newWithData);

        const newtrans = {
          user: user.id,
          autos: autosParent.title,
          note,
          amount: levelPack?.pricing ? levelPack.pricing : pack.price,
          txid,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          title,
        };
        await Transaction.create(newtrans);

        const adminnewtrans = {
          user: user.id,
          autos: autosParent.title,
          note: adminnote,
          txid,
          amount: levelPack?.pricing ? levelPack.pricing : pack.price,
          tag: withd.id,
          status: "success",
          prevbal: user.prevbalance,
          currbal: user.balance,
          title,
        };
        await Admintransaction.create(adminnewtrans);
        return res.json({
          status: 200,
          msg: `${pack.title} Exam Purchased Successfully!.`,
          user,
        });
      } else {
        // this is where the alternate api service goes to only if there is specified service api
        // check if there is an alternate automation service standby
        const altAutos = await Exam.findOne({
          where: { id: pack.altAutomation },
        });
        if (altAutos) {
          altAutosParent = await Automation.findOne({
            where: { id: altAutos.automation },
            include: [{ model: Endpoint, as: "autos" }],
          });
        }

        if (altAutos) {
          const altEndpoint = await Endpoint.findOne({
            where: { category: "exam", automation: altAutosParent.id },
          });

          const url = `${altAutosParent.apiurl}${altEndpoint.title}`;
          const postFormdata = {
            [autosParent.tokenName]: autosParent.token,
            [altAutos.servcieName]: pack.title,
            [altAutos.mobileName]: mobile,
            [altAutos.variationName]: variation,
          };

          const getFormdata = `${url}?${altAutosParent?.tokenName}=${altAutosParent.token
            }${altAutos.serviceName ? `&${altAutos.serviceName}=${pack.title}` : ""
            }${altAutos.variationName
              ? `&${altAutos.variationName}=${variation}`
              : ""
            }${altAutos.mobileName ? `&${altAutos.mobileName}=${mobile}` : ""}`;

          // test for all request cases that matches
          if (altAutos.method === "GET" && altAutos.format === "HEAD") {
            result = await axios.get(getFormdata);
          } else if (altAutos.method === "GET" && altAutos.format === "BODY") {
            result = await axios.get(url, postFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "HEAD") {
            result = await axios.post(getFormdata);
          } else if (altAutos.method === "POST" && altAutos.format === "BODY") {
            result = await axios.post(url, postFormdata);
          } else {
            return res.json({
              status: 400,
              msg: `Provide a valid Api Service`,
            });
          }
          const date = new Date();
          // const note = `${pack.title} Purchase Successful to ${iuc}.`;
          const note = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response ||
            result.data.data.server_message
            }]`;
          const failnote = `Unable to purchase ${pack.title} exam plan to ${iuc}`;
          const txid = `TXID_${otpGenerator.generate(5, {
            digits: true,
            specialChars: false,
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
          })}${date.getTime()}`;
          const errmsg = `Transaction Not Successful`;
          const title = "exam purchase";
          const adminnote = `${pack.title} Purchase Successful to ${iuc}. - [${result.data.message || result.data.msg || result.data.api_response ||
            result.data.data.server_message
            }]`;

          console.log(
            "zoned",
            result,
            "exam coming from zoner",
            getFormdata,
            postFormdata,
            "second plight"
          );

          // test for positivity, if not true then move to email notification
          if (
            result.data.status_code === "200" ||
            result.data.code === "200" ||
            result.data.status === "success" ||
            result.data.Status === "successful" ||
            result.data.status === true
          ) {
            //deduct from user balance
            user.prevbalance = user.balance;
            user.balance = eval(`${user.balance} - ${levelPack?.pricing ? levelPack.pricing : pack.price}`);

            await user.save();
            const newWithData = {
              user: user.id,
              autos: altAutosParent.title,
              note,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              note,
              autos: altAutosParent.title,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: adminnote,
              txid,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              tag: withd.id,
              status: "success",
              prevbal: user.prevbalance,
              currbal: user.balance,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({
              status: 200,
              msg: `Exam Purchased Successfully!.`,
              user,
            });
          } else {
            //open up to email addressing, but fail onthe user's end
            const newWithData = {
              user: user.id,
              autos: altAutosParent.title,
              note: failnote,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              title,
            };
            const withd = await Withdraw.create(newWithData);

            const newtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: failnote,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              txid,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              title,
            };
            await Transaction.create(newtrans);

            const adminnewtrans = {
              user: user.id,
              autos: altAutosParent.title,
              note: `${failnote} - ${adminnote}`,
              txid,
              amount: levelPack?.pricing ? levelPack.pricing : pack.price,
              tag: withd.id,
              status: "failed",
              prevbal: user.balance,
              currbal: user.balance,
              title,
            };
            await Admintransaction.create(adminnewtrans);
            return res.json({ status: 400, msg: errmsg });
          }
        } else {
          //if there is no alternative automation then send details to email of the admin
          // //////////////////////
          const newWithData = {
            user: user.id,
            autos: autosParent.title,
            note: failnote,
            amount: levelPack?.pricing ? levelPack.pricing : pack.price,
            txid,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            title,
          };
          const withd = await Withdraw.create(newWithData);

          const newtrans = {
            user: user.id,
            autos: autosParent.title,
            note: failnote,
            amount: levelPack?.pricing ? levelPack.pricing : pack.price,
            txid,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            title,
          };
          await Transaction.create(newtrans);

          const adminnewtrans = {
            user: user.id,
            autos: autosParent.title,
            note: `${failnote} - ${adminnote}`,
            txid,
            amount: levelPack?.pricing ? levelPack.pricing : pack.price,
            tag: withd.id,
            status: "failed",
            prevbal: user.balance,
            currbal: user.balance,
            title,
          };
          await Admintransaction.create(adminnewtrans);
          return res.json({ status: 400, msg: errmsg });
        }
      }
    }
  } catch (error) {
    ServerError(res, error);
  }
};

// data: {
//     status: 'success',
//     status_code: '200',
//     old_balance: '3688',
//     new_balance: 3580,
//     time: '19-Jun-23  12:15 PM',
//     amountPaid: '108',
//     message: 'MTN SME 500MB Purchase Successful on 08139067401 Dear Customer, You have successfully shared 500MB Data to 2348139067401. Your SME data balance is 25475.35GB expires 24/09/2023. Thankyou',
//     api_response: 'Dear Customer, You have successfully shared 500MB Data to 2348139067401. Your SME data balance is 25475.35GB expires 24/09/2023. Thankyou'
//   }
// https://dailycashout.com.ng/api/buydatav3.php?api_key=edf4f8280172ea664ef938bf3e540172&refid=REF87259120181376JP9IV2T9UVAID&plans=500&network=MTN_CGD&phonenumber=08061686770&return_url=https://dailycashout.com.ng

// {
//   "code": "200",
//   "status": "true",
//   "token": "\n949510427854<=>WRN193440350",
//   "message": "WAEC PIN purchase successfully PIN (\n949510427854<=>WRN193440350)"
// }
