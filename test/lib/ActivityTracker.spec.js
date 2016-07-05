import { expect } from 'chai';
import moment from 'moment';
import path from 'path';
import fs from 'fs-extra';

import ActivityTracker from '../../lib/ActivityTracker';

describe('ActivityTracker', () => {
  const storePath = `${process.cwd()}/test/fixtures/rootStore`;
  const activityTracker = new ActivityTracker(storePath);

  afterEach(done => {
    fs.emptyDir(storePath, done);
  });


  describe('#addEntry()', () => {
    const addDate = moment.utc().format('YYYY-MM-DD');

    before(done => {
      activityTracker
        .addEntry('1', '1', addDate)
        .then(() => {
          done();
        });
    });

    it('creates new file with correct entry', done => {
      const fileName = `${storePath}/${addDate}.txt`;
      fs.readFile(fileName, 'utf-8', (err, data) => {
        expect(err).to.be.not.ok;
        expect(data).to.equal('1,1\n');
        done();
      });
    });
  });

  describe('#query()', () => {
    before(done => {
      Promise.all([
        activityTracker.addEntry('4', '1', '2015-10-04'),
        activityTracker.addEntry('4', '2', '2015-10-05'),
        activityTracker.addEntry('4', '2', '2015-10-05'),
        activityTracker.addEntry('4', '3', '2015-10-05'),
        activityTracker.addEntry('5', '1', '2015-10-05'),
        activityTracker.addEntry('6', '1', '2015-10-07'),
        activityTracker.addEntry('4', '6', '2015-10-08')
      ]).then(() => {
        done();
      });
    });

    it('returns correct statistics x1', () => {
      const expectedValue = {
        num_sessions: 4,
        num_users: 3,
        avg_sessions_per_user: 1.33
      };

      activityTracker.query('2015-10-05', '2015-10-06')
        .then(valueReturned => {
          expect(valueReturned).to.equal(expectedValue);
        });
    });

    it('returns correct statistics x2', () => {
      const expectedValue = {
        num_sessions: 6,
        num_users: 3,
        avg_sessions_per_user: 2
      };

      activityTracker.query('2015-01-01', '2015-12-31')
        .then(valueReturned => {
          expect(valueReturned).to.equal(expectedValue);
        });
    });
  });

});
