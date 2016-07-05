import { expect } from 'chai';
import moment from 'moment';
import sinon from 'sinon';
import path from 'path';
import fs from 'fs-extra';

import ActivityTracker from '../../lib/ActivityTracker';
import { statsRoute, activityRoute } from '../../lib/routes';

const TIME_FORMAT = 'YYYY-MM-DD';

describe('Routes', () => {

  describe('#statsRoute(req, res)', () => {
    let mockRes, statusSpy, jsonSpy, endSpy;

    beforeEach(() => {
      mockRes = {
        status(statusNumber) {
          return this;
        },

        json(jsonResponse) {
          return jsonResponse;
        },

        end() { }
      };

      statusSpy = sinon.spy(mockRes, 'status');
      jsonSpy = sinon.spy(mockRes, 'json');
      endSpy = sinon.spy(mockRes, 'end');
    });

    it('rejects when no end date is given', done => {
      const expectedReturn = { message: 'missing/malformed parameters' };
      const req = {
        query: {
          end_date: moment.utc().format(TIME_FORMAT)
        }
      };

      statsRoute(req, mockRes);

      expect(statusSpy.calledWith(400)).to.be.true;
      expect(jsonSpy.calledWith(expectedReturn)).to.be.true;
      done();
    });

    it('rejects when no start date is given', done => {
      const expectedReturn = { message: 'missing/malformed parameters' };
      const req = {
        query: {
          start_date: moment.utc().format(TIME_FORMAT)
        }
      };

      statsRoute(req, mockRes);

      expect(statusSpy.calledWith(400)).to.be.true;
      expect(jsonSpy.calledWith(expectedReturn)).to.be.true;
      done();
    });

    it('rejects when invalid date format is given for start', done => {
      const expectedReturn = { message: 'missing/malformed parameters' };
      const req = {
        query: {
          start_date: moment(),
          end_date: moment.utc().format('MM-DD-YY')
        }
      };

      statsRoute(req, mockRes);

      expect(statusSpy.calledWith(400)).to.be.true;
      expect(jsonSpy.calledWith(expectedReturn)).to.be.true;
      done();
    });

    it('rejects when invalid date format is given for end', done => {
      const expectedReturn = { message: 'missing/malformed parameters' };
      const req = {
        query: {
          start_date: moment.utc().format(TIME_FORMAT),
          end_date: moment.utc().format('MM-DD-YY')
        }
      };
      
      statsRoute(req, mockRes);

      expect(statusSpy.calledWith(400)).to.be.true;
      expect(jsonSpy.calledWith(expectedReturn)).to.be.true;
      done();
    });

  });
});
