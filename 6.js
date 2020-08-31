import React from 'react';
import { Redirect } from 'react-router';
import axios from 'axios';
import Garage from '../../components/Garage';
import { getHeader } from '../../actions/header';
import { DEV_SERVER, SERVER_PORT } from '../../constants/API/config';
import { MY_GARAGE } from '../../constants/API';
import { getUserOrders, getOrderById } from '../../actions/Profile/Orders';
import { getUserInfo } from '../../components/modules/Auth';
import { getMachineOrders, addAttachOrder } from '../../actions/Garage';

const API_URL = `${DEV_SERVER}:${SERVER_PORT}${MY_GARAGE}`;

export default class MyGarageProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allMachines: [],
      machinesToRender: [],
      addMachineData: {},
      machineProdusers: [],
      machineProduser: null,
      showAdd: false,
      show: false,
      viewedTechnick: [],
      orders: [],
      editeMileAge: null,
      selectedKey: 'trucks',
      ordersSidebar: [],
      photo: null,
      disabledAdd: true,
      filteredMachines: [],
    };
  }

  async componentDidMount() {
    const headers = getHeader();

    /* загружаются все машины, для просмотра по умолчанию идут грузовики */

    axios
      .get(API_URL, { headers })
      .then(async res => {
        const { success, response } = res.data;
        if (success && response && response.length) {
          const result = [];
          response.map(machine => {
            if (machine.isDelete == 0) {
              result.push(machine);
            }
          });
          const trucks = [];
          result.map(machine => {
            if (machine.machineType === 'trucks') {
              trucks.push(machine);
            }
          });
          this.setState({
            allMachines: result,
            machinesToRender: trucks
          });
        }
      })
      .catch(err => {
        console.log(err);
      });

    /* к разделу сайдбара Техника, запчасти к которой вы просматривали, 
    подтягивается из localStorage, применяемость от каждой единицы товара */

    const productsHistoryJson = localStorage.getItem('productsHistory');
    const productsHistory = JSON.parse(productsHistoryJson);
    const viewedTechnick = [];
    if (productsHistory && productsHistory.length !== 0) {
      if (Array.isArray(productsHistory)) {
        productsHistory.map(product => {
          viewedTechnick.push(product.applicability);
        });
      } else {
        viewedTechnick.push(productsHistory.applicability);
      }
    }
    this.setState({
      viewedTechnick
    });

    /* в раздел сайдбара Нераспределенные запчасти подтягиваются запчасти из Моих заказов, которые не привязаны ни к одной единице техники */

    let i = 0;
    while (this.state.orders.length < 5) {
      const data = await getUserOrders(i, 10);
      i++;
      const orders = [];
      data.response.orders.map(order => {
        order.orderProducts.map(product => {
          if (!product.idMachine) {
            orders.push(product);
          }
        });
      });
      const ordersSidebar = [];
      orders.map(order => ordersSidebar.push(order));
      this.setState({
        orders,
        ordersSidebar
      });
    }
  }

  /* выбор типа техники */

  handleSelect = selectedKey => {
    const { allMachines } = this.state;
    const machines = [];
    if (Array.isArray(allMachines) && allMachines.length !== 0) {
      allMachines.map(machine => {
        if (machine.machineType === selectedKey) {
          machines.push(machine);
        }
      });
    } else if (
      allMachines &&
      allMachines.length !== 0 &&
      allMachines.machineType === selectedKey
    ) {
      machines.push(allMachines);
    }

    this.setState({
      machinesToRender: machines,
      selectedKey,
      filteredMachines: [],
    });
  };

  /* обработчик типа техники при добавлении новой единицы */

  handleTechnickType = e => {
    const { addMachineData } = this.state;
    addMachineData.machineType = e.target.value;
    this.setState({
      addMachineData
    });
    this.fetchMachineProducer(e.target.value);
  };

  /* показывать технику конкретной модели */

  filterMachinesByModel = model => {
    const { machinesToRender } = this.state;
    const filteredMachines = [];
    machinesToRender.map(machine => {
      if (machine.model === model) {
        filteredMachines.push(machine);
      }
    });
    this.setState({
      filteredMachines,
    });
  }

  /* выбор производителя техники, должен состыковываться с автокаталогом, значения выбраны для примера */

  fetchMachineProducer = type => {
    switch (type) {
      case 'agriculture':
        this.setState({
          machineProdusers: ['John Deere', 'Case', 'Claas', 'New Holand']
        });
        break;
      case 'trucks':
        this.setState({
          machineProdusers: ['Daf', 'Man', 'Mersedes', 'Iveco', 'МАЗ', 'Камаз']
        });
        break;
      case 'loaders':
        this.setState({
          machineProdusers: ['Mitsubishi', 'Komatsu', 'ТСМ', 'Balkancar']
        });
        break;
      case 'others':
        this.setState({
          machineProdusers: ['SAF', 'WIX', 'Srellox', 'Meritor']
        });
        break;
      default:
        this.setState({
          machineProdusers: []
        });
    }
  };

  /* обработчики инпутов в модальном окне добавления новой техники */

  handleTechnickProducer = e => {
    const { addMachineData } = this.state;
    addMachineData.producer = e.target.value;
    this.setState({
      addMachineData,
      machineProduser: e.target.value
    });
  };

  handleTechnickModel = e => {
    const { addMachineData } = this.state;
    addMachineData.model = e.target.value;
    this.setState({
      addMachineData,
      disabledAdd: false,
    });
  };

  handleVIN = e => {
    const { addMachineData } = this.state;
    addMachineData.vin = e.target.value;
    this.setState({
      addMachineData
    });
  };

  handleYearOfIssue = e => {
    const { addMachineData } = this.state;
    addMachineData.yearOfIssue = e.target.value;
    this.setState({
      addMachineData
    });
  };

  handleMileage = e => {
    const { addMachineData } = this.state;
    addMachineData.mileage = e.target.value;
    this.setState({
      addMachineData
    });
  };
  
  /* добавить технику без вин кода, сделано для примера, пока нет автокаталога */

  showAddWithoutVIN = () => {
    this.setState({
      showAdd: !this.state.showAdd
    });
  };

  /* показать/закрыть модальное окно для добавления новой техники */

  handleShow = () => {
    this.setState({ show: true });
  };

  handleClose = () => {
    this.setState({
      show: false,
      showAdd: false
    });
  };

  /* редактировать пробег, фото */

  handleChangeMileAge = (e, id) => {
    const { machinesToRender } = this.state;
    const index = machinesToRender.findIndex(machine => machine.id === id);
    machinesToRender[index].mileage = e.target.value;

    this.setState({
      editeMileAge: e.target.value,
      machinesToRender
    });
  };

  updatePhoto = e => {
    const photo = e.target.files['0'];
    this.setState({
      photo
    });
  };

  /* submits */

  handleSubmitEdite = id => {
    const { editeMileAge, photo, machinesToRender } = this.state;
    const data = { id, mileage: editeMileAge, isDelete: 0 };
    const headers = getHeader();

    if (photo) {
      const bodyFormData = new FormData();
      bodyFormData.append('image', photo);
      headers['Content-Type'] = 'multipart/form-data';
      const index = machinesToRender.findIndex(machine => machine.id === id);

      axios({
        headers,
        method: 'put',
        url: `${API_URL}/${id}`,
        data: bodyFormData
      })
        .then(res => {
          if (res.data) {
            machinesToRender[index].photo = res.data.photoPath[0];
            this.setState({
              machinesToRender,
              photo: null
            });
          }
        })
        .catch(err => console.log(err));
    }

    if (editeMileAge) {
      axios({ headers, method: 'put', url: `${API_URL}`, data })
        .then(async res => {
          this.setState({
            editeMileAge: null
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
  };

  handleSubmitDelete = id => {
    const { machinesToRender } = this.state;
    const index = machinesToRender.findIndex(machine => machine.id === id);
    const data = { id, mileage: machinesToRender[index].mileage, isDelete: 1 };
    const headers = getHeader();
    axios({ headers, method: 'put', url: `${API_URL}`, data })
      .then(async res => {})
      .catch(err => {
        console.log(err);
      });
    machinesToRender.splice(index, 1);
    this.setState({ machinesToRender });
  };

  /* добавление новой единицы */

  handleSubmit = () => {
    const headers = getHeader();
    const {
      addMachineData,
      showAdd,
      allMachines,
      selectedKey,
      machinesToRender,
      photo
    } = this.state;
    addMachineData.dateAdded = new Date();
    if (showAdd) {
      addMachineData.vin = 'no vin';
    }
    addMachineData.isDelete = 0;
    addMachineData.mileageMeasure = 'km';

    if (!photo) {
      addMachineData.photo =
        'https://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png';
    }

    const bodyFormData = new FormData();
    bodyFormData.append('photo', photo);
    bodyFormData.set('machineType', addMachineData.machineType);
    bodyFormData.set('producer', addMachineData.producer);
    bodyFormData.set('model', addMachineData.model);
    bodyFormData.set('yearOfIssue', addMachineData.yearOfIssue);
    bodyFormData.set('vin', addMachineData.vin);
    bodyFormData.set('mileage', addMachineData.mileage);
    bodyFormData.set('mileageMeasure', addMachineData.mileageMeasure);
    bodyFormData.set('isDelete', addMachineData.isDelete);
    if (addMachineData.photo) {
      bodyFormData.set('photo', addMachineData.photo);
    }
    headers['Content-Type'] = 'multipart/form-data';

    axios({ headers, method: 'post', url: `${API_URL}`, data: bodyFormData })
      .then(async res => {
        if (res.data) {
          if (res.data.response.photoPath) {
            addMachineData.photo = res.data.response.photoPath[0];
          }
          allMachines.push(addMachineData);
          if (selectedKey === addMachineData.machineType) {
            machinesToRender.push(addMachineData);
          }

          this.setState({
            allMachines,
            machinesToRender,
            addMachineData: {}
          });
        }
      })
      .catch(err => {
        console.log(err);
      });

    this.handleClose();
  };

  /* удалить пункт из списка из просмотренной техники */

  handleDelete = technick => {
    const { viewedTechnick } = this.state;
    const index = viewedTechnick.findIndex(item => item === technick);
    viewedTechnick.splice(index, 1);
    this.setState({
      viewedTechnick
    });
  };

  /* привязать деталь из нераспределенных к единице техники */

  submitAttach = (idMachine, idProduct) => {
    const { ordersSidebar } = this.state;
    addAttachOrder(idMachine, idProduct);
    const index = ordersSidebar.findIndex(
      order => order.orderProductId === idProduct
    );
    ordersSidebar.splice(index, 1);
    const newOrders = ordersSidebar;
    this.setState({
      ordersSidebar
    });
  };

  /* удалить запчасть из списка нераспределенных деталей. она появится снова после обновления */

  removeOrderItem = id => {
    const { ordersSidebar } = this.state;
    const index = ordersSidebar.findIndex(order => order.id === id);
    ordersSidebar.splice(index, 1);
    const newOrders = ordersSidebar;
    this.setState({
      ordersSidebar
    });
  };

  render() {
    const {
      machinesToRender,
      machineProdusers,
      machineProduser,
      showAdd,
      show,
      viewedTechnick,
      orders,
      showEdite,
      allMachines,
      ordersSidebar,
      disabledAdd,
      filteredMachines,
    } = this.state;
    if (!getUserInfo()) return <Redirect to="/login" />;

    return (
      <div>
        <Garage
          machines={machinesToRender}
          handleSelect={this.handleSelect}
          handleTechnickType={this.handleTechnickType}
          machineProdusers={machineProdusers}
          machineProduser={machineProduser}
          handleTechnickProducer={this.handleTechnickProducer}
          handleSubmit={this.handleSubmit}
          handleVIN={this.handleVIN}
          showAddWithoutVIN={this.showAddWithoutVIN}
          showAdd={showAdd}
          handleYearOfIssue={this.handleYearOfIssue}
          handleMileage={this.handleMileage}
          handleTechnickModel={this.handleTechnickModel}
          handleClose={this.handleClose}
          show={show}
          handleShow={this.handleShow}
          viewedTechnick={viewedTechnick}
          handleDelete={this.handleDelete}
          orders={orders}
          handleChangeMileAge={this.handleChangeMileAge}
          handleSubmitEdite={this.handleSubmitEdite}
          handleSubmitDelete={this.handleSubmitDelete}
          allMachines={allMachines}
          ordersSidebar={ordersSidebar}
          submitAttach={this.submitAttach}
          removeOrderItem={this.removeOrderItem}
          updatePhoto={this.updatePhoto}
          disabledAdd={disabledAdd}
          filterMachinesByModel={this.filterMachinesByModel}
          filteredMachines={filteredMachines}
        />
      </div>
    );
  }
}
