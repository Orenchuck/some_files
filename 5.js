import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import styles from './style.scss';
import OrderModal from './OrderModal';
import AddToBasketButton from '../AddToBasketButton';
import { BasketContext } from '../../contexts/basketContext';

type Props = {
    order: Object,
    allOrder: Object,
};

/* подтягивает все заказы, привязанные к единице техники, можно добавить в корзину товар или посмотреть, 
  что еще было куплено с этом товаром (OrderModal) */

export default ({ order, showAllOrder, allOrder }: Props) => {
  const [showOrder, setShowOrder] = useState(false);
  const { products, dispatch } = useContext(BasketContext);
  const hasProductInBasket = products.find(product => order.id === product.id);
  order.price = order.summ;

  return (
    <div key={`${order.orderId}-basket-${order.code}`} className={styles['single-product']}>
      <div className={styles['product-box']}>
        <div className={styles['featured-image']}>
          <Link
            className="product-title"
            to={`/catalog/${order.urlPath.join('/')}/${order.url}`}
          >
            <img width="100" src={order.photo} alt={order.name} />
          </Link>
        </div>
        <div className={styles['product-description']}>
          <div className={styles['product-descriptiontext']}>
            <Link
              className={styles['product-title']}
              to={`/catalog/${order.urlPath.join('/')}/${order.url}`}
            >
              {_.truncate(order.name, { length: 128 })}
            </Link>
          </div>
          <div className={styles['product-attributes']}>
            <div className={styles['product-codebox']}>
              <div className={styles.code}>
                <div className={styles['product-codetext']}>Код:</div>
                <div className={styles['product-code']}>{order.code}</div>
              </div>
            </div>
            <div className={styles['product-articulbox']}>
              <div className={styles.articul}>
                <div className={styles['product-articultext']}>Артикул:</div>
                <div className={styles['product-articul']}>{order.articul}</div>
              </div>
            </div>
          </div>
          <div className="product-order-number">
            Заказ <b>№{order.orderCode}</b> от {order.date.slice(0, 10)}
          </div>
        </div>
        <div className={styles['product-rightbox']}>
          <div className="product-link">
            <OrderModal
              order={order}
              setShowOrder={setShowOrder}
              showOrder={showOrder}
              showAllOrder={showAllOrder}
              allOrder={allOrder}
            />
          </div>
          <div className="product-link">
            <Link to={`/catalog/${order.urlPath.join('/')}/${order.url}`}>
              на страницу товара
              <span className="fa fa-mail-forward" />
            </Link>
          </div>
          <div className="product-link product-link-dark">
            <AddToBasketButton
              productInfo={order}
              dispatch={dispatch}
              hasProductInBasket={hasProductInBasket}
              amount={1}
              buttonSize="text"
            />
          </div>
        </div>
      </div>
    </div>
  );
  }
