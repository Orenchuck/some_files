import React from 'react';
import { Col } from 'react-bootstrap';
import {
  getMachineOrders,
  orderTroubleshooting,
  getTitleOfCategory
} from '../../actions/Garage';
import { getOrderById } from '../../actions/Profile/Orders';
import MachineOrderItem from './MachineOrderItem';
import TroubleshootingModal from './TroubleshootingModal';
import ChatModal from './ChatModal';
import Maintenance from './Maintenance';
import Analytics from './Analytics';

export default class EditeMachine extends React.Component<Props> {
  state = {
    showEdite: false,
    showEditeMileAge: false,
    showOrdersHistory: false,
    orders: null,
    allOrder: [],
    showMaintenance: false,
    selectMaintenance: 'one',
    showTroubleshooting: false,
    dataTroubleshooting: {
      comment: ''
    },
    troubleshootingSuccess: '',
    selectedOrders: [],
    showChat: false,
    canOrderTroubleshooting: false,
    showErrorMobile: false,
    showAnalytics: false,
    ordersByCategory: [],
  };

  /* условный рендер, рендерит возможность отредактировать технику */

  setShowEdit = () => {
    const { showEdite } = this.state;
    this.setState({
      showEdite: !showEdite
    });
  };

  /* показать инпут для изменения пробега */

  setEditeMileAge = () => {
    const { showEditeMileAge } = this.state;
    this.setState({
      showEditeMileAge: !showEditeMileAge
    });
  };

  // const ordersHistory = (id) => (async () => {
  //     const result = await getMachineOrders(id);
  //     orders = result;
  //     () => setShowOrderHistory(!showOrdersHistory);
  //   })();

  /* подгружаются все заказы по данной единице техники */

  ordersHistory = async () => {
    const { id } = this.props;
    const result = await getMachineOrders(id);
    const orders = result.data.response;
    const { showOrdersHistory } = this.state;

    this.setState({
      showOrdersHistory: !showOrdersHistory,
      showMaintenance: false,
      orders
    });
  };

  showAllOrder = async id => {
    const allOrder = await getOrderById(id);
    this.setState({
      allOrder
    });
  };

  /* подгружаются заказы за последний месяц/пол года/год */

  selectTimeOfOrders = e => {
    const { orders } = this.state;
    let { selectedOrders } = this.state;
    selectedOrders = [];
    let time;
    switch (e.target.value) {
      case 'month':
        time = Date.now() - 2592000000;
        break;
      case 'halfYear':
        time = Date.now() - 15552000000;
        break;
      case 'year':
        time = Date.now() - 15552000000 * 2;
        break;
      default:
        time = 0;
    }

    for (let i = 0; i < orders.length; i += 1) {
      const orderDate = orders[i].date;
      const dateMs = Date.parse(orderDate);
      if (dateMs - time >= 0) {
        selectedOrders.push(orders[i]);
      }
    }

    this.setState({
      selectedOrders
    });
  };

  /* открывается раздел техобслуживания, можно выбрать вид техобслуживания, привязать к автокаталогу */

  maintenance = () => {
    const { showMaintenance } = this.state;
    this.setState({
      showMaintenance: !showMaintenance,
      showOrdersHistory: false
    });
  };

  handleSelectMaintenance = selectedKey => {
    this.setState({
      selectMaintenance: selectedKey
    });
  };

  /* заказать дефектовку */

  setShowTroubleshooting = () => {
    const { showTroubleshooting } = this.state;
    this.setState({
      showTroubleshooting: !showTroubleshooting
    });
  };

  /* обработчики данных в окне заказа дефектовки */

  handleMobileChange = e => {
    const { dataTroubleshooting } = this.state;
    dataTroubleshooting.mobilePhone = e.target.value;
    if (dataTroubleshooting.mobilePhone.includes('_')) {
      this.setState({
        showErrorMobile: true
      });
    } else {
      this.setState({
        dataTroubleshooting
      });
      this.canOrderTroubleshooting();
    }
  };

  handleName = e => {
    const { dataTroubleshooting } = this.state;
    dataTroubleshooting.name = e.target.value;
    this.setState({
      dataTroubleshooting
    });
    this.canOrderTroubleshooting();
  };

  handleDate = e => {
    const { dataTroubleshooting } = this.state;
    dataTroubleshooting.date = e.target.value;
    this.setState({
      dataTroubleshooting
    });
    this.canOrderTroubleshooting();
  };

  handleComment = e => {
    const { dataTroubleshooting } = this.state;
    dataTroubleshooting.comment = e.target.value;
    this.setState({
      dataTroubleshooting
    });
    this.canOrderTroubleshooting();
  };

  canOrderTroubleshooting = () => {
    const { dataTroubleshooting } = this.state;
    if (
      dataTroubleshooting.name &&
      dataTroubleshooting.date &&
      dataTroubleshooting.mobilePhone
    ) {
      this.setState({
        canOrderTroubleshooting: true
      });
    }
  };

  orderTroubleshooting = async () => {
    const { dataTroubleshooting } = this.state;
    const result = await orderTroubleshooting(dataTroubleshooting);
    this.setState({
      troubleshootingSuccess: result.success
    });
  };

  /* задать вопрос эксперту */

  setShowChat = () => {
    const { showChat } = this.state;
    this.setState({
      showChat: !showChat
    });
  };

  getAnalitics = async id => {
    //сначала получаем заказы, привязанные к машине
    let { orders } = this.state;
    if (!orders) {
      const result = await getMachineOrders(id);
      orders = result.data.response;
      this.setState({
        orders,
      });
    }

    //создаем массивы из уникальных категорий, создаем список категорий, для вытаскивания их на русском
    const ordersByCategory = [];
    const categoryList = [];
    orders.map(order => {
      ordersByCategory.map(item => {
        if (item.catagoryLevelTwoUrl === order.catagoryLevelTwoUrl) {
          item.summ = +order.summ + +item.summ;
        }
      })
      const find = ordersByCategory.find(item => item.catagoryLevelTwoUrl === order.catagoryLevelTwoUrl);
      if (!find) {
        const orderToPush = {
          catagoryLevelTwoUrl: order.catagoryLevelTwoUrl,
          summ: +order.summ
        }
        ordersByCategory.push(orderToPush);
      }
    });
    ordersByCategory.map(item => {
      categoryList.push(item.catagoryLevelTwoUrl);
    });
    const categoriesStr = categoryList.join(',');

    if (ordersByCategory.length !== 0) {
      const russianTitles = await getTitleOfCategory(categoriesStr);

      //заменяем на русские значения
      ordersByCategory.map(item => {
        russianTitles.map(title => {
          if (title.url === item.catagoryLevelTwoUrl) {
            item.catagoryLevelTwoUrl = title.title;
          }
        });
     });

    this.setState({
      ordersByCategory,
    });
  }

    this.handleShowAnalytics();
  }

  handleShowAnalytics = () => {
    const { showAnalytics } = this.state;
    this.setState({
      showAnalytics: !showAnalytics,
    })
  }

  handleCloseAnalytics = () => {
    this.setState({
      showAnalytics: false,
    })
  }

  render() {
    const {
      machine,
      handleChangeMileAge,
      handleSubmitEdite,
      handleSubmitDelete,
      id
    } = this.props;
    const {
      showEdite,
      showEditeMileAge,
      showOrdersHistory,
      orders,
      allOrder,
      showMaintenance,
      selectMaintenance,
      showTroubleshooting,
      troubleshootingSuccess,
      selectedOrders,
      showChat,
      canOrderTroubleshooting,
      showErrorMobile,
      showAnalytics,
      ordersByCategory,
    } = this.state;

    return (
      <React.Fragment>
        {!showEdite ? (
          <>
            <Col xs={6} sm={4} md={3} className="pr-sm-0">
              <b>{machine.model}</b>
              <p className="mt-3">{machine.yearOfIssue} г.в.</p>
              <p>Номер кузова: {machine.vin}</p>
              <p className="cursor-pointer" onClick={this.setShowEdit}>
                <span className="fa fa-pencil mr-2"></span>редактировать</p>
            </Col>
            <Col xs={12} sm={6} md={3} className="pr-sm-0">
              <div className="card-garage-big-feature">
                <span className="fa fa-th" />
                <p>Каталог</p>
              </div>

              <div
                className="card-garage-big-feature"
                onClick={this.maintenance}
              >
                <span className="fa fa-gear" />
                <p>Техобслуживание</p>
              </div>

              <div
                className="card-garage-big-feature"
                onClick={() => this.ordersHistory()}
              >
                <span className="fa fa-history" />
                <p>История покупок</p>
              </div>
            </Col>
            <Col xs={12} sm={6} md={3} className="pr-sm-0">
              <div className="card-garage-big-feature">
                <span className="fa fa-bar-chart" />
                <p onClick={() => this.getAnalitics(machine.id)}>Аналитика</p>
              </div>
              <div
                className="card-garage-big-feature"
                onClick={this.setShowTroubleshooting}
              >
                <span className="fa fa-info-circle" />
                <p>Заказ дефектовки</p>
              </div>
              <TroubleshootingModal
                showTroubleshooting={showTroubleshooting}
                setShowTroubleshooting={this.setShowTroubleshooting}
                orderTroubleshooting={this.orderTroubleshooting}
                handleMobileChange={this.handleMobileChange}
                handleName={this.handleName}
                handleDate={this.handleDate}
                handleComment={this.handleComment}
                troubleshootingSuccess={troubleshootingSuccess}
                canOrderTroubleshooting={canOrderTroubleshooting}
                showErrorMobile={showErrorMobile}
              />
              <div
                className="card-garage-big-feature"
                onClick={() => this.setShowChat()}
              >
                <span className="fa fa-comments" />
                <p>вопрос эксперту</p>
              </div>
              <ChatModal showChat={showChat} setShowChat={this.setShowChat} />
            </Col>
          </>
        ) : (
          <>
            <Col xs={12} sm={6} md={4} className="pr-sm-0">
              <div className="card-garage-big-description">
                <div>
                  <b>VIN-код:</b> {machine.vin}
                </div>
                <div>
                  <b>Модель:</b> {machine.model}
                </div>
                <div>
                  <b>Производитель:</b> {machine.producer}
                </div>
                <div>
                  <b>Год выпуска:</b> {machine.yearOfIssue}
                </div>
                <div>
                  <b>Пробег:</b> {machine.mileage} {machine.mileageMeasure}
                  <p
                    className="card-garage-big-edit my-2"
                    onClick={this.setEditeMileAge}
                  >
                    Изменить
                  </p>
                </div>
                {showEditeMileAge ? (
                  <input
                    type="number"
                    min="0"
                    onChange={e => handleChangeMileAge(e, machine.id)}
                  />
                ) : null}
                <div>Изменить фото техники</div>
                <input type="file" onChange={e => updatePhoto(e)} />
              </div>
            </Col>
            <Col xs={12} md={3} className="ml-md-auto pr-md-5">
              <div className="card-garage-big-link-box">
                <div className="card-garage-big-link">
                  <span onClick={this.setEditeMileAge}>
                    <a
                      href="#"
                      onClick={() => handleSubmitEdite(machine.id)}
                      disabled={!showEditeMileAge}
                    >
                      Сохранить изменения
                      <span className="fa fa-save" />
                    </a>
                  </span>
                </div>
                <div className="card-garage-big-link">
                  <a href="#" onClick={() => handleSubmitDelete(machine.id)}>
                    Удалить из гаража
                    <span className="fa fa-trash" />
                  </a>
                </div>
                <div className="card-garage-big-link">
                  <a href="#" onClick={this.setShowEdit}>
                    Назад
                    <span className="fa fa-mail-reply" />
                  </a>
                </div>
              </div>
            </Col>
          </>
        )}
        <Col xs={12} className="order-1 mb-0">
          {showAnalytics && ordersByCategory.length !== 0 ?
            <Analytics handleCloseAnalytics={this.handleCloseAnalytics} data={ordersByCategory} />
            : showAnalytics && ordersByCategory.length === 0 ?
            <div className="analytics-info">Еще нет покупок, привязанных к этой единице техники</div> : null}

          {showOrdersHistory ? (
            <>
              <div className="purchase-history">
                <div className="purchase-history-text mr-2">
                  Выберите период:
                </div>
                <div className="purchase-history-select">
                  <span className="purchase-history-select-icon fa fa-calendar" />
                  <select
                    className="purchase-history-select-input"
                    onChange={e => this.selectTimeOfOrders(e)}
                  >
                    <option value="all" />
                    <option value="month">за последний месяц</option>
                    <option value="halfYear">за последние полгода</option>
                    <option value="year">за последний год</option>
                    <option value="all">за все время</option>
                  </select>
                </div>
              </div>
              {selectedOrders && selectedOrders.length ? (
                selectedOrders.map(order => (
                  <MachineOrderItem
                    order={order}
                    key={order.id}
                    showAllOrder={this.showAllOrder}
                    allOrder={allOrder}
                  />
                ))
              ) : (
                <div className="purchase-history">Еще нет истории покупок</div>
              )}
            </>
          ) : null}
          {showMaintenance ?
            <Maintenance
              handleSelectMaintenance={this.handleSelectMaintenance}
              selectMaintenance={selectMaintenance}
            />
           : null}
        </Col>
      </React.Fragment>
    );
  }
}
