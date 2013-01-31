"use strict";
var util = require('util');
var named_capture = require('../lib/route-capture');

describe('route-capture', function(){
  it('can make route string to regexp pattern string', function(){
    var capture = new named_capture('');
    expect( typeof capture.make ).toBe( 'function' );

    expect( capture.make('/foo/bar') ).toBe( '^/foo/bar$' );
    expect( capture.names ).toEqual( [] );

    expect( capture.make('/<foo>/<bar>') )
      .toBe( '^/([^/.,;?\\n]+)/([^/.,;?\\n]+)$' );
    expect( capture.names ).toEqual( ['foo', 'bar'] );

    expect( capture.make('/<foo>(/<bar>)') )
      .toBe( '^/([^/.,;?\\n]+)(?:/([^/.,;?\\n]+))?$' );
    expect( capture.names ).toEqual( ['foo', 'bar'] );

    expect( capture.make('/<foo>', {foo:'(tmp|test)'}) )
      .toBe( '^/((?:tmp|test))$' );

    expect( capture.make('/<foo>', {foo:'[^/]+\.(jpg|png)'}) )
      .toBe( '^/([^/]+\.(?:jpg|png))$' );

    expect( capture.make('/(<foo>)', {foo:'(tmp|test)'}) )
      .toBe( '^/(?:((?:tmp|test)))?$' );

    expect( capture.make('/<foo>(/<bar>)', {foo:'(tmp|test)', bar:'[^/]+\\.(jpg|png|gif)'}) )
      .toBe( '^/((?:tmp|test))(?:/([^/]+\\.(?:jpg|png|gif)))?$' );

  });

  describe('can get named capture groups', function(){
    var success_cases = [
      {
        pattern : '/<foo>/<bar>',
        sample : {
          '/named/group' : {foo:'named', bar:'group'}
        },
      }
      ,
      {
        pattern : '/<foo>(/<bar>)',
        sample : {
          '/named' : {foo:'named', bar:null},
        },
      }
      ,
      {
        pattern : '/<foo>(/<bar>)',
        default_value : {bar:'default bar'},
        sample : {
          '/named' : {foo:'named', bar:'default bar'},
        },
      }
      ,
      {
        pattern : '/<foo>(/<bar>)',
        group : {foo:'(tmp|test)', bar:'[^/]+\\.(jpg|png|gif)'},
        default_value : {bar:'default bar'},
        sample : {
          '/tmp' : {foo:'tmp', bar:'default bar'},
          '/tmp/bg.jpg' : {foo:'tmp', bar:'bg.jpg'},
          '/test/file.gif' : {foo:'test', bar:'file.gif'},
        },
      }
    ];

    success_cases.forEach(function(test) {
      it('pattern: '+test.pattern, function(){
        var capture = new named_capture(test.pattern, test.group);
        if (test.default_value) {
          capture.set_default(test.default_value);
        }
        for (var string in test.sample) {
          expect( util.isRegExp(capture.regex) ).toBeTruthy();
          expect( capture.exec(string) ).toEqual( test.sample[string] );
        }
      });
    });
  });
});

