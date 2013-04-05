Cursor = new Meteor.Collection("cursors");
Pixel = new Meteor.Collection("pixels");
Whiteboard = new Meteor.Collection("whiteboards");

var coordinates = [0,0];
if (Meteor.isClient) {
  PalleteSizes = [];
  for (i = 0; i< 6;i++){
    PalleteSizes[i] = { size: 2+Math.pow(2,i)};
  }

  function randomColor(){
    return Math.floor(Math.random()*16777215).toString(16);
  }

  function findOrCreatePublicWhiteboardId(){
    if (Whiteboard.find().fetch().length == 0){
       return  ;
    }
    var d = new Date()
    var where = {
        name: "Public",
         day: d.getDay(),
       month: d.getMonth()+1,
        year: d.getFullYear(),
     user_id: null };
    var whiteboard = Whiteboard.findOne(where);
    var whiteboard_id;
    if (whiteboard != null)
    {
      whiteboard_id = whiteboard._id;
    } else
    {
      whiteboard_id = Whiteboard.insert(where);
    }
    Session.set("public_whiteboard_id", whiteboard_id);
    setWhiteboardId(whiteboard_id);
    return whiteboard_id;
  }
  function findOrCreateWhiteboardByName(name){
    var fields= {name: name, user_id: Session.get("user_id")};
    var whiteboard =  Whiteboard.findOne(fields);
    if (whiteboard == null)
    {
      var d = new Date()
      fields.day = d.getDay();
      fields.month = d.getMonth()+1;
      fields.year = d.getFullYear();
      whiteboard_id = Whiteboard.insert(fields);
    } else whiteboard_id = whiteboard._id;
    setWhiteboardId(whiteboard_id);
    return whiteboard_id;
  }
  Deps.autorun(function(){
     Meteor.subscribe('whiteboards', Session.get("user_id"));
     Meteor.subscribe('cursors', Session.get("whiteboard_id"));
     Meteor.subscribe('pixels', Session.get("whiteboard_id"));
  });
  Meteor.autorun(function () {
    if (Meteor.userId()) {
      user_id = Session.get("user_id");
      if (user_id != Meteor.userId()){
        Session.set("user_id", Meteor.userId());
        if (user=Meteor.users.findOne(Meteor.userId()))
         {
          Session.set("name",user.profile.name);
        }
        Cursor.update(Session.get("cursor"),
          {$set: {user_id: Meteor.userId(), name: Session.get("name")}});
        Whiteboard.find({user_id: user_id}).forEach(function(whiteboard){
          Whiteboard.update(whiteboard._id, {$set: {user_id: Meteor.userId()}});
        });
        Pixel.find({user_id: user_id}).forEach(function(pixel){
          Pixel.update(pixel._id, {$set: {user_id: Meteor.userId()}});
        });
      }
    } else {
      if (! Session.get("whiteboard_id"))
        findOrCreatePublicWhiteboardId();
    }
  });
  function setColorForCursor(color)
  {
    Session.set("color",color);
    Cursor.update(Session.get("cursor"), {$set: {color: color}});
  }
  function setWhiteboardId(id){
     Session.set("whiteboard_id", id);
     createNewCursor([0,0]);
  }
  function createNewCursor(coordinates){
    if (Session.get("cursor")){
      Cursor.remove(Session.get("cursor"));
    }
    if (coordinates == null)
      coordinates = [0,0]

    Session.set("cursor",
        Cursor.insert({
          whiteboard_id: Session.get("whiteboard_id"),
        user_id: Session.get("user_id"),
        name: (Session.get("name") || "Anonymous"),
        color: Session.get("color"),
        size: Session.get("size"),
        x: coordinates[0],
        y: coordinates[1]}));
  }
  function click(coordinates){
    Pixel.insert({
      whiteboard_id: Session.get("whiteboard_id"),
              color: Session.get("color"),
               size: Session.get("size"),
            user_id: Session.get("user_id"),
    x: coordinates[0],
    y: coordinates[1]});
    update = { last_click_at: new Date().getTime()};
    Cursor.update(Session.get("cursor"), {$set: update}); 
  }
  Template.screen.cursors = function() {
    return Cursor.find();
  }
  Template.screen.draws = function() {
    return Pixel.find();
  };
  Template.painters.painters = function() {
    return Cursor.find( {last_click_at: {$gt: new Date().getTime() - 10000}});
  };
  Template.whiteboards.mine = function(){
    return Whiteboard.find( {$or: [
          {user_id: Session.get("user_id")},
          {_id: Session.get("public_whiteboard_id")} ]});
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
      var size = evt.target.attributes.size.nodeValue;
      Session.set("size",size);
      Cursor.update(Session.get("cursor"), {$set: {size: size}});
    }
  });
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
  Meteor.setInterval(function(){
    Cursor.find({last_click_at: {$lt: new Date().getTime() - 60000}}).forEach(function(cursor){
      Cursor.remove(cursor._id);
      });
  }, 10000);

  Meteor.startup(function () {
    Session.set('user_id', Meteor.uuid());
    Session.set("size", 32);
    d3.select('html').on('mousemove', function() {
      coordinates = d3.mouse(this);
      if (! Session.get("cursor")|| !Cursor.findOne(Session.get("cursor")))
        createNewCursor(coordinates);
      Cursor.update(Session.get("cursor"), {$set: { x: coordinates[0], y: coordinates[1]}});
    });
    d3.select('.screen').on('click', function(){
      click(coordinates);
    });

     findOrCreatePublicWhiteboardId();
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
  Meteor.publish('cursors', function (whiteboard_id) {
    return Cursor.find({whiteboard_id: whiteboard_id});
  });
  Meteor.publish('whiteboards', function (user_id) {
    return Whiteboard.find({$or: [{user_id: user_id}, { name: "Public"}]});
  });
  Meteor.publish('pixels', function (whiteboard_id) {
    return Pixel.find({whiteboard_id: whiteboard_id});
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
