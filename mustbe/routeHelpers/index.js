var RSVP = require("rsvp");

var Verifier = require("../verifier");
var Principal = require("../principals");
var UserIdentity = require("../identities/userIdentity");

function paramsFromRequest(req, config, activity){
  var params;
  var parameterMap = config.parameterMaps[activity];
  if (parameterMap){
    params = parameterMap(req);
  }
  return params;
}


// Route Helpers
// -------------

function RouteHelpers(config){
  this.config = config;
}

RouteHelpers.prototype.authenticated = function(authCB, notAuthCB){
  var that = this;
  var config = this.config;

  if (!notAuthCB){
    notAuthCB = this.config.routeHelpers.notAuthenticated;
  }

  function handler(req, res, next){
    var args = Array.prototype.slice.apply(arguments);

    config.routeHelpers.getUser(req, function(err, user){
      if (err) { return next(err); }

      var userIdentity = new UserIdentity(user, config);
      var verifier = new Verifier(userIdentity, config);
      var principal = new Principal(userIdentity, verifier);
      principal.isAuthenticated(function(err, isAuth){
        if (err) { return next(err); }

        if (isAuth){
          authCB.apply(undefined, args);
        } else {
          notAuthCB.apply(undefined, args);
        }
      });

    });
  }

  return handler;
};

RouteHelpers.prototype.authorizeIdentity = function(identity, activity, authcb, notauthcb){
  var that = this;
  var config = this.config;

  if (!notauthcb){
    notauthcb = config.routeHelpers.notAuthorized;
  }

  if (!authcb){
    authcb = activity;
    activity = undefined;
  }

  return function(req, res, next){
    var handlerArgs = Array.prototype.slice.apply(arguments);
    
    var params = paramsFromRequest(req, config.routeHelpers, activity);
    var verifier = new Verifier(identity, config);
    var principal = new Principal(identity, verifier);

    principal.isAuthorized(activity, params, function(err, isAuth){
      if (isAuth) { 
        return authcb.apply(undefined, handlerArgs);
      } else {
        return notauthcb.apply(undefined, handlerArgs);
      }
    });

  };
};

RouteHelpers.prototype.authorized = function(activity, authcb, notauthcb){
  var that = this;
  var config = this.config;

  if (!notauthcb){
    notauthcb = config.routeHelpers.notAuthorized;
  }

  if (!authcb){
    authcb = activity;
    activity = undefined;
  }

  return function(req, res, next){
    var handlerArgs = Array.prototype.slice.apply(arguments);
    
    config.routeHelpers.getUser(req, function(err, user){
      if (err) { return next(err); }

      var params = paramsFromRequest(req, config.routeHelpers, activity);
      var userIdentity = new UserIdentity(user, config);
      var verifier = new Verifier(userIdentity, config);
      var principal = new Principal(userIdentity, verifier);

      principal.isAuthorized(activity, params, function(err, isAuth){
        if (isAuth) { 
          return authcb.apply(undefined, handlerArgs);
        } else {
          return notauthcb.apply(undefined, handlerArgs);
        }
      });

    });
  };
};

module.exports = RouteHelpers;
