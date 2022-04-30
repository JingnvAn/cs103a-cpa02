const express = require('express');
const axios = require('axios')

const app = express();
const PORT = 3000;

/**************************************
 * Load packages to support the server
 **************************************/
const createError = require("http-errors"); // handle server errors
const path = require('path'); // refer to local paths
const cookieParser = require('cookie-parser'); // handle cookies
const session = require('express-session'); // handle sessions using cookies
const bodyParser = require('body-parser') // handle HTML from input
const debug = require('debug')('personalapp:server');
const layouts = require('express-ejs-layouts');
var fs = require('fs');

/*************************
 * connect to the database
 *************************/
const mongoose = require('mongoose');
const mongodb_URI = 'mongodb://localhost:27017/bunnybearbao'
mongoose.connect(mongodb_URI, { useNewUrlParser: true} );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){ console.log("Success! Connected to mongoDB")});

/**
 * Import Models to communicate with the database
 */
const Item = require("./models/Item");
const ImgModel = require("./models/Image")

//it specifies that the app will be using EJS as our view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

//set up multer for storing uploaded files
var multer = require('multer'); 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
  
var upload = multer({ storage: storage });

/*****************************************************
* Defining the routes the Express server will respond to
******************************************************/

// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
app.use(auth)

// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  }
  else res.redirect('/login')
}

// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res) => {
  res.render("index");
});

app.get('/about', (req, res)=> {
	res.render('about');
})

app.get('/myorder', (req, res)=> {
	res.render('myorder');
})

app.get('/recipes',
  (req,res,next) => {
    try {
      res.locals.meals = []
      res.locals.ingredient = 'none'
      res.render('recipes')
    } catch (error) {
      next(error)     
    }
  })

app.post('/recipes',
	async (req,res,next) => {
	try {
		const response = await axios.get('http://www.themealdb.com/api/json/v1/1/filter.php?i='+req.body.ingredient)
		res.locals.meals = response.data.meals  // list of objects {strMeal, strMealThumb, idMeal}
		res.locals.ingredient = req.body.ingredient
		res.render('recipes')
		
	} catch (error) {
		next(error)     
	}
})

app.get('/recipe/:idMeal',
async (req,res,next) => {
	try {
		const response = await axios.get('http://www.themealdb.com/api/json/v1/1/lookup.php?i='+req.params.idMeal)
		res.locals.meal = response.data.meals[0]  // 
		console.dir(res.locals.meal)
		res.render('recipe')
		
	} catch (error) {
		next(error)     
	}
})

app.get('/addItem', (req, res)=>{
  ImgModel.find({}, (err, items) => {
    if (err) {
        console.log(err);
        res.status(500).send('An error occurred', err);
    }
    else {
        res.render('addItem', { items: items });
    }
  });
})

app.post("/addItem", upload.single('image'), async (req, res, next)=>{
    try {
        const {catagory,name,price,size,image,
            inventory,details,ingredients,warnings,directions} = req.body

        // check to make sure that item name is not already taken!!
        const duplicates = await Item.find({name})
        
        if (duplicates.length>0){
            // it would be better to render a page with an error message instead of this plain text response
            res.send("item name has already been taken, please go back and modify your input.")
        }else {
            // the item name has not been taken so create a new item and store it in the database           
            const newItem = new Item({
                catagory:catagory,
                name:name,
                price:price,
                size:size,
                picture:image,
                inventory:inventory,
                details:details,
                ingredients:ingredients,
                warnings:warnings,
                directions:directions
            })
            const obj = {
              name: name,
              desc: details,
              img: {
                  data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                  contentType: 'image/png'
              }
            }

            ImgModel.create(obj, (err, item)=>{
              if(err) console.log(err);
              else {
                item.save();
              }
            })

            newItem.save(function(err){
              if(err) {
                res.send(error);
              }else{
                res.send("Successfully saved.");
              }
			})
        }
    } catch (error) {
        next(error)
    }
})

app.get("/searchItem", (req, res, next)=> {
  res.locals.items = [];
  res.locals.keyword = "none";
  res.render("searchItem");
})

app.post("/searchItem", async (req, res, next)=> {
  const keyword = req.body.keyword
  const items = await Item.find({ name: { $regex: keyword } });
  res.locals.keyword = keyword
  res.locals.items = items;
  res.render("searchItem");
})

app.listen(PORT, (error) =>{
	if(!error)
		console.log("Success! App is running on port " + PORT);
	else
    console.log("Error!! ", error);	
	}
);
