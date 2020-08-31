/* flow */

import React, { PureComponent } from 'react';

import { Col, Row } from 'react-bootstrap';
import axios from 'axios';
import HorizontalSlider from '../../modules/HorizontalCarousel';
import { DEV_SERVER, SERVER_PORT } from '../../../constants/API/config';

type Props = {
  urlCategory: string
};

export class SimilarProducts extends PureComponent<Props> {
  constructor(props) {
    super(props);

    this.state = {
      products: {}
    };
  }

  componentDidMount() {
    const productUrl = this.props.urlCategory;
    const newUrl = productUrl.split('/');
    newUrl.pop();
    const categoryUrl = newUrl.join('/');
    axios.get(`${DEV_SERVER}:${SERVER_PORT}${categoryUrl}`).then(res => {
      const result = res.data.response;
      if (result && Object.keys(result).length !== 0) {
        Object.values(result.products).map(item => {
          if (item.photo.small1 !== undefined) {
            const photo = item.photo.small1;
            item.photo = photo;
          }
        });
        this.setState({ products: result.products });
      } else {
        this.setState({ products: false });
      }
    });
  }

  render() {
    const { products } = this.state;
    return (
      <div className="similar-products mt-4">
        <Row>
          {products ? (
            <Col xs={12}>
              <div className="similar-product-text">
                <i className="fa fa-th-large">
                </i>
                Похожие товары
              </div>
              <HorizontalSlider
                items={products}
                classesName="new-arrivals"
                slidesToShow={5}
                titleShortness={32}
                responsive={true}
              />
            </Col>
          ) : null}
        </Row>
      </div>
    );
  }
}

export default SimilarProducts;
