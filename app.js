//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ =require("lodash");

const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// got this from mongodb atlas
mongoose.connect("mongodb+srv://admin-Swapnil:Test123@cluster0.spe8uhx.mongodb.net/todoListDB", {
  useNewUrlParser: true
});
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//creating a schema
const itemSchema = {
  name: String
};

//creating a mongoose model
const Item = mongoose.model("Item", itemSchema);

//creating documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new file"
});

const item3 = new Item({
  name: "Hit to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name:String,
  items:[itemSchema]
});

const List= new mongoose.model("List",listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
      if (foundItems.length == 0) {
        //adding the documents in collection (items)
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved all the items");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today",newListItems: foundItems});
      }
  });

});

app.post("/", function(req, res) {
  //creating a new document when we enter a todolist
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem=new Item({
    name:itemName
  });

  // console.log(listName);

  if(listName==="Today"){
      newItem.save();
      res.redirect("/");
  }else{
      List.findOne({name:listName},function(err,foundList){
          foundList.items.push(newItem);
          foundList.save();
          res.redirect("/"+listName);
      });
  }

});

app.post("/delete",function(req,res){
  console.log(req.body);
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;
  // Item.deleteOne({_id:checkedItemId},function(err){if(err){console.log(err);}else{console.log("Successfully deleted the id");}});
  // OR
  if(listName=="Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
   }else{
    // need to remove document from items array present in the particular list
    // We can do this using for loop also for items array but here we are using $pull functionality from mongodb
    // first parameter:conditions, 2nd parameter: updates(yahaan mention krrna hoga pull condition ko),3rd para is callback functionality
    // <ModelName>.findOneAndUpdate({conditions},{$pull:{field:{query}}},function(err,results){});
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }

});

//using dynamic parameter
app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);
  // checking if list already exists in database
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        console.log("doesn't exist");
        //create a new list

        const list=new List({
            name:customListName,
            items:defaultItems
        });

        list.save();
        res.redirect("/"+customListName);
      }else{
        console.log("exists");
        // Show previous one
        res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
