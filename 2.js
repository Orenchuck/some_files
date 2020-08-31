import React, { useContext, useState } from 'react';
import { Container, Row, Col, Tabs, Tab, Button, Alert } from 'react-bootstrap';
import faStyles from 'font-awesome/css/font-awesome.min.css';
import axios from 'axios';
import BlockUi from 'react-block-ui';
import 'react-block-ui/style.css';

import { BasketContext } from '../../contexts/basketContext';
import styles from './style.scss';
import { getHeader } from '../../actions/header';
import ProductsSection from '../../components/Checkout/ProductsSection';
import DeliverySection from '../../components/Checkout/DeliverySection';
import { isAuth, getUserInfo } from '../../components/modules/Auth';
import { CHECKOUT } from '../../constants/API';
import { DEV_SERVER, SERVER_PORT } from '../../constants/API/config';

const CHECKOUT_URL = `${DEV_SERVER}:${SERVER_PORT}${CHECKOUT}`;

/* страница оформления заказа, после успешного создания заказа переправит на страницу Мои заказы в профиле*/

const Checkout = ({ ...props }) => {
  const { products, totalCount, totalPrice, dispatch } = useContext(
    BasketContext
  );

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [creatingOrderMessage, setCreatingOrderMessage] = useState({
    type: 'success',
    text: null,
    isShow: false
  });

  const [deliveryData, setDeliveryData] = useState({
    city: null,
    address: null,
    delivery: null,
    deliveryType: null,
    comment: '',
    sender: null,
    receiver: null,
    receiverMobilePhone: null,
    payer: null
  });
  const [inputErrors, setInputErrors] = useState({
    city: false,
    address: false,
    delivery: false
  });

  /* проверяет наличие всех нужных данных для создания заказа */

  const validate = () => {
    let isValid = true;
    if (!deliveryData.city) {
      isValid = false;
      setInputErrors({
        city: true
      });
    }
    if (!deliveryData.address) {
      isValid = false;
      setInputErrors({
        address: true
      });
    }
    if (!deliveryData.delivery) {
      isValid = false;
      setInputErrors({
        delivery: true
      });
    }
    return isValid;
  };

  /* создает заказ в бд */

  const checkout = () => {
    if (!validate()) return false;

    setIsCreatingOrder(true);

    const headers = getHeader();
    const checkoutData = {
      products: products.map(product => ({
        id: product.id,
        code: product.code,
        amount: product.amount
      })),
      delivery: deliveryData
    };

    axios
      .post(`${CHECKOUT_URL}`, checkoutData, {
        headers
      })
      .then(res => {
        const { orders } = res.data.response;
        setIsCreatingOrder(false);
        let message = '';
        let isCompletelySuccess = true;
        orders.forEach(order => {
          if (order.error) {
            message += order.error;
            isCompletelySuccess = false;
          } else {
            order.products.forEach(product => {
              dispatch({
                type: 'REMOVE_PRODUCT',
                product: products.find(
                  contextProduct =>
                    contextProduct.id.toString() === product.id.toString()
                )
              });
            });
          }
        });

        if (!message && isCompletelySuccess)
          message = `Заказ${orders.length > 1 ? 'ы' : ''} успешно создан${
            orders.length > 1 ? 'ы' : ''
          }! Перенаправляем на страницу заказов. Привяжите ваши покупки к единице техники.`;

        setCreatingOrderMessage({
          type: isCompletelySuccess ? 'success' : 'fail',
          text: message,
          isShow: true
        });
        setInterval(() => {
          setCreatingOrderMessage({
            ...creatingOrderMessage,
            isShow: false
          });
          if (isCompletelySuccess) window.location = `/profile/orders`;
        }, 5000);
      })
      .catch(err => {
        setIsCreatingOrder(false);
        setCreatingOrderMessage({
          type: 'fail',
          text: err.message,
          isShow: true
        });
      });
  };

  /* проверка авторизован ли пользователь */
  if (!isAuth()) {
    return (
      <Container>
        <h1>Необхдима авторизация для оформления заказа</h1>
      </Container>
    );
  }
  return (
    <BlockUi blocking={isCreatingOrder}>
      <Container>
        <div className="checkout-title">Оформление заказа</div>
        {creatingOrderMessage.isShow ? (
          <Alert
            variant={
              creatingOrderMessage.type === 'success' ? 'success' : 'danger'
            }
          >
            <Alert.Heading>
              {creatingOrderMessage.type === 'success'
                ? 'Спасибо за заказ!'
                : 'Возникла ошибка'}
            </Alert.Heading>
            {creatingOrderMessage.text}
          </Alert>
        ) : null}
        <Row>
          <Col lg={7}>
            <DeliverySection
              setDeliveryData={setDeliveryData}
              inputErrors={inputErrors}
            />
          </Col>
          <Col lg={5}>
            <ProductsSection />
            {products.length ? (
              <div className="checkout-buttons">
                <Button disabled={!products.length} onClick={checkout}>
                  Подтвердить заказ
                </Button>
              </div>
            ) : null}
          </Col>
        </Row>
        {creatingOrderMessage.isShow ? (
          <Alert
            variant={
              creatingOrderMessage.type === 'success' ? 'success' : 'danger'
            }
          >
            <Alert.Heading>
              {creatingOrderMessage.type === 'success'
                ? 'Спасибо за заказ!'
                : 'Возникла ошибка'}
            </Alert.Heading>
            {creatingOrderMessage.text}
          </Alert>
        ) : null}
      </Container>
    </BlockUi>
  );
};

export default Checkout;
