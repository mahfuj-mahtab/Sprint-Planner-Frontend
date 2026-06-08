/** Flatten module → subModule → features for select optgroups. */
export function flattenFeatureGroups(modules) {
  const groups = [];
  for (const mod of modules || []) {
    const subs = mod.subModules || [];

    if (subs.length) {
      for (const sub of subs) {
        const features = sub.features || [];
        if (!features.length) continue;
        groups.push({
          key: `${mod._id}-${sub._id}`,
          label: `${mod.name} › ${sub.name}`,
          features,
        });
      }
      if (mod.features?.length) {
        groups.push({
          key: `${mod._id}-direct`,
          label: `${mod.name} › (on module)`,
          features: mod.features,
        });
      }
    } else if (mod.features?.length) {
      groups.push({
        key: mod._id,
        label: mod.name,
        features: mod.features,
      });
    }
  }
  return groups;
}

export function countAllFeatures(modules) {
  let total = 0;
  let completed = 0;
  for (const mod of modules || []) {
    total += mod.totalFeatures || 0;
    completed += mod.completedFeatures || 0;
  }
  return { total, completed };
}

export const FEATURE_IMPORT_EXAMPLE = [
  {
    name: "User Management",
    subModules: [
      {
        name: "Authentication",
        features: [
          { name: "Email login", description: "Sign in with email and password" },
          { name: "Password reset" },
        ],
      },
    ],
  },
];
