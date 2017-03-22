/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class APIGatewayDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  service() {
    return 'APIGateway';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._awsService.deleteRestApi({restApiId: resourceId}, (error) => {
      if (error && error.code === 'BadRequestException') {
        return this._removeCustomDomainIntegration(
          resourceId,
          (error) => {
            if (error) {
              return cb(error);
            }
            
            return this._removeResource(resourceId, resourceData, cb);
          }
        );
      }
      
      cb(error);
    });
  }
  
  /**
   * @param {String} restApiId
   * @param {Function} cb
   * @private
   *
   * @todo add pagination (not critical)
   */
  _removeCustomDomainIntegration(restApiId, cb) {
    this
      ._listCustomDomains()
      .then(domains => {
        if (domains.length <= 0) {
          return Promise.reject(new Error(
            `Rest Api #${restApiId} doesn't have any custom domains assigned`
          ));
        }
        
        return Promise.all(domains.map(domain => {
          return this._domainMapping(domain.domainName, restApiId)
            .then(mappings => {
              return mappings.map(mapping => {
                mapping.domainName = domain.domainName;
                
                return mapping;
              });
            });
        }));
      })
      .then(mappingsVector => {
        return Promise.all(mappingsVector.map(mappings => {
          return Promise.all(mappings.map(mapping => {
            return this._deleteDomainMapping(mapping.basePath, mapping.domainName);
          }));
        }));
      })
      .then(() => cb(null))
      .catch((error) => cb(error));
  }
  
  /**
   * @returns {Promise|*}
   * @private
   */
  _listCustomDomains() {
    return this._awsService
      .getDomainNames({ limit: 500 })
      .promise()
      .then(data => data.items || []);
  }
  
  /**
   * @param {String} basePath
   * @param {String} domainName
   * @returns {Promise|*}
   * @private
   */
  _deleteDomainMapping(basePath, domainName) {
    return this._awsService
      .deleteBasePathMapping({ basePath, domainName })
      .promise();
  }
  
  /**
   * @param {String} domainName
   * @param {String} restApiId
   * @returns {Promise|*}
   * @private
   */
  _domainMapping(domainName, restApiId = null) {
    return this._awsService
      .getBasePathMappings({ domainName, limit: 500 })
      .promise()
      .then(data => {
        return (data.items || [])
          .filter(item => {
            return restApiId ? item.restApiId === restApiId : true;
          });
      });
  }
}
