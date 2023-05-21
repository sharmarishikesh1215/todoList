//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _= require("lodash"); // To use _.capitalize(String=[''])
mongoose.set('strictQuery', false);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://sharmarishiksh:dummyuser123@cluster0.tgngy23.mongodb.net/todolistDB");

// MONGOOSE SCHEMA
const itemsSchema = new mongoose.Schema ({
  name: String
});

// MONGOOSE MODEL 
const Item = mongoose.model("Item", itemsSchema);

// MONGOOSE DOCUMENT
const item1 = new Item ({
  name: "Welcome to you todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Custom list

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}).then(function(FoundItems){
    
    // TO AVOID REPETITION OF DEFAULT ITEMS
    if(FoundItems.length === 0) {
      Item.insertMany(defaultItems)
      .then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/"); // Second time it directly goes to the else statement
    } else {
      res.render("list", {listTitle: "Today", newListItems:FoundItems});
    } 

  })
   .catch(function(err){
    console.log(err);
  })

});

// ROUTING PARAMETERS
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList) {
    if(!foundList) {
      console.log("Doesn't exist!");

      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName);

    } else {
      console.log("Exist");

      // Show an existing
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }).catch(function(err){
    console.log(err);
  })
});

app.post("/delete", function(req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.deleteOne({ _id: checkItemId }).then(result => {
      console.log(result);
      res.redirect("/");
  });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      { $pull: {items: {_id: checkItemId}} },
      ).then(function(foundList){
        res.redirect("/" + listName);
      }).catch(function(err) {
        console.log(err);
      })
  }
 
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch(function(err) {
      console.log(err);
    })
  }
  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
