const models = require('../models/models');
const mailSender = require('../../components/MailSender');
const md5 = require('../../node_modules/md5');

/* зарегистрированная техника в гараже у пользователя
    params: id, type - id, тип пользователя */

async function getUserMachines(req, res) {
  if (req.user) {
    try {
      if (req.params.id && req.params.type) {
        req.user = {
          id: req.params.id,
          type: req.params.type,
        }
      }

      const machines = await models.Garage.getUserMachines(req.user);
      res.sendSuccess(machines);
    } catch (err) {
      if (err.message) return res.sendFail(err.message, 500);
      return res.sendFail('Внутренняя ошибка', 500);
    }
  } else {
    res.sendFail('Вы должны авторизоваться, прежде чем смотреть ваш список доставок', 403);
  }
}

/* проверить есть ли зарегистрированная в гараже у пользователя техника */

async function checkIfMachineExist(req, res, next) {
  if (req.user) {
    try {
      const countMachine = await models.Garage.checkIfMachineExist(req.user);
      res.sendSuccess(countMachine);
    } catch (err) {
      if (err.message) return res.sendFail(err.message, 500);
      return res.sendFail('Внутренняя ошибка', 500);
    }
  }
}

/* req.body - объект с данными для обновления */
  
async function updateUserMachine(req, res, next) {
  if (req.user && req.body) {
    try {
      await models.Garage.updateUserMachine(req.body, req.user);
      res.sendSuccess(null, 'Успешно обновлено');
    } catch (err) {
      if (err.message) return res.sendFail(err.message, 500);
      return res.sendFail('Внутренняя ошибка', 500);
    }
  } else {
    res.sendFail('Неправильные данные для выполнения операции', 403);
  }
}

/* привязать купленную запчасть к единице техники
    req.body - объект с ид техники и детали из таблицы orderProducts */

async function attachOrderToMachine(req, res) {
  if (req.body) {
    try {
      await models.Garage.attachOrderToMachine(req.body);
      res.sendSuccess(null, 'Успешно объеденен');
    } catch (err) {
      if (err.message) return res.sendFail(err.message, 500);
      return res.sendFail('Внутренняя ошибка', 500);
    }
  } else {
    res.sendFail('Неправильные данные для выполнения операции', 403);
  }
}

/* все детали, привязанные к машине. req.params.id - ид техники */

async function getOrdersByMachine(req, res) {
  if (req.params.id) {
    try {
      const orders = await models.Garage.getOrdersByMachine(req.params.id);
      res.sendSuccess(orders);
    } catch (err) {
      res.sendFail(err)
    }
  }
}

/* заказ дефектовки, req.body - объект с данными о времени дефектовки и контактными данными пользователя */

async function orderTroubleshooting(req, res) {
  if (req.body && req.user) {
    try {
      const data = {
        email: req.user.email,
        name: req.body.name,
        mobilePhone: req.body.mobilePhone,
        date: req.body.date,
        comment: req.body.comment,
      }
      const result = await mailSender.sendOrderTroubleshootingToManager(data);    
      return res.sendSuccess(null, 'Ваше письмо отправлено, спасибо за обращение.');
    } catch (err) {
      return res.sendFail(err);
    }
  }
}

/* добавления фото к технике, params: id машины */

async function addPhoto(req, res) {
  const photo = req.files;
  const { id } = req.params;

  if (photo) {
    let fileErrors = [];
    for (let filename of Object.keys(photo)) {
      const file = photo[filename];
      if(!file.mimetype.includes('image/'))
          fileErrors.push(1);
    }
    if (fileErrors.length > 0) {
      res.status(406).send({ ERROR: 'Неверный тип файла(-ов)' })
    }
    else {
      const filePaths = [];
      let photoPath;

      for (const filename of Object.keys(photo)) {
        const file = photo[filename];

        try {
            let extension = photo[filename].name.split('.').pop();
            let newFileName = filename.replace(/[^A-z0-9]/gi, '');
            const path = `/public/garage/${md5(filename + new Date()).slice(1,16)+newFileName}.${extension}`;
            filePaths.push(path);
            photoPath = `${global.rootDir}${path}`;
            await file.mv(`${global.rootDir}${path}`);
          }
            catch (err){
                fileErrors.push(err);
                console.log(err);
                return res.status(500).send({ ERROR: 'Ошибка при сохранении фото!' });
        }
      }
        if(fileErrors.length > 0){
            res.status(500).send({ ERROR: 'Ошибка! Не удалось сохранить фото' });
        }
        else{
  const result = await models.Garage.addPhoto(req.user.id, req.user.type, id, filePaths);
  if (!req.create) {
    if (result) {
            res.send({
                  MESSAGE: 'Фото добавлено',
                  photoPath: filePaths,
              });
          } else {
              res.status(500).send({ ERROR: 'Ошибка!' });
          }
  } else {
    if (result) {
      return ({
            photoPath: filePaths,
        });
    } else {
        return ({ ERROR: 'Ошибка!' });
    }
  }
        }
      }
    }
}

/* добавление новой машины в гараж пользователя, req.body - объект
	"machineType",
	"producer",
	"model",
	"yearOfIssue",
	"vin",
	"mileage",
	"mileageMeasure",
	"dateAdded",
  "isDelete": 1 | 0
   */

async function addUserMachine(req, res, next) {
  if (req.user && req.body) {
    try {
      if (req.params.id && req.params.type) {
        req.user = {
          id: req.params.id,
          type: req.params.type,
        }
      }
      const machine = await models.Garage.addUserMachine(req.body, req.user);
      if (req.files) {
        const data = {};
        data.files = req.files;
        data.params = {};
        data.user = {};
        data.params.id = machine.insertId;
        data.user.id = req.user.id;
        data.user.type = req.user.type;
        data.create = true;
        const aa = await addPhoto(data, res);
        res.sendSuccess({ id: machine.insertId, message: 'Успешно добавлено', photoPath: aa.photoPath });
      } else {
        res.sendSuccess({ id: machine.insertId, message: 'Успешно добавлено' });
      }
      
    } catch (err) {
      if (err.message) return res.sendFail(err.message, 500);
      return res.sendFail('Внутренняя ошибка', 500);
    }
  } else {
    res.sendFail('Неправильные данные для выполнения операции', 403);
  }
}

/* получить русское название категории по url для аналитики */

async function getTitleOfCategory(req, res) {
  if (req.params.url) {
    try {
      const title = await models.Garage.getTitleOfCategory(req.params.url);
      res.sendSuccess(title);
    } catch (err) {
      res.sendFail(err)
    }
  }
}

module.exports = {
  getUserMachines, 
  addUserMachine, 
  updateUserMachine, 
  attachOrderToMachine, 
  getOrdersByMachine, 
  orderTroubleshooting, 
  checkIfMachineExist,
  addPhoto,
  getTitleOfCategory,
};