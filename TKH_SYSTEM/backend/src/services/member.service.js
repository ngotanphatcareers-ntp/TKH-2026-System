const {
  findMembersBySeasonId,
} = require("../repositories/member.repository");

const {
  findActiveSeason,
} = require("../repositories/season.repository");

function mapMember(row) {
  return {
    seasonMembershipId: row.season_membership_id,
    membershipStatus: row.membership_status,
    joinedAt: row.joined_at,

    member: {
      id: row.member_id,
      tkhCode: row.tkh_code,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      avatarFilename: row.avatar_filename,
      status: row.member_status,
    },

    group: row.group_id
      ? {
          id: row.group_id,
          code: row.group_code,
          name: row.group_name,
        }
      : null,

    account: row.user_id
      ? {
          id: row.user_id,
          username: row.username,
          role: row.role,
          isActive: Boolean(row.is_active),
          mustChangePassword: Boolean(row.must_change_password),
        }
      : null,
  };
}

async function getCurrentSeasonMembers() {
  const season = await findActiveSeason();

  if (!season) {
    return {
      season: null,
      members: [],
    };
  }

  const rows = await findMembersBySeasonId(season.id);

  return {
    season: {
      id: season.id,
      code: season.code,
      name: season.name,
    },
    members: rows.map(mapMember),
  };
}

module.exports = {
  getCurrentSeasonMembers,
};