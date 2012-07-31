// Generated by CoffeeScript 1.3.1
var Consumer, Dataset, EventEmitter, Query, addExpr, base64Lookup, expr, extend, handleLiteral, handleOrder, httpClient, isArray, isNumber, isString, rawToBase64, toBase64,
  __slice = [].slice;

EventEmitter = require('eventemitter2').EventEmitter2;

httpClient = require('superagent');

isString = function(obj) {
  return toString.call(obj) === '[object String]';
};

isArray = function(obj) {
  return toString.call(obj) === '[object Array]';
};

isNumber = function(obj) {
  return toString.call(obj) === '[object Number]';
};

extend = function() {
  var k, source, sources, target, v, _i, _len;
  target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (_i = 0, _len = sources.length; _i < _len; _i++) {
    source = sources[_i];
    for (k in source) {
      v = source[k];
      target[k] = v;
    }
  }
  return null;
};

toBase64 = typeof Buffer !== "undefined" && Buffer !== null ? function(str) {
  return new Buffer(str).toString('base64');
} : (base64Lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split(''), rawToBase64 = typeof btoa !== "undefined" && btoa !== null ? btoa : function(str) {
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4, i, result;
  result = [];
  i = 0;
  while (i < str.length) {
    chr1 = str.charCodeAt(i++);
    chr2 = str.charCodeAt(i++);
    chr3 = str.charCodeAt(i++);
    if (Math.max(chr1, chr2, chr3) > 0xFF) {
      throw new Error('Invalid character!');
    }
    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;
    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }
    result.push(base64Lookup[enc1]);
    result.push(base64Lookup[enc2]);
    result.push(base64Lookup[enc3]);
    result.push(base64Lookup[enc4]);
  }
  return result.join('');
}, function(str) {
  return rawToBase64(unescape(encodeURIComponent(str)));
});

handleLiteral = function(literal) {
  if (isString(literal)) {
    return "'" + literal + "'";
  } else if (isNumber(literal)) {
    return literal;
  } else {
    return literal;
  }
};

handleOrder = function(order) {
  if (/( asc$| desc$)/i.test(order)) {
    return order;
  } else {
    return order + ' asc';
  }
};

addExpr = function(target, args) {
  var arg, k, v, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    arg = args[_i];
    if (isString(arg)) {
      _results.push(target.push(arg));
    } else {
      _results.push((function() {
        var _results1;
        _results1 = [];
        for (k in arg) {
          v = arg[k];
          _results1.push(target.push("" + k + " = " + (handleLiteral(v))));
        }
        return _results1;
      })());
    }
  }
  return _results;
};

expr = {
  and: function() {
    var clause, clauses;
    clauses = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = clauses.length; _i < _len; _i++) {
        clause = clauses[_i];
        _results.push("(" + clause + ")");
      }
      return _results;
    })()).join(' and ');
  },
  or: function() {
    var clause, clauses;
    clauses = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = clauses.length; _i < _len; _i++) {
        clause = clauses[_i];
        _results.push("(" + clause + ")");
      }
      return _results;
    })()).join(' or ');
  },
  gt: function(column, literal) {
    return "" + column + " > " + (handleLiteral(literal));
  },
  gte: function(column, literal) {
    return "" + column + " >= " + (handleLiteral(literal));
  },
  lt: function(column, literal) {
    return "" + column + " < " + (handleLiteral(literal));
  },
  lte: function(column, literal) {
    return "" + column + " <= " + (handleLiteral(literal));
  },
  eq: function(column, literal) {
    return "" + column + " = " + (handleLiteral(literal));
  }
};

Consumer = (function() {

  Consumer.name = 'Consumer';

  function Consumer(dataSite, sodaOpts) {
    var _ref;
    this.dataSite = dataSite;
    this.sodaOpts = sodaOpts != null ? sodaOpts : {};
    if (!/^([a-z0-9-_]+\.)+([a-z0-9-_]+)$/i.test(this.dataSite)) {
      throw new Error('dataSite does not appear to be valid! Please supply a domain name, eg data.seattle.gov');
    }
    this.emitterOpts = (_ref = this.sodaOpts.emitterOpts) != null ? _ref : {
      wildcard: true,
      delimiter: '.',
      maxListeners: 15
    };
    this.networker = function(opts) {
      var client, url;
      url = "https://" + this.dataSite + opts.path;
      client = httpClient(opts.method, url);
      if (this.sodaOpts.apiToken != null) {
        client.set('X-App-Token', this.sodaOpts.apiToken);
      }
      if ((this.sodaOpts.username != null) && (this.sodaOpts.password != null)) {
        client.set('Authorization', toBase64("" + this.sodaOpts.username + ":" + this.sodaOpts.password));
      }
      if (opts.query != null) {
        client.query(opts.query);
      }
      return function(responseHandler) {
        return client.end(responseHandler);
      };
    };
  }

  Consumer.prototype.query = function() {
    return new Query(this);
  };

  Consumer.prototype.getDataset = function(id) {
    var emitter;
    return emitter = new EventEmitter(this.emitterOpts);
  };

  return Consumer;

})();

Query = (function() {

  Query.name = 'Query';

  function Query(consumer) {
    this.consumer = consumer;
    this._select = [];
    this._where = [];
    this._group = [];
    this._having = [];
    this._order = [];
    this._offset = this._limit = null;
  }

  Query.prototype.withDataset = function(datasetId) {
    this._datasetId = datasetId;
    return this;
  };

  Query.prototype.soql = function(query) {
    this._soql = query;
    return this;
  };

  Query.prototype.where = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    addExpr(this._where, args);
    return this;
  };

  Query.prototype.having = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    addExpr(this._having, args);
    return this;
  };

  Query.prototype.order = function() {
    var order, orders, _i, _len;
    orders = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    for (_i = 0, _len = orders.length; _i < _len; _i++) {
      order = orders[_i];
      this._order.push(order);
    }
    return this;
  };

  Query.prototype.offset = function(offset) {
    this._offset = offset;
    return this;
  };

  Query.prototype.limit = function(limit) {
    this._limit = limit;
    return this;
  };

  Query.prototype.getRows = function() {
    var emitter, handler, k, opts, queryComponents, v;
    opts = {
      method: 'get'
    };
    if (this._datasetId == null) {
      throw new Error('no dataset given to work against!');
    }
    opts.path = "/resource/" + this._datasetId + ".json";
    queryComponents = this._buildQueryComponents();
    opts.query = {};
    for (k in queryComponents) {
      v = queryComponents[k];
      opts.query['$' + k] = v;
    }
    emitter = new EventEmitter(this.consumer.emitterOpts);
    handler = function(response) {
      var _ref;
      if (response.ok) {
        if (response.accepted) {
          emitter.emit('progress', response.body);
          this.consumer.networker(opts)(handler);
        } else {
          emitter.emit('success', response.body);
        }
      } else {
        emitter.emit('error', (_ref = response.body) != null ? _ref : response.text);
      }
      return emitter.emit('complete', response);
    };
    this.consumer.networker(opts)(handler);
    return emitter;
  };

  Query.prototype._buildQueryComponents = function() {
    var query;
    query = {};
    if (this._soql != null) {
      query.query = this._soql;
    } else {
      if (this._select.length > 0) {
        query.select = this._select.join(', ');
      }
      if (this._where.length > 0) {
        query.where = expr.and(this._where);
      }
      if (this._group.length > 0) {
        query.group = this._group.join(', ');
      }
      if (this._having.length > 0) {
        if (!(this._group.length > 0)) {
          throw new Error('Having provided without group by!');
        }
        query.having = expr.and(this._having);
      }
      if (this._order.length > 0) {
        query.order = this._order.join(', ');
      }
      if (isNumber(this._offset)) {
        query.offset = this._offset;
      }
      if (isNumber(this._limit)) {
        query.limit = this._limit;
      }
    }
    return query;
  };

  return Query;

})();

Dataset = (function() {

  Dataset.name = 'Dataset';

  function Dataset(data, client) {
    this.data = data;
    this.client = client;
  }

  return Dataset;

})();

extend(typeof exports !== "undefined" && exports !== null ? exports : this.soda, {
  Consumer: Consumer,
  expr: expr,
  _internal: {
    Query: Query,
    util: {
      toBase64: toBase64,
      handleLiteral: handleLiteral,
      handleOrder: handleOrder
    }
  }
});