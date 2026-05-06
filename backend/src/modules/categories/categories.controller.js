
const { success } = require('../../utils/apiResponse');
const { getAll } = require('./categories.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await getAll();
    success(res, 200, data, 'Categories fetched successfully');
  } catch (err) {
    next(err);
  }
};
