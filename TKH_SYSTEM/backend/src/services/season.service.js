const {
  findActiveSeason,
  findSeasonById,
} = require("../repositories/season.repository");

function mapSeason(season) {
  if (!season) {
    return null;
  }

  return {
    id: season.id,
    code: season.code,
    name: season.name,
    startDate: season.start_date,
    endDate: season.end_date,
    status: season.status,
    settings: {
      rankingVisible: Boolean(season.ranking_visible),
      attendanceRadiusM: season.attendance_radius_m,
    },
  };
}

async function getCurrentSeason() {
  const season = await findActiveSeason();

  return mapSeason(season);
}

async function getSeasonById(seasonId) {
  const season = await findSeasonById(seasonId);

  return mapSeason(season);
}

module.exports = {
  getCurrentSeason,
  getSeasonById,
};