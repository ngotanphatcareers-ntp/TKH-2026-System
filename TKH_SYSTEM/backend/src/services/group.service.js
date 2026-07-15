const {
  findGroupsBySeasonId,
} = require("../repositories/group.repository");

const {
  findActiveSeason,
} = require("../repositories/season.repository");

function mapGroup(group) {
  return {
    id: group.id,
    seasonId: group.season_id,
    code: group.code,
    name: group.name,
    logoPath: group.logo_path,
    displayOrder: group.display_order,
    isActive: Boolean(group.is_active),
  };
}

async function getCurrentSeasonGroups() {
  const season = await findActiveSeason();

  if (!season) {
    return {
      season: null,
      groups: [],
    };
  }

  const groups = await findGroupsBySeasonId(season.id);

  return {
    season: {
      id: season.id,
      code: season.code,
      name: season.name,
    },
    groups: groups.map(mapGroup),
  };
}

module.exports = {
  getCurrentSeasonGroups,
};