requirejs.config({
  baseUrl: 'js/',
  appDir: 'app/',
  paths: {
    'windows' : 'lib/windows',
    'msgpack': 'lib/msgpack',
    'text' : 'lib/text',
    'jquery' : 'lib/jquery-2.1.1.min',
    'bootstrap' : 'lib/bootstrap.min',
    'bootstrap.colorpicker' : 'lib/bootstrap-colorpicker',
    'underscore': 'lib/underscore-min',
    'underscore-contrib' : 'lib/underscore-contrib.min',
    'ko' : 'lib/knockout-3.2.0.min',
    'd3' : 'lib/d3.min',
    'signals' : 'lib/signals.min',
    'crossroads' : 'lib/crossroads.min',
    'hasher' : 'lib/hasher'
  },
  shim: {
    'jquery': {
      exports: '$'
    },
    'bootstrap': {
      deps: ['jquery'],
      exports: '$.fn.popover'
    },
    'bootstrap.colorpicker': {
      deps: ['bootstrap'],
      exports: '$.fn.colorpicker'
    },
    'underscore': {
      exports: '_.map'
    },
    'underscore-contrib': {
      deps: ['underscore'],
      exports: '_'
    },
    'ko': {
      exports: 'ko'
    },
    'windows' : {
      deps : ['msgpack'],
      exports : 'windows'
    },    
    'hasher' : {
      deps: ['signals']
    }
  }
});

//prevent context menu
document.oncontextmenu = function(){ return false; };

requirejs(['underscore-contrib', 'crossroads', 'hasher', 'ko', 'app/main-window','app/utils','app/routes', 'app/data', 'app/tag-types', 'app/css','jquery', 'bootstrap'], function(_, crossroads, hasher, ko, main_window, utils, routes, data, tag_types, css, $){

  ko.applyBindings(main_window, $('body')[0]);
  tag_types.init().done(function(){
    css.refreshRules();
  });

  var DEFAULT_HASH = routes.HOME();

  function setHashSilently(hash){
    hasher.changed.active = false; //disable changed signal
    hasher.setHash(hash); //set hash without dispatching changed signal
    hasher.changed.active = true; //re-enable signal
  }

  function parseHash(newHash, oldHash){
    // second parameter of crossroads.parse() is the
    // "defaultArguments" and should be an array
    // so we ignore the "oldHash" argument to avoid issues.
    console.log('old: ' + oldHash + ', new: ' + newHash);
    crossroads.parse(newHash);
  }

  


  //setup crossroads
  crossroads.addRoute('/home/:reload:', function(reload){
    $('#widget-canvas').empty();
    if (reload){
      utils.navigate(routes.HOME());
    };
    var el = $('<div>', { "style": "height: 100%;"}).appendTo($('#widget-canvas'));
    require(['app/home-view'], function(home){
      home.render(el);
    });
  });

  crossroads.addRoute('/admin/', function(id){
    $('#widget-canvas').empty();
    var el = $('<div>', { "style": "height: 100%;overflow: scroll;"}).appendTo($('#widget-canvas'));

    require(['app/admin-view'], function(admin){
      admin.render(el);
    });
  });

  crossroads.addRoute('/train/{id}', function(id){
    $('#widget-canvas').empty();
    var el = $('<div>', { "style": "height: 100%;overflow: scroll;"}).appendTo($('#widget-canvas'));

    require(['app/markup'], function(markup){
      markup.render(el, id);
    });
  })

  
  crossroads.addRoute('/test/:id:', function(id){
    $('#widget-canvas').empty();
    var el = $('<div>', { "style": "height: 100%;"}).appendTo($('#widget-canvas'));
    require(['app/test'], function(test){
      test.render(el, id);
    });
  })

  crossroads.routed.add(function(req, data){
    console.log('routed: ' + req);
    console.log(data.route +' - '+ data.params +' - '+ data.isFirst);
  });

  crossroads.bypassed.add(function(req){
    console.log('route not found: ' + req);
    //empty request will just redirect to HOME
    if (req != ""){
      alert('Error: route not found, go back');
    }
  });

  hasher.initialized.add(parseHash); //parse initial hash
  hasher.changed.add(parseHash); //parse hash changes


  var init = function(){
    hasher.init(); //start listening for hash changes

    if (hasher.getHash().length < 1){
      hasher.setHash(DEFAULT_HASH);
    }
    utils.autosave_interval(data);
  };

  if (data.trainings().length < 1){
    $.ajax({
          url:'data/last_save',
          type:"GET",
          contentType:"application/json; charset=utf-8",
          dataType:"json"
    }).done(function(resp){
      console.log('data loaded from prev session');
      data.bulkload(resp.trainings, resp.filename);
      init();
    });
  } else {
    init();
  };

});
