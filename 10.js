const mysql = require('mysql');

const dbConfig = require('../../common/dbConfig');
const Model = require('./Model');

const _table = 'warehouses';

class Warehouse extends Model {
  static get _table() { return _table; }

  constructor(data, table = null) {
    try {
      super(data, _table);
    } catch (err) {
      throw err;
    }
  }

  static getWarehouses() {
    return new Promise((resolve, reject) => {
      const connection = mysql.createConnection(dbConfig);
      const query = 'SELECT * FROM warehouses ORDER BY city';
      connection.query(query,(err, warehouses) => {
        connection.end();
        if (err) {
          return reject(err);
        }
        const warehousesObj = warehouses.reduce((accumulator, warehouse) => {
          if (!accumulator[warehouse.city]) {
            accumulator[warehouse.city] = { city: warehouse.city, addresses: [] };
          }
          accumulator[warehouse.city].addresses.push(warehouse.address);
          accumulator[warehouse.city].addresses = [
            ...new Set(accumulator[warehouse.city].addresses),
          ];
          return accumulator;
        }, {});
        return resolve(Object.values(warehousesObj));
      });
    });
  }

  static addWarehouse(warehouseData) {
    return new Promise((resolve, reject) => {
      const dataToSet = {
        ...warehouseData,
      };
      const connection = mysql.createConnection(dbConfig);
      const query = 'INSERT INTO warehouses SET ?';
      connection.query(query, dataToSet, (err, warehouse) => {
        if (err) {
          connection.end();
          return reject(err);
        }
        return resolve(warehouse);
      });
    });
  }

  static updateWarehouse(warehouseId, {
    address, city, name, phone, email,
  }) {
    return new Promise((resolve, reject) => {
      const warehouseData = {
        address, city, name, phone, email,
      };
      const connection = mysql.createConnection(dbConfig);
      const query = `UPDATE warehouses SET ${Object.keys(warehouseData).map(key => ` ${key} = ? `).join(', ')} WHERE id = ?`;
      connection.query(query, [...Object.values(warehouseData), warehouseId], (err, res) => {
        if (err) {
          connection.end();
          return reject(err);
        }
        return resolve(res);
      });
    });
  }

  static removeUserDelivery(warehouseId) {
    return new Promise((resolve, reject) => {
      const connection = mysql.createConnection(dbConfig);
      const query = 'DELETE FROM warehouses WHERE id = ?';
      connection.query(query, [warehouseId], (err, res) => {
        connection.end();
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  }

  static get _with() { return _with; }
}

module.exports = Warehouse;
