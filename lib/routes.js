import moment from 'moment';
import ActivityTracker from './ActivityTracker';
const activityTracker = new ActivityTracker();

/**
 * Query to get user activity statistics
 * 
 * @param {Object} req
 * @param {string} req.query.start_date
 * @param {string} req.query.end_date
 * @param {Object} res
 * @returns {*}
 */
export function statsRoute(req, res) {
  if (!req.query.start_date ||
      !req.query.end_date   ||
      !areValidDates([req.query.start_date, req.query.end_date])) {

    return res.status(400).json({
      message: 'missing/malformed parameters'
    });
  }

  activityTracker.query(
    req.query.start_date,
    req.query.end_date,
    req.query.user_id
  ).then(stats => {
    res.json(stats);
  }).catch(err => {
    res.status(503).end();
  });
}

/**
 * Add an entry to the activity database.
 *
 * @param {Object} req
 * @param {string} req.body.user_id
 * @param {string} req.body.session_id
 * @param {string|null} req.body.date
 * @param {Object} res
 */
export function activityRoute(req, res) {
  activityTracker.addEntry(
    req.body.user_id,
    req.body.session_id,
    req.body.date
  ).then(() => {
    res.status(200).end();
  }).catch(err => {
    res.status(503).end();
  });
}

/**
 * Check an array of strings to make sure each entry is a valid
 * date in the format of 'YYYY-MM-DD'
 * 
 * @param {Array} dates
 * @returns {boolean}
 */
const areValidDates = (dates) => {
  return dates.some(d => isValidDate(d));
}

/**
 * Check a string to make sure each entry is a valid
 * date in the format of 'YYYY-MM-DD'
 * 
 * @param {string} dateString
 * @returns {boolean}
 */
const isValidDate = (dateString) => {
  return moment.utc(dateString, ['YYYY-MM-DD'], true).isValid();
}
