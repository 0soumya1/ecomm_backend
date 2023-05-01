const express = require("express");
require("./db/config"); //config file
const user = require("./db/user"); // model
const Product = require("./db/Product");

const Jwt = require("jsonwebtoken"); //jwt authentication
const jwtKey = "e-comm";

const cors = require("cors");
const app = express();

app.use(express.json()); // postman  as a middleware
app.use(cors()); //middleware

app.post("/register", async (req, resp) => {
  //route for register api
  let User = new user(req.body);
  let result = await User.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, {expiresIn:"1h"}, (err, token) => {
    if (err) {
      resp.send({
        result: "Something went worng , Please try after sometime.",
      });
    }
    resp.send({ result, auth: token });
  });
});
// abgh
app.post("/login", async (req, resp) => {
  // route for login api
  console.log(req.body);
  if (req.body.password && req.body.email) {
    let User = await user.findOne(req.body).select("-password");
    if (User) {
      Jwt.sign({ User }, jwtKey, {expiresIn:"1h"}, (err, token) => {
        if (err) {
          resp.send({
            result: "Something went worng , Please try after sometime.",
          })
        }
        resp.send({ User, auth:token });
      });
    } else {
      resp.send({ result: "No User Found" });
    }
  } else {
    resp.send({ result: "No User Found" });
  }
});

app.post("/add-product", verifyToken, async (req, resp) => {
  // route for add-product api
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

app.get("/products", verifyToken, async (req, resp) => {
  // route for product list api
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "No Products Found" });
  }
});

app.delete("/product/:id", verifyToken, async (req, resp) => {
  //route for delete product api
  let result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.get("/product/:id", verifyToken, async (req, resp) => {
  //route for single update product api
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Record Found" });
  }
});

app.put("/product/:id", verifyToken, async (req, resp) => {
  //route for update product api
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => { // api for search product api
  let result = await Product.find({
    "$or": [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } }
    ]
  });
  resp.send(result);
});

function verifyToken(req, resp, next){
  let token = req.headers["authorization"];
  if(token){
      token = token.split(" ")[1];
      Jwt.verify(token, jwtKey, (err, valid)=>{
        if(err){
          resp.status(401).send({result: "please provide valid token"});
        }else{
          next();
        }
      });
  }else{
     resp.status(403).send({result: "please add token with header"});
  }
  //console.log("middleware called", token)
}

app.listen(5000);
