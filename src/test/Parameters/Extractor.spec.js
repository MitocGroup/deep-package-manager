'use strict';

import chai from 'chai';
import {Extractor} from '../../lib/Parameters/Extractor';
import {Schema} from '../../lib/Parameters/Schema';

suite('Parameters/Extractor', () => {
  let extractor = new Extractor();
  let simpleSchema = { schemaKey: 'schemaValue' };
  let actualResult = null;

  test('Class Extractor exists in Parameters/Extractor', () => {
    chai.expect(Extractor).to.be.an('function');
  });

  test('Check constructor sets valid default value for _schema=null', () => {
    chai.expect(extractor.rawSchema).to.be.equal(null);
  });

  test('Check PARAMETERS_FILE static getter returns \'.parameters.json\'', () => {
    chai.expect(Extractor.PARAMETERS_FILE).to.be.equal('.parameters.json');
  });

  test('Class schema method creates new Schema object base on input parameter', () => {
    actualResult = extractor.schema(simpleSchema);
    chai.expect(actualResult).to.be.an.instanceOf(Schema);
  });
});
