const Subscription = require("../models").subscriptions;
const Subscriptiondata = require("../models").subscriptiondata;
const Automation = require("../models").automations;
const Endpoint = require("../models").endpoints;
const Network = require("../models").networks;
const Apiplan = require("../models").apiplans;
const Level = require("../models").levels;
const Airtime = require("../models").airtimes;
const Cable = require("../models").cables;
const Exam = require("../models").exams;
const Electricity = require("../models").electricities;
const Levelpackage = require("../models").levelpackages;
const Levelsub = require("../models").levelsubs;
const User = require("../models").users;
const slug = require("slug");
const { ServerError } = require("../config/utils");

exports.AllSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.findAll({
      include: [{ model: Subscriptiondata, as: "sub" }],
    });
    const subdata = await Subscriptiondata.findAll({});
    return res.json({ status: 200, subs, subdata });
  } catch (error) {
    ServerError(res, error);
  }
};
exports.AdminCreateSubscription = async (req, res) => {
  try {
    const { network, category, packages, tag, percent, min, max } = req.body;
    if (!network || !category || !min || !max)
      return res.json({ status: 400, msg: `Provide a complete information` });
    // check if subscription for the package already exists
    const checksub = await Subscription.findOne({
      where: { network: network },
    });
    if (!checksub) {
      const slugcat = slug(category, "-");
      const newsub = { network, category: slugcat, tag, percent, min, max};
      const subs = await Subscription.create(newsub);
      packages.map(async (item) => {
        const newpack = {
          network: subs.id,
          title: item.title,
          price: item.price,
        };
        await Subscriptiondata.create(newpack);
      });
      return res.json({
        status: 200,
        msg: `Subscription created successfully`,
      });
    } else {
      packages.map(async (item) => {
        const newpack = {
          network: checksub.id,
          title: item.title,
          price: item.price,
        };
        await Subscriptiondata.create(newpack);
      });
      return res.json({
        status: 200,
        msg: `Subscription created successfully`,
      });
    }
  } catch (error) {
    ServerError(res, error);
  }
};
exports.AdminEditSubscription = async (req, res) => {
  try {
    const { category, network, packages, id, tag, percent, min, max } = req.body;
    if (!network || !category || !min || !max)
      return res.json({ status: 400, msg: `Provide a complete information` });
    const subs = await Subscription.findOne({ where: { id: id } });
    // first update the packages
    packages.map(async (item) => {
      //check if package already exists
      const findPack = await Subscriptiondata.findOne({
        where: { id: item.id },
      });
      if (findPack) {
        findPack.title = item.title;
        findPack.price = item.price;
        findPack.lock = item.lock;
        await findPack.save();
      } else {
        const newpack = {
          network: subs.id,
          title: item.title,
          price: item.price,
          lock: item.lock,
        };
        await Subscriptiondata.create(newpack);
      }
    });
    const slugcat = slug(category, "-");
    subs.network = network;
    subs.category = slugcat;
    subs.tag = tag;
    subs.percent = percent
    subs.min = min
    subs.max = max
    await subs.save();

    return res.json({ status: 200, msg: `Subscription successfully updated` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminUpdateSubLocks = async (req, res) => {
  try {
    const { packages } = req.body;
    packages.map(async (item) => {
      const subs = await Subscription.findOne({ where: { id: item.id } });
      if (subs) {
        subs.locked = item.locked;
        await subs.save();
      }
    });

    return res.json({ status: 200, msg: `Services successfully updated` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetSubscriptiondata = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findOne({
      where: { id: id },
      include: [{ model: Subscriptiondata, as: "sub" }],
    });
    return res.json({ status: 200, msg: sub });
  } catch (error) {
    ServerError(res, error);
  }
};
exports.AdminUpdateSubscriptionData = async (req, res) => {
  try {
    const { id, title, price } = req.body;
    if (!title || !price)
      return res.json({ status: 400, msg: `Provide a complete information` });
    const subdata = await Subscriptiondata.findOne({ where: { id: id } });
    if (!subdata) return res.json({ status: 400, msg: `package not found` });
    subdata.title = title;
    subdata.price = price;
    await subdata.save();

    return res.json({ status: 200, msg: `Package updated successfully` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminDeleteSubscriptionData = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await Subscriptiondata.findOne({ where: { id: id } });
    if (!data)
      return res.json({
        status: 404,
        msg: `Unable to find subscription package data`,
      });
    await data.destroy();
    return res.json({ status: 200, msg: `Package Deleted successfully` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminDeleteSubscription = async (req, res) => {
  try {
    const { id } = req.body;
    const sub = await Subscription.findByPk(id);
    if (!sub) return res.json({ status: 400, msg: `Subscriptions not found` });
    const subdata = await Subscriptiondata.findAll({
      where: { network: sub.id },
    });
    await subdata.map((item) => item.destroy());
    await sub.destroy();

    return res.json({ status: 200, msg: `Subscriptions successfully deleted` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.OffAutomationService = async (req, res) => {
  try {
    const { tag, pack } = req.body;
    if (!pack || !tag)
      return res.json({
        status: 400,
        msg: `Incomplete information detected!..`,
      });
    const item = await Subscriptiondata.findOne({ where: { id: pack } });
    if (!item) return res.json({ status: 404, msg: `Package not found` });
    if (tag === "main") {
      item.automation = null;
      item.deal = null;
    } else {
      item.altAutomation = null;
      item.altDeal = null;
    }
    await item.save();

    return res.json({ status: 200, msg: `${tag} Automation suspended` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminAddAutomationService = async (req, res) => {
  try {
    const {
      title,
      method,
      format,
      auths,
      token,
      refid,
      apiurl,
      callback,
      planName,
      portedNumber,
      portedName,
      mobileName,
      endpoints,
      networkName,
      refName,
      networks,
      tokenName,
      callbackName,
    } = req.body;
    if (
      !title ||
      !method ||
      !format ||
      !token ||
      !apiurl ||
      !planName ||
      !mobileName ||
      !endpoints ||
      !tokenName ||
      endpoints.length < 1 ||
      networks.length < 1
    )
      return res.json({
        status: 400,
        msg: `Make sure to provide all fields properly`,
      });
    // check if automation already exists
    const checkData = await Automation.findOne({ where: { token: token } });
    if (checkData) return res.json({ status: 400, msg: `API already exists` });
    const newData = {
      title,
      method,
      auths,
      format,
      token,
      refid,
      apiurl,
      callback,
      callbackName,
      planName,
      mobileName,
      portedName,
      portedNumber,
      networkName,
      refName,
      tokenName,
    };
    const autos = await Automation.create(newData);
    endpoints.map(async (item) => {
      const itemData = {
        automation: autos.id,
        title: item.title,
        category: item.category,
      };
      await Endpoint.create(itemData);
    });
    networks.map(async (item) => {
      if (item.nets === "data") {
        const itemData = {
          title: item.title,
          tag: item.tag,
          automation: autos.id,
          nets: item.nets,
        };
        await Network.create(itemData);
      }
    });
    return res.json({ status: 200, msg: `API created successfully` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminUpdateAutomationService = async (req, res) => {
  try {
    const {
      title,
      method,
      format,
      auths,
      token,
      refid,
      apiurl,
      callback,
      callbackName,
      id,
      planName,
      mobileName,
      portedName,
      portedNumber,
      tokenName,
      endpoints,
      networkName,
      refName,
      networks,
    } = req.body;
    if (
      !title ||
      !method ||
      !format ||
      !token ||
      !apiurl ||
      !id ||
      !planName ||
      !mobileName ||
      !tokenName ||
      endpoints.length < 1 ||
      networks.length < 1
    )
      return res.json({
        status: 400,
        msg: `Make sure to provide all fields properly`,
      });
    // check if automation already exists
    const autos = await Automation.findOne({ where: { id: id } });
    if (!autos) return res.json({ status: 400, msg: `API does not exists` });
    autos.title = title;
    autos.method = method;
    autos.format = format;
    autos.token = token;
    autos.refid = refid;
    autos.apiurl = apiurl;
    autos.callback = callback;
    autos.callbackName = callbackName;
    autos.planName = planName;
    autos.mobileName = mobileName;
    autos.portedNumber = portedNumber;
    autos.portedName = portedName;
    autos.networkName = networkName;
    autos.refName = refName;
    autos.tokenName = tokenName;
    autos.auths = auths;
    await autos.save();

    // check if api has endpoints and remove them
    const allpoints = await Endpoint.findAll({
      where: { automation: autos.id },
    });
    if (allpoints.length > 0) {
      allpoints.map(async (item) => {
        await item.destroy();
      });
    }

    if (endpoints.length > 0) {
      endpoints.map(async (item) => {
        const itemData = {
          automation: autos.id,
          title: item.title,
          category: item.category,
        };
        await Endpoint.create(itemData);
      });
    }

    // check if api has networks and remove them
    const allnetworks = await Network.findAll({
      where: { automation: autos.id },
    });
    if (allnetworks.length > 0) {
      allnetworks.map(async (item) => {
        if (item.nets === "data") {
          await item.destroy();
        }
      });
    }

    if (networks.length > 0) {
      networks.map(async (item) => {
        if (item.nets === "data") {
          const itemData = {
            automation: autos.id,
            title: item.title,
            tag: item.tag,
            nets: item.nets,
          };
          await Network.create(itemData);
        }
      });
    }

    return res.json({ status: 200, msg: `API updated successfully` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.UserFetchAutomationServiceFromPackage = async (req, res) => {
  try {
    const pack = await Subscriptiondata.findOne({
      where: { id: req.params.id },
    });
    const autos = await Automation.findOne({
      where: { id: pack.automation },
      include: [
        { model: Endpoint, as: "autos" },
        { model: Network, as: "networks" },
      ],
    });
    return res.json({ status: 200, msg: autos });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetAllAutomationServices = async (req, res) => {
  try {
    const autos = await Automation.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Endpoint, as: "autos" },
        { model: Network, as: "networks" },
        { model: Apiplan, as: "plans" },
      ],
    });
    return res.json({ status: 200, msg: autos });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetAllArtimeAutomationService = async (req, res) => {
  try {
    const autos = await Airtime.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Network, as: "airnetworks" },
        { model: Apiplan, as: "airplans" },
      ],
    });
    const mainautos = await Automation.findAll({});

    let mappedArr = [];
    autos.map((item) => {
      mainautos.map((data) => {
        if (data.id === item.automation) {
          const filts = {
            ...item.dataValues,
            title: data.title,
          };
          mappedArr.push(filts);
        }
      });
    });
    return res.json({ status: 200, msg: mappedArr });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetAllCableAutomationService = async (req, res) => {
  try {
    const autos = await Cable.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Network, as: "cabnetworks" },
        { model: Apiplan, as: "cabplans" },
      ],
    });
    const mainautos = await Automation.findAll({});

    let mappedArr = [];
    autos.map((item) => {
      mainautos.map((data) => {
        if (data.id === item.automation) {
          const filts = {
            ...item.dataValues,
            title: data.title,
          };
          mappedArr.push(filts);
        }
      });
    });
    return res.json({ status: 200, msg: mappedArr });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetAllExamAutomationService = async (req, res) => {
  try {
    const autos = await Exam.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Network, as: "exnetworks" },
        { model: Apiplan, as: "explans" },
      ],
    });
    const mainautos = await Automation.findAll({});

    let mappedArr = [];
    autos.map((item) => {
      mainautos.map((data) => {
        if (data.id === item.automation) {
          const filts = {
            ...item.dataValues,
            title: data.title,
          };
          mappedArr.push(filts);
        }
      });
    });
    return res.json({ status: 200, msg: mappedArr });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetAllElectricityAutomationService = async (req, res) => {
  try {
    const autos = await Electricity.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Network, as: "elecnetworks" },
        { model: Apiplan, as: "elecplans" },
      ],
    });
    const mainautos = await Automation.findAll({});

    let mappedArr = [];
    autos.map((item) => {
      mainautos.map((data) => {
        if (data.id === item.automation) {
          const filts = {
            ...item.dataValues,
            title: data.title,
          };
          mappedArr.push(filts);
        }
      });
    });
    return res.json({ status: 200, msg: mappedArr });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetSingleAutomationServices = async (req, res) => {
  try {
    const { id } = req.params;
    const autos = await Automation.findOne({
      where: { id: id },
      include: [
        { model: Endpoint, as: "autos" },
        { model: Network, as: "networks" },
        { model: Apiplan, as: "plans" },
      ],
    });
    if (!autos) return res.json({ status: 400, msg: `API Service not found` });

    const item = await Airtime.findOne({
      where: { automation: id },
      include: [
        { model: Network, as: "airnetworks" },
        { model: Apiplan, as: "airplans" },
      ],
    });

    const cables = await Cable.findOne({
      where: { automation: id },
      include: [
        { model: Network, as: "cabnetworks" },
        { model: Apiplan, as: "cabplans" },
      ],
    });

    const exams = await Exam.findOne({
      where: { automation: id },
      include: [
        { model: Network, as: "exnetworks" },
        { model: Apiplan, as: "explans" },
      ],
    });

    const electricities = await Electricity.findOne({
      where: { automation: id },
      include: [
        { model: Network, as: "elecnetworks" },
        { model: Apiplan, as: "elecplans" },
      ],
    });

    return res.json({
      status: 200,
      msg: autos,
      airtimes: item,
      cables,
      exams,
      electricities,
    });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminDeleteAutomationService = async (req, res) => {
  try {
    const { id } = req.body;
    const autos = await Automation.findOne({ where: { id: id } });
    if (!autos) return res.json({ status: 400, msg: `API Service not found` });
    // check every subscription data that has the automation service id and remove them
    const packs = await Subscriptiondata.findAll({ where: { automation: id } });
    if (packs.length > 0) {
      packs.map(async (item) => {
        item.automation = null;
        await item.save();
      });
    }
    const points = await Endpoint.findAll({ where: { automation: id } });
    if (points.length > 0) {
      points.map(async (item) => {
        await item.destroy();
      });
    }
    await autos.destroy();
    return res.json({ status: 200, msg: `API Deleted successfully` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.UpdateSinglePackageAutomation = async (req, res) => {
  try {
    const { id, automation, deal, tag, nets } = req.body;
    if (!automation || !id || !deal || !tag || !nets)
      return res.json({ status: 400, msg: `Provide sufficient information` });
    const pack = await Subscriptiondata.findOne({
      where: { id: id },
      include: [{ model: Subscription, as: "sub" }],
    });
    if (!pack) return res.json({ status: 400, msg: `Package not found` });

    if (tag === "main") {
      pack.automation = automation;
      pack.deal = deal;
      pack.autoNetwork = nets;
      await pack.save();
    } else {
      if (!pack.automation)
        return res.json({
          status: 400,
          msg: `Cannot set alternative service without setting up main service`,
        });
      pack.altAutomation = automation;
      pack.altDeal = deal;
      pack.altAutoNetwork = nets;
      await pack.save();
    }

    return res.json({ status: 400, msg: "API Updated" });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.GetOtherAutomationServices = async (req, res) => {
  try {
    const {tag, aut, id} = req.params 
    const pack = await Subscriptiondata.findOne({where: {id: id}})
    if(!pack) return res.json({status: 404, msg: `Package not found`})
    let result, output;
    if(tag === 'main') {
      // return main automation
      if(aut === 'airtime') {
        result = await Airtime.findOne({where: {id: pack.automation}})
      }else if (aut === 'cable') {
        result = await Cable.findOne({where: {id: pack.automation}})
      }else if (aut === 'exam') {
        result = await Exam.findOne({where: {id: pack.automation}})
      }else if (aut === 'electricity') {
        result = await Electricity.findOne({where: {id: pack.automation}})
      }else {
        result = null
      }
      output = await Automation.findOne({where: {id: result.automation}})
    }else {
      // return alternate automation
      if(aut === 'airtime') {
        result = await Airtime.findOne({where: {id: pack.altAutomation}})
      }else if (aut === 'cable') {
        result = await Cable.findOne({where: {id: pack.altAutomation}})
      }else if (aut === 'exam') {
        result = await Exam.findOne({where: {id: pack.altAutomation}})
      }else if (aut === 'electricity') {
        result = await Electricity.findOne({where: {id: pack.altAutomation}})
      }else {
        result = null
      }
      output = await Automation.findOne({where: {id: result.automation}})
    }

    return res.json({status: 200, msg: output.title})
  } catch (error) {
    ServerError(res, error)
  }
}

exports.AdminAddApiPlans = async (req, res) => {
  try {
    const { plans, pack } = req.body;
    if (plans.length < 1)
      return res.json({ status: 400, msg: `Incomplete parameters detected.` });

    const findPlans = await Apiplan.findAll({ where: { pack: pack } });
    if (findPlans.length > 0) {
      findPlans.map(async (item) => {
        await item.destroy();
      });
    }
    plans.map(async (item) => {
      const data = {
        automation: item.automation,
        pack: item.pack,
        plan: item.plan,
        title: item.title,
      };
      await Apiplan.create(data);
    });

    return res.json({ status: 200, msg: `Plans Successfully Added` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminUpdateApiPlans = async (req, res) => {
  try {
    const { automation, plans, pack } = req.body;
    if (!automation || !plans || !pack)
      return res.json({ status: 400, msg: `Incomplete parameters detected.` });

    // delete exsting ones first
    const findPlans = await Apiplan.findAll({
      where: { automation: automation, pack: pack },
    });
    if (findPlans.length > 0) {
      findPlans.map(async (item) => {
        await item.destroy();
      });
    }
    plans.map(async (item) => {
      const data = {
        automation: automation,
        pack: pack,
        plan: item,
      };
      await Apiplan.create(data);
    });

    return res.json({ status: 200, msg: `Plans Successfully Updated` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetAllApiPlans = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await Apiplan.findAll({
      where: { pack: id },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ status: 200, msg: items });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.AdminGetSingleApiPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await Automation.findOne({
      where: { id: id },
      include: [{ model: Apiplan, as: "plans" }],
    });

    return res.json({ status: 200, msg: items });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.CreateLevel = async (req, res) => {
  try {
    const { title, packs, subs } = req.body;
    // check if level already exists
    const findLev = await Level.findOne({ where: { title: title } });
    if (findLev)
      return res.json({ status: 400, msg: `Level already exists!...` });

    const newLevel = await Level.create({ title });

    // workout for packages
    if (packs.length > 0) {
      packs.map(async (item) => {
        await Levelpackage.create({
          level: newLevel.id,
          pack: item.id,
          pricing: item.pricing,
        });
      });
    }

    // workout for subscriptions
    if (subs.length > 0) {
      subs.map(async (item) => {
        await Levelsub.create({
          level: newLevel.id,
          sub: item.id,
          percent: item.percent,
        });
      });
    }


    return res.json({ status: 200, msg: `Level Successfully Created!...` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.UpdateLevel = async (req, res) => {
  try {
    const { title, packs, subs, id } = req.body;
    // check if level already exists
    const findLev = await Level.findOne({ where: { id: id } });
    if (!findLev)
      return res.json({ status: 400, msg: `Level does not exists!...` });
    findLev.title = title;
    await findLev.save();

    // workout for packages
    if (packs.length > 0) {
        // first delete the previous ones
        const prevPacks = await Levelpackage.findAll({where: {level: id}})
        if(prevPacks.length > 0) {
            prevPacks.map(async (item) => {
                await item.destroy()
            })
        }
        // add new ones
      packs.map(async (item) => {
        await Levelpackage.create({
          level: findLev.id,
          pack: item.id,
          pricing: item.pricing,
        });
      });
    }

    // workout for subscriptions
    if (subs.length > 0) {
        // first delete the previous ones
        const prevSubs = await Levelsub.findAll({where: {level: id}})
        if(prevSubs.length > 0) {
            prevSubs.map(async (item) => {
                await item.destroy()
            })
        }
        // add new ones
      subs.map(async (item) => {
        await Levelsub.create({
          level: findLev.id,
          sub: item.id,
          percent: item.percent,
        });
      });
    }

    // workout for users
  

    return res.json({ status: 200, msg: `Level Successfully Updated!...` });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.DeleteLevelByAdmin = async (req, res) => {
  try {
    const {id} = req.body 
    const level = await Level.findByPk(id)
    if(!level) return res.json({status: 404, msg: `Level not found`})

    const packs = await Levelpackage.findAll({where: {level: level.id}})
    if(packs.length > 0) {
      packs.map(async (item) => {
        await item.destroy()
      })
    }

    const subs = await Levelsub.findAll({where: {level: level.id}})
    if(subs.length > 0) {
      subs.map(async (item)=>{
        await item.destroy();
      })
    }

    const users = await User.findAll({where: {level: level.id}})
    if(users.length > 0) {
      users.map(async (item) => {
        item.level = null 
        await item.save()
      })
    }

    await level.destroy()
    return res.json({status: 200, msg: `Level Successfully Deleted!...`})
  } catch (error) {
    ServerError(res, error)
  }
}

exports.FetchSingleLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const lev = await Level.findOne({
      where: { id: id },
      include: [
        { model: Levelpackage, as: "levelpack" },
        { model: Levelsub, as: "levelsub" },
      ],
    });
    const users = await User.findAll({ where: { level: id } });
    const items = {
      ...lev.dataValues,
      users,
    };
    return res.json({ status: 200, msg: items });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.FetchLevels = async (req, res) => {
  try {
    const lev = await Level.findAll({});
    const users = await User.findAll({})
    const data = []
    lev.map(item => {
      const userArr = users.filter(ele => ele.level === item.id)
      const dataArr = {
        ...item.dataValues,
        users: userArr.length
      }
      data.push(dataArr)
    })
    return res.json({ status: 200, msg: data });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.UpgradeUserLevel = async (req, res) => {
  try {
    const { email, level } = req.body;
    if (!email)
      return res.json({ status: 400, msg: `Email Address is required` });
    if (!level)
      return res.json({ status: 400, msg: `Specify the level to work with` });
    const user = await User.findOne({ where: { email: email } });
    if (!user) return res.json({ status: 404, msg: `User Not found` });

    const lev = await Level.findByPk(level);
    if (!lev) return res.json({ status: 404, msg: `level not found` });

    // check if user is aready in the same
    if (user.level === lev)
      return res.json({
        status: 400,
        msg: `User already exists in this level`,
      });

    // check if account to upgrade is not an admin account
    if (user.role === "admin")
      return res.json({ status: 400, msg: `Cannot Upgrade an admin account` });

    user.level = lev.id;
    await user.save();

    return res.json({
      status: 200,
      msg: `You have successfuly upgraded ${user.firstname}'s account level`,
    });
  } catch (error) {
    ServerError(res, error);
  }
};

exports.CreateAirtimeAutomation = async (req, res) => {
  try {
    const {
      method,
      format,
      automation,
      networks,
      mobileName,
      networkName,
      amountName,
      refName,
    } = req.body;
    if (!method || !format)
      return res.json({
        status: 400,
        msg: `Incomplete Parameters detected!..`,
      });

    // check if automation exists
    const autos = await Automation.findOne({ where: { id: automation } });
    if (!autos)
      return res.json({
        status: 400,
        msg: `Cannot upload airtime integration on an automations that does not exists!`,
      });

    // check id airtime integration already exists, if no then create one else update it
    const airs = await Airtime.findOne({ where: { automation: automation } });
    if (!airs) {
      // creates new one
      const newitem = {
        method,
        format,
        automation: autos.id,
        mobileName,
        networkName,
        amountName,
        refName,
      };
      const airtimed = await Airtime.create(newitem);

      const allnetworks = await Network.findAll({
        where: { automation: airtimed.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "airtime") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "airtime") {
            const itemData = {
              automation: airtimed.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Airtime Automation Added` });
    } else {
      airs.method = method;
      airs.format = format;
      airs.mobileName = mobileName;
      airs.networkName = networkName;
      airs.amountName = amountName;
      airs.refName = refName;
      await airs.save();

      const allnetworks = await Network.findAll({
        where: { automation: airs.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "airtime") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "airtime") {
            const itemData = {
              automation: airs.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Airtime Automation Updated` });
    }
  } catch (error) {
    ServerError(res, error);
  }
};

exports.CreateCableAutomation = async (req, res) => {
  try {
    const {
      method,
      format,
      automation,
      networks,
      serviceName,
      decoderName,
      planName,
    } = req.body;
    if (!method || !format)
      return res.json({
        status: 400,
        msg: `Incomplete Parameters detected!..`,
      });

    // check if automation exists
    const autos = await Automation.findOne({ where: { id: automation } });
    if (!autos)
      return res.json({
        status: 400,
        msg: `Cannot upload cable integration on an automations that does not exists!`,
      });

    // check id cable integration already exists, if no then create one else update it
    const cabs = await Cable.findOne({ where: { automation: automation } });
    if (!cabs) {
      // creates new one
      const newitem = {
        method,
        format,
        automation: autos.id,
        serviceName,
        decoderName,
        planName,
      };
      const cabled = await Cable.create(newitem);

      const allnetworks = await Network.findAll({
        where: { automation: cabled.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "cable") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "cable") {
            const itemData = {
              automation: cabled.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Cable Automation Added` });
    } else {
      cabs.method = method;
      cabs.format = format;
      cabs.serviceName = serviceName;
      cabs.decoderName = decoderName;
      cabs.planName = planName;
      await cabs.save();

      const allnetworks = await Network.findAll({
        where: { automation: cabs.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "cable") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "cable") {
            const itemData = {
              automation: cabs.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Cable Automation Updated` });
    }
  } catch (error) {
    ServerError(res, error);
  }
};

exports.CreateExamAutomation = async (req, res) => {
  try {
    const {
      method,
      format,
      automation,
      networks,
      serviceName,
      variationName,
      mobileName,
    } = req.body;
    if (!method || !format)
      return res.json({
        status: 400,
        msg: `Incomplete Parameters detected!..`,
      });

    // check if automation exists
    const autos = await Automation.findOne({ where: { id: automation } });
    if (!autos)
      return res.json({
        status: 400,
        msg: `Cannot upload exam integration on an automations that does not exists!`,
      });

    // check id exam integration already exists, if no then create one else update it
    const exams = await Exam.findOne({ where: { automation: automation } });
    if (!exams) {
      // creates new one
      const newitem = {
        method,
        format,
        automation: autos.id,
        serviceName,
        variationName,
        mobileName,
      };
      const examed = await Exam.create(newitem);

      const allnetworks = await Network.findAll({
        where: { automation: examed.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "exam") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "exam") {
            const itemData = {
              automation: examed.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Exam Automation Added` });
    } else {
      exams.method = method;
      exams.format = format;
      exams.serviceName = serviceName;
      exams.variationName = variationName;
      exams.mobileName = mobileName;
      await exams.save();

      const allnetworks = await Network.findAll({
        where: { automation: exams.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "exam") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "exam") {
            const itemData = {
              automation: exams.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Exam Automation Updated` });
    }
  } catch (error) {
    ServerError(res, error);
  }
};

exports.CreateElectricityAutomation = async (req, res) => {
  try {
    const {
      method,
      format,
      automation,
      networks,
      serviceName,
      meterName,
      serviceTypeName,
      amountName,
    } = req.body;
    if (!method || !format)
      return res.json({
        status: 400,
        msg: `Incomplete Parameters detected!..`,
      });

    // check if automation exists
    const autos = await Automation.findOne({ where: { id: automation } });
    if (!autos)
      return res.json({
        status: 400,
        msg: `Cannot upload Electricity integration on an automations that does not exists!`,
      });

    // check id Electricity integration already exists, if no then create one else update it
    const electricities = await Electricity.findOne({
      where: { automation: automation },
    });
    if (!electricities) {
      // creates new one
      const newitem = {
        method,
        format,
        automation: autos.id,
        serviceName,
        meterName,
        serviceTypeName,
        amountName,
      };
      const Electricityed = await Electricity.create(newitem);

      const allnetworks = await Network.findAll({
        where: { automation: Electricityed.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "electricity") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "electricity") {
            const itemData = {
              automation: Electricityed.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Electricity Automation Added` });
    } else {
      electricities.method = method;
      electricities.format = format;
      electricities.serviceName = serviceName;
      electricities.meterName = meterName;
      electricities.serviceTypeName = serviceTypeName;
      electricities.amountName = amountName;
      await electricities.save();

      const allnetworks = await Network.findAll({
        where: { automation: electricities.id },
      });
      if (allnetworks.length > 0) {
        allnetworks.map(async (item) => {
          if (item.nets === "electricity") {
            await item.destroy();
          }
        });
      }

      if (networks.length > 0) {
        networks.map(async (item) => {
          if (item.nets === "electricity") {
            const itemData = {
              automation: electricities.id,
              title: item.title,
              tag: item.tag,
              nets: item.nets,
            };
            await Network.create(itemData);
          }
        });
      }

      return res.json({ status: 200, msg: `Electricity Automation Updated` });
    }
  } catch (error) {
    ServerError(res, error);
  }
};
