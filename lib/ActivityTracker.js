import moment from 'moment';
import readline from 'readline';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';

const FLAGS = { flags: 'a' };

/**
 * Class responsible for tracking and querying User activity
 */
export default class ActivityTracker {
  /**
   * Create an ActivityTracker
   * 
   * @param {string} rootDir - the directory to store the flat data files
   */
  constructor(rootDir = './store') {
    this.rootDir = rootDir;
    this.stream = null;
  }

  /**
   * Append an entry to the corresponding data file.
   * NOTE: Called when a user opens the App on their phone.
   * 
   * @param {string} userId
   * @param {string} sessionId
   * @param {string} date
   * @returns {Promise}
   */
  addEntry(userId, sessionId, date = moment.utc().format('YYYY-MM-DD')) {
    const fileName = `${this.rootDir}/${date}.txt`;
    const entryText = `${userId},${sessionId}\n`;

    return this._writeToFile(fileName, entryText);
  }

  /**
   * Get statistics regarding user Activity
   * 
   * @param {string} startString
   * @param {string} endString
   * @param {string} userId
   * @returns {Promise}
   */
  query(startString, endString, userId) {
    return this._getEntriesBetween(
      startString,
      endString
    ).then(data => {
      if (userId) {
        data = _.pick(data, [userId])
      }

      let numSessions = 0;
      _.forIn(data, val => {
        numSessions += val.length;
      });

      return {
        unique_users: Object.keys(data).length,
        num_sessions: numSessions,
        avg_sessions_per_user: numSessions / Object.keys(data).length
      };
    });
  }

  /**
   * Write an entry to the current underlying file. If the day has changed or
   * there is no underlying file, a new read stream is created to write against.
   * 
   * @param fileName
   * @param entry
   * @returns {Promise.<T>}
   * @private
   */
  _writeToFile(fileName, entry) {
    if (!this.stream) {
      this.stream = fs.createWriteStream(fileName, FLAGS);
    }

    if (path.resolve(fileName) !== path.resolve(this.stream.path)) {
      this.stream.end();
      this.stream = fs.createWriteStream(fileName, FLAGS);
    }

    return Promise.resolve(this.stream.write(entry));
  }

  /**
   * Read in all data files falling between date range, and return
   * said data as an {Object} formatted to expectations
   *
   * @param {string} startDateString
   * @param {string} endDateString
   * @returns {Promise}
   * @private
   */
  _getEntriesBetween(startDateString, endDateString) {
    let current = moment.utc(startDateString);
    let end = moment.utc(endDateString);
    let filesToRead = [];

    while (end.diff(current, 'days') >= 0) {
      let currentFileName = current.format('YYYY-MM-DD') + '.txt';
      filesToRead.push(
        this._readAndParseFile(path.join(this.rootDir, currentFileName))
      );

      current.add(1, 'days');
    }

    return Promise.all(
      filesToRead
    ).then(entries => {
      return entries.reduce((memo, current) => {
        Object.keys(current).forEach(key => {
          // Filter out any duplicates that may have been caused by the
          // client incorrectly sending the same session twice
          memo[key] = _.uniq((memo[key] || []).concat(current[key]));
        });
        return memo;
      }, {});
    });
  }

  /**
   * Read in a data file and parse it into an object that includes
   * a {string} key representing each user and the {Array} value
   * representing all session_id values recorded during that day
   * 
   * @param {string} file - full path to filename
   * @returns {Promise}
   * @private
   */
  _readAndParseFile(file) {
    let day = {};
    let readStream = fs.createReadStream(file);
    const reader = readline.createInterface({ input: readStream });

    reader.on('line', (line) => {
      const [user, session] = line.trim().split(',');
      day[user] = (day[user] || []).concat(session);
    });

    return new Promise((resolve, reject) => {
      reader.on('close', () => {
        resolve(day);
      });

      readStream.on('error', (err) => {
        if (err.code === 'ENOENT') {
          // Skip missing files (potentially no entries that day)
          resolve({});
        } else {
          reject(err);
        }
      });
    });
  }
}
