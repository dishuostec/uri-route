"use strict";
var route = require('../index');

describe('uri-route', function(){
  it('should has these interface', function(){
    var func = {callback : function(groups, string) {}};
    expect( typeof route ).toBe( 'function' );

    var route_test = route('pattern', func.callback);
    expect( typeof route_test.uri ).toBe( 'function' );
    expect( typeof route_test.set_default ).toBe( 'function' );
  });
});

describe('uri-route', function(){
  var func;
  var auto_test = function(test) {
    var route_test = route(test.pattern, test.group, func.callback);
    if (test.default_value) {
      route_test.set_default(test.default_value);
    }
    
    for (var string in test.success) {
      expect( route_test.uri(string) ).toBeTruthy();
    
      expect( func.callback.mostRecentCall.args )
        .toEqual( [test.success[string], string] );
    };

    test.fail.forEach(function(test) {
      expect( route_test.uri(test) ).toBeFalsy();
    });
  };

  beforeEach(function(){
    func = {callback : function(groups, string) {}};
    spyOn(func, 'callback').andCallThrough();
  });

  it('can get named route groups', function(){
    var route_test = route('/<group1>/<group2>', func.callback);
    var test_string = '/foo/bar';

    // "factory" method must return a function
    expect( typeof route_test.uri ).toBe( 'function' );
    
    // return true, when route success
    expect( route_test.uri(test_string) ).toBeTruthy();
    expect( func.callback ).toHaveBeenCalled();

    expect( func.callback.mostRecentCall.args )
      .toEqual([{group1:'foo',group2:'bar'}, test_string]);

    // return false, when route fail
    expect( route_test.uri('/route/fail/') ).toBeFalsy();
  });

  describe('group use default regexp pattern [^/.,;?\\n]+', function(){
    //[^/.,;?\\n]+ means anything that is not a slash, period, comma, semicolon, question mark, or newline

    it('should match', function(){
      var pattern = '<match>';
      var route_test = route(pattern, func.callback);

      var success_cases = 'aA0"\'!@#$%^&*=+-_: `~';

      success_cases.split('').forEach(function(test) {
        var arg0 = {match : test};

        expect( route_test.uri(test) ).toBeTruthy();
        expect( func.callback.mostRecentCall.args ).toEqual( [arg0, test] );
      });
    });

    it('should not match', function(){
      var pattern = '<match>';
      var route_test = route(pattern, func.callback);
      var fail_cases = '/.,;?\n';

      fail_cases.split('').forEach(function(test) {
        expect( route_test.uri(test) ).toBeFalsy();
      });
    });
  });

  it('can define regexp pattern for each route group', function(){
    var test_cases = [
      {
        pattern : '/<in_list>/<alpha>/<digit>',
        group : {
          in_list : '(foo|bar)',
          alpha : '[a-zA-Z]+',
          digit : '\\d+',
        },
        success : {
          '/foo/StringOnlyContainAlphas/1' : {
            in_list : 'foo',
            alpha : 'StringOnlyContainAlphas',
            digit :'1',
          },
          '/bar/AnotherTest/0706' : {
            in_list : 'bar',
            alpha : 'AnotherTest',
            digit :'0706',
          },
        },
        fail : [
          '/foobar/a/1',
          '/foo/string_underline/1',
          '/bar/string/not_digit',
        ],
      }
    ];

    test_cases.forEach(auto_test);
  });

  it('can set route groups optionally', function(){
    var test_cases = [
      {
        pattern : '/<group1>(/<group2>(/<group3>))',
        success : {
          '/controller/action/param' : {
            group1 : 'controller',
            group2 : 'action',
            group3 : 'param',
          },
          '/controller/action' : {
            group1 : 'controller',
            group2 : 'action',
            group3 : null,
          },
          '/controller' : {
            group1 : 'controller',
            group2 : null,
            group3 : null,
          },
        },
        fail : [],
      }
    ];

    test_cases.forEach(auto_test);
  });

  it('can set default value to optional groups', function(){
    var test_cases = [
      {
        pattern : '/<group1>(/<group2>(/<group3>))',
        default_value : {
          group2 : 'data2',
          group3 : 'data3',
        },
        success : {
          '/controller/action/param' : {
            group1 : 'controller',
            group2 : 'action',
            group3 : 'param',
          },
          '/controller/action' : {
            group1 : 'controller',
            group2 : 'action',
            group3 : 'data3',
          },
          '/controller' : {
            group1 : 'controller',
            group2 : 'data2',
            group3 : 'data3',
          },
        },
        fail : [],
      },
      {
        pattern : '/<group1>(/<group2>)',
        default_value : {
          group2 : 'data2',
          extra : 'data',
        },
        success : {
          '/controller/action' : {
            group1 : 'controller',
            group2 : 'action',
            extra : 'data',
          },
          '/controller' : {
            group1 : 'controller',
            group2 : 'data2',
            extra : 'data',
          },
        },
        fail : [],
      }
    ];

    test_cases.forEach(auto_test);
  });

});

describe('uri-route', function(){
  var func;

  beforeEach(function(){
    func = {callback : function(groups, string) {}};
    spyOn(func, 'callback').andCallThrough();
  });

  it('can set multiple patterns to one callback', function(){
    var group_route = route(func.callback);
    expect( typeof group_route.add ).toBe( 'function' );
    expect( typeof group_route.set_default ).toBe( 'function' );

    group_route.add('foobar', '/foo/bar');

    group_route.add('extra', '/foo/extra').set_default({
      extra_data : 'may be useful',
    });

    group_route.add('page', '/(<controller>(/<action>(/<param>)))', {
      controller : '(blog|forum|message|user)',
    });

    //we can chain 'add' and 'set_default'
    group_route
      .add('article', '/article(/<action>(/<param>))', {
        action : '(list|view|edit)',
        param : '\\d+',
      })
      .set_default({
        controller : 'article',
        action : 'list',
      })
      .add('console', '/<action>(/<param>)', {
        action : '(index|login|logout|create|edit|delete)',
      })
      .set_default({
        controller : 'console',
        action : 'index',
      })
      .add('default', '/(<controller>(/<action>(/<param>)))');

    var success = {
      //forbar
      '/foo/bar' : {},
      //extra
      '/foo/extra' : {
        extra_data : 'may be useful',
      },
      //page
      '/user/login' : {
        controller : 'user',
        action : 'login',
        param : null,
      },
      '/blog/view/20130101' : {
        controller : 'blog',
        action : 'view',
        param : '20130101',
      },
      '/forum' : {
        controller : 'forum',
        action : null,
        param : null,
      },
      //article
      '/article' : {
        controller : 'article',
        action : 'list',
        param : null,
      },
      '/article/view/8848' : {
        controller : 'article',
        action : 'view',
        param : '8848',
      },
      //console
      '/index' : {
        controller : 'console',
        action : 'index',
        param : null,
      },
      '/delete/8848' : {
        controller : 'console',
        action : 'delete',
        param : '8848',
      },
      //default
      '/archives/article-title' : {
        controller : 'archives',
        action : 'article-title',
        param : null,
      },
      '/aboutme' : {
        controller : 'aboutme',
        action : null,
        param : null,
      },
    };

    for (var string in success) {
        expect( group_route.uri(string) ).toBeTruthy();
      
        expect( func.callback.mostRecentCall.args )
          .toEqual( [success[string], string] );
 
    }

  });
});
