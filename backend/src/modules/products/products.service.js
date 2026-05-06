
const supabase = require('../../config/supabase');

exports.getAll = async ({ page = 1, limit = 20, category_id, search } = {}) => {
  const pageInt = parseInt(page) || 1;
  const limitInt = parseInt(limit) || 20;
  const offset = (pageInt - 1) * limitInt;

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' })
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (category_id) query = query.eq('category_id', category_id);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query.range(offset, offset + limitInt - 1);
  if (error) throw new Error('DATABASE_ERROR');

  return {
    products: data || [],
    total: count || 0,
    page: pageInt,
    limit: limitInt
  };
};

exports.getById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .eq('is_available', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('PRODUCT_NOT_FOUND');
    throw new Error('DATABASE_ERROR');
  }
  return data;
};
