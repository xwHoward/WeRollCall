var Promise = require('es6-promise.min.js')

function wxPromisify(fn) {  
  return function (obj = {}) {    
    return new Promise((resolve, reject) => {      
      obj.success = function (res) {        
        resolve(res)      
      }      

      obj.fail = function (res) {        
        reject(res)      
      }      

      fn(obj)    
    })  
  }
}

module.exports = {  
  wxPromisify: wxPromisify
}