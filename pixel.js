Screen = new Meteor.Collection("screen");

function now() {
  return new Date().getTime();
}
function randomColor(){
  return '#'+Math.floor(Math.random()*16777215).toString(16);
}

PalleteColors = [];
PalleteSizes = [];

colors = "#3182bd #6baed6 #9ecae1 #c6dbef #e6550d #fd8d3c #fdae6b #fdd0a2 #31a354 #74c476 #a1d99b #c7e9c0 #756bb1 #9e9ac8 #bcbddc #dadaeb #636363 #969696 #bdbdbd #d9d9d9".split(" ");
// thanks colors from # d3.scale.category20c()
for (i = 0; i<colors.length;i++){
  PalleteColors[i] = {color: colors[i], size: 25};
  PalleteSizes[i] = { size: i*2};
}

function createNewCursor(coordinates){
   Session.set("cursor",
     Screen.insert({
       userId: Session.get("userId"),
        color: Session.get("color") || "black",
         size: Session.get("size")||4, 
           x: coordinates[0],
           y: coordinates[1]}));
}
if (Meteor.isClient) {
  Meteor.subscribe('screen');
  Template.screen.cursors = function() {
    return Screen.find();
  };

  Template.pallete.colors = function(){
    return PalleteColors;
  }
  Template.sizes.sizes = function(){
    return PalleteSizes;
  }
  Template.pallete.events({
    'click .color' : function(evt){
      console.log("click .color");
      var color = evt.target.attributes.color.nodeValue;
      Session.set("color",color);
      Screen.update(Session.get("cursor"), {$set: {color: color}});
    }
  });
  Template.sizes.events({
    'click .size' : function(evt) {
      console.log('size changed', evt);
      var size = evt.target.attributes.size.nodeValue;
      console.log('new size is', size);
      Session.set("size",size);
      Screen.update(Session.get("cursor"), {$set: {size: size}});
    }
  });

  Meteor.startup(function () {
     Session.set('color', randomColor());
     Session.set('userId', Meteor.uuid());
     Session.set("size",8);
     var coordinates = [0,0];
     createNewCursor(coordinates);
     d3.select('.screen').on('mousemove', function() {
       coordinates = d3.mouse(this);
       Screen.update(Session.get("cursor"), {$set: { x: coordinates[0], y: coordinates[1]}});
     });
     d3.select('.screen').on('click', function(){
       createNewCursor(coordinates);
     });
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
