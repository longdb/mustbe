var AsyncSpec = require("jasmine-async")(jasmine);
var MustBe = require("../../mustbe/core");
var helpers = require("../helpers");

describe("custom identity authorization overrides", function(){
  var identityType = "my-identity";
  var MyIdentity = function(config){
    this.type = identityType;
    this.config = config;
    this.isAuthenticated = function(cb){
      cb(true);
    };
  };

  describe("when an activity is explicitly denied", function(){
    var async = new AsyncSpec(this);

    var response, user;

    async.beforeEach(function(done){
      var mustBe = new MustBe();

      mustBe.configure(function(config){
        config.routeHelpers(function(rh){
          rh.notAuthorized(helpers.notAuthorized);
        });

        config.addIdentity(identityType, MyIdentity);
        
        config.activities(identityType, function(activities){
          activities.deny(function(user, activity, cb){
            cb(null, true);
          });
        });
      });

      var routeHelpers = mustBe.routeHelpers();
      var request = helpers.setupRoute("/", mustBe, function(handler){
        return routeHelpers.authorizeIdentity(identityType, "do thing", handler);
      });

      request(function(err, res){
        response = res;
        done();
      });
    });

    it("should not allow the request", function(){
      helpers.expectResponseCode(response, 403);
    });

  });

  describe("when an activity is explicitly allowed", function(){
    var async = new AsyncSpec(this);

    var response, user;

    async.beforeEach(function(done){
      var mustBe = new MustBe();

      mustBe.configure(function(config){
        config.addIdentity(identityType, MyIdentity);
        
        config.activities(identityType, function(activities){
          activities.allow(function(user, activity, cb){
            cb(null, true);
          });
        });
      });

      var routeHelpers = mustBe.routeHelpers();
      var request = helpers.setupRoute("/", mustBe, function(handler){
        return routeHelpers.authorizeIdentity(identityType, "do thing", handler);
      });

      request(function(err, res){
        response = res;
        done();
      });
    });

    it("should allow the request", function(){
      helpers.expectResponseCode(response, 200);
    });

  });

  describe("when an activity is explicitly denied and allowed", function(){
    var async = new AsyncSpec(this);

    var response, user;

    async.beforeEach(function(done){
      var mustBe = new MustBe();

      mustBe.configure(function(config){
        config.routeHelpers(function(rh){
          rh.notAuthorized(helpers.notAuthorized);
        });

        config.addIdentity(identityType, MyIdentity);
        
        config.activities(identityType, function(activities){
          activities.deny(function(user, activity, cb){
            cb(null, true);
          });

          activities.allow(function(user, activity, cb){
            cb(null, true);
          });
        });
      });

      var routeHelpers = mustBe.routeHelpers();
      var request = helpers.setupRoute("/", mustBe, function(handler){
        return routeHelpers.authorizeIdentity(identityType, "do thing", handler);
      });

      request(function(err, res){
        response = res;
        done();
      });
    });

    it("should not allow the request", function(){
      helpers.expectResponseCode(response, 403);
    });
  });

  describe("when an activity is neither explicitly denied nor explicitly allowed, but is authorized", function(){
    var async = new AsyncSpec(this);

    var response, user;

    async.beforeEach(function(done){
      var mustBe = new MustBe();

      mustBe.configure(function(config){
        config.addIdentity(identityType, MyIdentity);
        
        config.activities(identityType, function(activities){
          activities.deny(function(user, activity, cb){
            cb(null, false);
          });

          activities.allow(function(user, activity, cb){
            cb(null, false);
          });

          activities.can("do thing", function(user, params, cb){
            cb(null, true);
          });
        });
      });

      var routeHelpers = mustBe.routeHelpers();
      var request = helpers.setupRoute("/", mustBe, function(handler){
        return routeHelpers.authorizeIdentity(identityType, "do thing", handler);
      });

      request(function(err, res){
        response = res;
        done();
      });
    });

    it("should allow the request", function(){
      helpers.expectResponseCode(response, 200);
    });
  });

  describe("when an activity is neither explicitly denied nor explicitly allowed, and not authorized", function(){
    var async = new AsyncSpec(this);

    var response, user;

    async.beforeEach(function(done){
      var mustBe = new MustBe();

      mustBe.configure(function(config){
        config.routeHelpers(function(rh){
          rh.notAuthorized(helpers.notAuthorized);
        });

        config.addIdentity(identityType, MyIdentity);
        
        config.activities(identityType, function(activities){
          activities.deny(function(user, activity, cb){
            cb(null, false);
          });

          activities.allow(function(user, activity, cb){
            cb(null, false);
          });

          activities.can("do thing", function(user, params, cb){
            cb(null, false);
          });
        });
      });

      var routeHelpers = mustBe.routeHelpers();
      var request = helpers.setupRoute("/", mustBe, function(handler){
        return routeHelpers.authorizeIdentity(identityType, "do thing", handler);
      });

      request(function(err, res){
        response = res;
        done();
      });
    });

    it("should not allow the request", function(){
      helpers.expectResponseCode(response, 403);
    });
  });

});
