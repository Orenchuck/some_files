/* flow */

import React from 'react';

import { Col, Container, Row } from 'react-bootstrap';
import SidebarItem from './SidebarItem';
import { getUserFavorites, addToFavorites, deleteFromFavorites } from '../../actions/Profile/Favorites';
import style from './style.scss'

/* сайдбар в личный кабинет пользователя */


export default class ProfileSidebar extends React.Component {
  state = {
    products: []
  };

  async componentDidMount() {

    /* просмотренные товары */

    const productsHistory = localStorage.getItem('productsHistory');
    const products = JSON.parse(productsHistory);
    if (productsHistory || productsHistory !== null) {
      while (products.length > 4) {
        products.shift();
      }
      Object.values(products).map(item => {
        if (item.photos) {
          const photo = item.photos[0].small2;
          item.photo = photo;
        }
      });
    }

    /* избранные товары */

    const favoriveProductsJson = localStorage.getItem('favoriveProducts');
    let favoriveProducts = [];
    if (favoriveProductsJson && favoriveProductsJson.length !== 0) {
      favoriveProducts = JSON.parse(favoriveProductsJson);

      if (Array.isArray(favoriveProducts)) {
        //проверка на наличие в коде русской буквы П
        favoriveProducts.map(product => {
          if (product.code.includes('П')) {
            const newCode = product.code.split('');
            const latinCode = newCode.map(letter => {
              if (letter === 'П') {
                letter = 'p';
              }
            });
            const newCodeStr = latinCode.join('');
            product.code = newCodeStr;
          }
          if (products && products.length !== 0) {
            Object.values(products).map(item => {
              if (product.code == item.code) {
                item.isFavorite = true;
              }
            });
          }
        })
      } else {
        if (favoriveProducts.code.includes('П')) {
          const newCode = favoriveProducts.code.split('');
          const latinCode = newCode.map(letter => {
            if (letter === 'П') {
              letter = 'p';
            }
          });
          const newCodeStr = latinCode.join('');
          favoriveProducts.code = newCodeStr;
      }
        
        if (favoriveProducts.code == products.code) {
          products.isFavorite = true;
        }
          }

    } else {
      const data = await getUserFavorites();
      const productsFetch = data.response.products;
      localStorage.setItem('favoriveProducts', JSON.stringify(productsFetch));
      if (productsFetch && productsFetch.length !==0) {
        productsFetch.map(product => {
          if (products && products.length) {
            Object.values(products).map(item => {
              if (product.code == item.code) {
                item.isFavorite = true;
              }
            });
          }
        });
      } 
    }

    this.setState({
      products,
    });
  }

  didAddProductToFavorites = async product => {    
    const data = await addToFavorites(product.code);
    if (data.success) {
      product.isFavorite = true;
      const { products } = this.state;
      const index = products.indexOf(product);
      if (products[index]) {
        products[index].isFavorite = true;
        this.setState({ products });
      }
      const favoriveProductsJson = localStorage.getItem('favoriveProducts');
      const favoriveProducts = JSON.parse(favoriveProductsJson);
      favoriveProducts.push(product);
      localStorage.setItem('favoriveProducts', JSON.stringify(favoriveProducts));
      this.forceUpdate();
    }
  };

  didDeleteProductFromFavorites = async product => {
    const data = await deleteFromFavorites(product.code);

    if (data.success) {
      product.isFavorite = false;
      const { products } = this.state;
      const index = products.indexOf(product);
      if (products[index]) {
        products[index].isFavorite = false;
        this.setState({ products });
      }
      const favoriveProductsJson = localStorage.getItem('favoriveProducts');
      const favoriveProducts = JSON.parse(favoriveProductsJson);
      const productIndex = favoriveProducts.findIndex(item => item.code == product.code);
      favoriveProducts.splice(productIndex, 1);
      localStorage.setItem('favoriveProducts', JSON.stringify(favoriveProducts));
      this.forceUpdate();
    }
  };

  render() {
    const { products } = this.state;
    return (
      <div className="my-profile-previously-viewed-products">
        {products && products.length > 0 ? (
          <Container>
            <Row>

              <Col>
                <div className="previously-viewed-text">
                  <i className="fa fa-eye" />
                  просмотренные товары
                </div>
                {products.length > 0 ? products.map(item => (
                      <SidebarItem
                        item={item}
                        key={item.code}
                        didAddProductToFavorites={this.didAddProductToFavorites}
                        didDeleteProductFromFavorites={this.didDeleteProductFromFavorites}
                        />
                      )) : null}
              </Col>
            </Row>
          </Container>) : null}
      </div>
    );
  }
}
