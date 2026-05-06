
const supabase = require('../../config/supabase');

exports.getAll = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error('DATABASE_ERROR');
  return data;
};
