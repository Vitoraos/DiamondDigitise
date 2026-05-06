
const { success, error } = require('../../utils/apiResponse');
const { getAll, getById } = require('./products.service');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, category_id, search } = req.query;
    const result = await getAll({ page, limit, category_id, search });
    success(res, 200, result, 'Products fetched successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error(res, 400, 'INVALID_ID_FORMAT', 'Product ID must be a valid UUID', 'id');
    }

    const product = await getById(id);
    success(res, 200, product, 'Product retrieved successfully');
  } catch (err) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return error(res, 404, 'PRODUCT_NOT_FOUND', 'The requested product does not exist', 'id');
    }
    if (err.message === 'DATABASE_ERROR') {
      return error(res, 503, 'DATABASE_ERROR', 'Database query failed');
    }
    next(err);
  }
};
