import api from "../ApiInception";

export const convertDate = (dateStr) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, options);
}
export const fetchUser = async () => {
  try {
    const response = await api.get('/api/v1/users/profile')
    return response.data
  } catch (error) {
    console.error(error)
    return null
  }
}
