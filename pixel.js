Screen = new Meteor.Collection("screen");

function now() {
  return new Date().getTime();
}
function randomColor(){
  return '#'+Math.floor(Math.random()*16777215).toString(16);
}
if (Meteor.isClient) {
  Meteor.subscribe('screen');
  Template.screen.cursors = function() {
    return Screen.find();
  };

  Template.cursorconf.events({
    'change select#size' : function(evt) {
      Screen.update(Session.get("cursor"), {$set: {size: evt.target.value}});
    },
    'change select#currentColor': function(evt) {
      var color = evt.target.value;
      if (color == "random"){
        color = randomColor();
      }
      Screen.update(Session.get("cursor"), {$set: {color: color}});
      console.log("new color: ",color);
    }
  });

  Meteor.startup(function () {
     Session.set('userId', Meteor.uuid());
     Session.set("cursor", Screen.insert({userId: Session.get("userId"), color: randomColor(), x: 100, y: 100, size: 4}));
     d3.select('html').on('mousemove', function()
       {
         var coordinates = d3.mouse(this);
         Screen.update(Session.get("cursor"), {$set: { x: coordinates[0], y: coordinates[1]}});
       }
     );
  });
}
if (Meteor.isServer) {
  Meteor.publish('screen', function () {
    return Screen.find();
  });
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
