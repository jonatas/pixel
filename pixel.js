Cursor = new Meteor.Collection("cursors");
Whiteboard = new Meteor.Collection("whiteboard");

function now() {
  return new Date().getTime();
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
     Cursor.insert({
       userId: Session.get("userId"),
        color: Session.get("color"),
         size: Session.get("size"),
           x: coordinates[0],
           y: coordinates[1]}));
}
function click(coordinates){
  Whiteboard.insert({
     color: Session.get("color"),
      size: Session.get("size"),
         x: coordinates[0],
         y: coordinates[1]});
}
if (Meteor.isClient) {
  Meteor.subscribe('cursors');
  Meteor.subscribe('whiteboard');
  Template.screen.cursors = function() {
    return Cursor.find();
  };
  Template.screen.draws = function() {
    return Whiteboard.find();
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
      Cursor.update(Session.get("cursor"), {$set: {color: color}});
    }
  });
  Template.sizes.events({
    'click .size' : function(evt) {
      console.log('size changed', evt);
      var size = evt.target.attributes.size.nodeValue;
      console.log('new size is', size);
      Session.set("size",size);
      Cursor.update(Session.get("cursor"), {$set: {size: size}});
    }
  });

  Meteor.startup(function () {
     Session.set('color', PalleteColors[0].color);
     Session.set('userId', Meteor.uuid());
     Session.set("size",24);
     var coordinates = [0,0];
     var configuringPointer = false;
     createNewCursor(coordinates);
     d3.select('html').on('mousemove', function() {
       if (! configuringPointer) {
         coordinates = d3.mouse(this);
         Cursor.update(Session.get("cursor"), {$set: { x: coordinates[0], y: coordinates[1]}});
       }
     });
     d3.select('.conf').on('mouseover', function() {
       configuringPointer = true;
     });
     d3.select('.conf').on('mouseout', function() {
       configuringPointer = false;
     });
     d3.select('.screen').on('click', function(){
       click(coordinates);
     });
  });
}
if (Meteor.isServer) {
  Meteor.publish('screen', function () {
    return Cursor.find();
  });
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
