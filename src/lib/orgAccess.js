export function getMemberUserId(member) {
  return (member?.user?._id || member?.user)?.toString();
}

export function getOrgMemberRole(org, userId) {
  if (!org || !userId) return null;
  const uid = userId.toString();
  const ownerId = (org.owner_id?._id || org.owner_id)?.toString();
  if (ownerId === uid) return "owner";
  const member = org.members?.find(
    (m) => getMemberUserId(m) === uid && m.status === "active"
  );
  return member?.role || null;
}

export function hasTeamOrgAccess(organizations, userId) {
  if (!organizations?.length || !userId) return false;
  return organizations.some((org) => {
    const role = getOrgMemberRole(org, userId);
    return role && role !== "client";
  });
}

export function getOrgNavPath(org, userId) {
  return `/user/profile/org/${org._id}?view=projects`;
}
