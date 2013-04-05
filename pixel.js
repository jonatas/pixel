Cursor = new Meteor.Collection("cursors");
Whiteboard = new Meteor.Collection("whiteboard");
Whiteboards = new Meteor.Collection("whiteboards");

var coordinates = [0,0];
if (Meteor.isClient) {
  PalleteSizes = [];
  for (i = 0; i< 6;i++){
    PalleteSizes[i] = { size: 2+Math.pow(2,i)};
  }

  function randomColor(){
    return Math.floor(Math.random()*16777215).toString(16);
  }

  function findOrCreateWhiteboardId(){
    if (Whiteboards.find().fetch().length == 0){
       return ;
    }
    var d = new Date()
    var where = {
        name: "Public",
         day: d.getDay(),
       month: d.getMonth()+1,
        year: d.getFullYear(),
     user_id: null };
    var whiteboard = Whiteboards.findOne(where);
    var whiteboard_id;
    console.log("find One ", where, whiteboard);
    if (whiteboard != null)
    {
      whiteboard_id = whiteboard._id;
    } else
    {
      whiteboard_id = Whiteboards.insert(where);
    }
    setWhiteboardId(whiteboard_id);
    Session.set("public_whiteboard_id", whiteboard_id);
    return whiteboard_id;
  }
  function findOrCreateWhiteboardByName(name){
    var fields= {name: name, user_id: Session.get("user_id")};
    var whiteboard =  Whiteboards.findOne(fields);
    if (whiteboard == null)
    {
      var d = new Date()
      fields.day = d.getDay();
      fields.month = d.getMonth()+1;
      fields.year = d.getFullYear();
      console.log('Inserindo whiteboards', fields);
      whiteboard_id = Whiteboards.insert(fields);
    } else whiteboard_id = whiteboard._id;
    setWhiteboardId(whiteboard_id);
    return whiteboard_id;
  }

  function setColorForCursor(color)
  {
    Session.set("color",color);
    Cursor.update(Session.get("cursor"), {$set: {color: color}});
  }
  function setWhiteboardId(id){
     Session.set("whiteboard_id", id);
     sel = currentWhiteBoard();
     createNewCursor();
     Meteor.subscribe('cursors', sel);
     Meteor.subscribe('whiteboards');
     Meteor.subscribe('whiteboard', sel);
  }
  function createNewCursor(coordinates){
    Session.set("cursor",
        Cursor.insert({
          whiteboard_id: Session.get("whiteboard_id"),
        user_id: Session.get("user_id"),
        color: Session.get("color"),
        size: Session.get("size"),
        x: 0,
        y: 0}));
  }
  function click(coordinates){
    Whiteboard.insert({
      whiteboard_id: Session.get("whiteboard_id"),
    color: Session.get("color"),
    size: Session.get("size"),
    x: coordinates[0],
    y: coordinates[1]});
    Deps.flush();
  }

  var whiteboardHandle = null;
  Template.screen.cursors = function() {
    return Cursor.find(currentWhiteBoard());
  }
  function currentWhiteBoard()
  {
    var sel = {};
   if (Session.get("whiteboard_id")!=null)
     sel.whiteboard_id = Session.get("whiteboard_id");
   else
     findOrCreateWhiteboardId();

    return sel;
  }
  Template.screen.draws = function() {
    return Whiteboard.find(currentWhiteBoard());
  };

  Template.screen.loading = function () {
    return whiteboardHandle && !whiteboardHandle.ready();
  };

  Template.sizes.sizes = function(){
    return PalleteSizes;
  }
  Template.pallete.events({
    'change .color' : function(evt){
      var color = '#'+evt.target.value;
      setColorForCursor(color);
    }
  });

  Template.pallete.rendered = function(){
    var color = randomColor();
    $('input.color').val(color);
    color = '#'+color;
    $('input.color').css({'background-color': color});
    setColorForCursor(color);
  };
  Template.sizes.events({
    'click .size' : function(evt) {
      console.log('size changed', evt);
      var size = evt.target.attributes.size.nodeValue;
      console.log('new size is', size);
      Session.set("size",size);
      Cursor.update(Session.get("cursor"), {$set: {size: size}});
    }
  });
  Template.whiteboards.mine = function(){
    return Whiteboards.find(
        {$or: [
          {user_id: Session.get("user_id")},
          {_id: Session.get("public_whiteboard_id")}
    ]});
  };
  Template.whiteboards.events(
      {'click input' : function(){
        var name = prompt("Name your whiteboard", "Untitled");
        if (name!=null && name.length > 0){
          findOrCreateWhiteboardByName(name);
        }
       },'click .whiteboard-name' : function(){
         setWhiteboardId(this._id);
       }
      }
  );
  Template.whiteboards.rendered = function(){
    if (!window._gaq)
    {
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-39881982-1']);
        _gaq.push(['_trackPageview']);

         (function() {
           var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
           ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
           var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
         })();
    }
  }

  Meteor.startup(function () {
    Session.set('user_id', Meteor.uuid());
    Session.set("size",24);
    var configuringPointer = false;
    createNewCursor(coordinates);
    d3.select('html').on('mousemove', function() {
      coordinates = d3.mouse(this);
      Cursor.update(Session.get("cursor"), {$set: { x: coordinates[0], y: coordinates[1]}});
    });
    d3.select('.screen').on('click', function(){
      click(coordinates);
    });

     findOrCreateWhiteboardId();
  });
  /*
     var PixelRouter = Backbone.Router.extend({
     routes: {
     ":whiteboard_id": "main"
     },
     main: function (whiteboard_id) {
     var oldList = Session.get("whiteboard_id");
     if (whiteboard_id == null){
     }
     if (oldList !== whiteboard_id) {
     Session.set("whiteboard_id", whiteboard_id);
     }
     },
     setWhiteboard: function (whiteboard_id) {
     this.navigate(whiteboard_id, true);
     }
     });

     Router = new PixelRouter;
     */
}

if (Meteor.isServer) {
  Meteor.publish('screen', function () {
    return Cursor.find();
  });
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
