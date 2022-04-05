/* @flow */

import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import {
  CATALOG_FAILURE,
  CATALOG_REQUESTING
} from '../../constants/ActionTypes';
import ProductsView from '../../components/CatalogView/Products';
import type { Catalog as CatalogType, Dispatch, ReduxState } from '../../types';
import { catalogAction } from '../../actions';

type Props = {
  catalog: CatalogType,
  match: Object,
  changeCatalogViewMode: () => void,
  categories: Object,
  setPageSize: () => void,
  fetchProductsIfNeeded: () => void,
  toFirstPage: () => void,
};

/* продукты в выдаче каталога, по умолчанию списком, 10 товаров на странице */

export class Products extends PureComponent<Props> {
  state = {
    pageSize: 10,
    sortBy: 'price',
    order: 'asc',
  };

  componentDidMount() {
    const { changeCatalogViewMode } = this.props;
    changeCatalogViewMode('list-view');
  }

  /* изменить на плиточное отображение или список */

  viewModeHandler = e => {
    const { changeCatalogViewMode } = this.props;
    switch (e.currentTarget.classList[0]) {
      case 'catalog-list-view':
        changeCatalogViewMode('list-view');
        break;
      case 'catalog-column-view':
        changeCatalogViewMode('column-view');
        break;
      default:
        changeCatalogViewMode('column-view');
    }
  };

  /* количество отображаемых товаров на странице */

  pageSizeHandler = page => {
    const {
      setPageSize,
      match: {
        params: { categoryUrl, subcategoryUrl, thirdLevelCategory }
      },
      catalog
    } = this.props;
    const { filters } = catalog[
      `${categoryUrl}/${subcategoryUrl}/${thirdLevelCategory}`
    ];
    const { sortBy, order } = this.state;
    this.setState({
      pageSize: page
    });
    const productsUrlPath = `${categoryUrl}/${subcategoryUrl}/${thirdLevelCategory}`;
    setPageSize(productsUrlPath, filters, page, sortBy, order);
  };

  getCategoryName = () => {
    const {
      categories,
      match: { params }
    } = this.props;
    const currentCategoryUrl = params.subcategoryUrl;
    let categoryName = 'Без названия';
    if (categories.readyStatus === 'CATEGORIES_SUCCESS') {
      Object.values(categories.list.response).map(item =>
        Object.values(item.subcategories).map(subItem => {
          if (subItem.url.toString() === currentCategoryUrl) {
            categoryName = subItem.title;
          }
        })
      );
    }
    return categoryName;
  };

  /* сортировать порядок выдачи товаров по цене или названию, в прямом asc или обратном desc порядке, 
    значение выбирается из выпадающего списка. */

  handleProductsSort = e => {
    const {
      fetchProductsIfNeeded,
      match: {
        params: { categoryUrl, subcategoryUrl, thirdLevelCategory }
      },
      catalog,
      toFirstPage,
    } = this.props;
    
    const productsUrlPath = `${categoryUrl}/${subcategoryUrl}/${thirdLevelCategory}`;

    if (e.target.value.includes('desc')) {
      catalog.order = 'desc';
      this.setState({
        order: 'desc'
      });
    } else {
      catalog.order = 'asc';
      this.setState({
        order: 'asc'
      });
    }

    if (e.target.value.includes('price')) {
      catalog.sortBy = 'price';
      this.setState({
        sortBy: 'price'
      });
    } else {
      catalog.sortBy = 'name';
      this.setState({
        sortBy: 'name'
      });
    }

    fetchProductsIfNeeded(
      productsUrlPath,
      catalog.pageSize,
      catalog.sortBy,
      catalog.order,
    );
    toFirstPage();
  };

  renderCatalogByCategoryId = () => {
    const {
      catalog,
      match: {
        params: { categoryUrl, subcategoryUrl, thirdLevelCategory }
      }
    } = this.props;
    
    const productsUrlPath = `${categoryUrl}/${subcategoryUrl}/${thirdLevelCategory}`;
    const productsByCategoryId = catalog[productsUrlPath];
    if (
      !productsByCategoryId ||
      productsByCategoryId.readyStatus === CATALOG_REQUESTING
    )
      return <p>Loading...</p>;

    if (productsByCategoryId.readyStatus === CATALOG_FAILURE)
      return <div className="empty-catalog">Товаров не найдено</div>;

    return productsByCategoryId.data.response.total_count === null ? (
      <div className="empty-catalog">Товаров не найдено</div>
    ) : (
      <ProductsView
        viewModeHandler={this.viewModeHandler}
        viewMode={catalog.viewMode}
        pageSizeHandler={this.pageSizeHandler}
        pageSize={catalog.pageSize}
        products={productsByCategoryId.data.response}
        title={this.getCategoryName()}
        pathUrl={productsUrlPath}
        handleProductsSort={this.handleProductsSort}
      />
    );
  };

  render() {
    return <React.Fragment>{this.renderCatalogByCategoryId()}</React.Fragment>;
  }
}

const mapStateToProps = ({ catalog, categories }: ReduxState) => ({
  catalog,
  categories,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  changeCatalogViewMode: (viewMode: string) =>
    dispatch(catalogAction.changeCatalogViewMode(viewMode)),
  setPageSize: (
    url: string,
    filters: Array,
    pageSize: number,
    sortBy: string,
    order: string,
  ) =>
    dispatch(catalogAction.setPageSize(url, filters, pageSize, sortBy, order)),
  fetchProductsIfNeeded: (
    categoryId: string,
    pageSize: number,
    sortBy: string,
    order: string,
  ) =>
    dispatch(
      catalogAction.fetchProductsIfNeeded(categoryId, pageSize, sortBy, order)
    )
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Products);
