export const categoryLabel = (value, categories = []) => {
  const found = categories.find(
    (c) => c.name === value || c._id === value
  );
  if (found) return found.name;
  return value?.replace(/_/g, " ") || "—";
};

export const categoriesForType = (categories, type) =>
  (categories || []).filter((c) => c.type === type);
