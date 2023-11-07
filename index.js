require('dotenv').config()
const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
  origin: ['http://localhost:5174',"https://assignment-11-b9aa0.web.app","https://assignment-11-b9aa0.firebaseapp.com"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.get("/",(req,res)=>{
   res.send("Hello World!");
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jp082z4.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token
  if (!token) {
    return res.status(401).send({ message: "Invalid user" })
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid user err" })
    }
    req.user = decoded;
    next()
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const featuresCollection = client.db("HotelDB").collection("Features");
    const offerCollection = client.db("HotelDB").collection("Offer");
    const roomCollection = client.db("HotelDB").collection("Rooms");
    const bookCollection = client.db("HotelDB").collection("bookings");

    const reviewCollection = client.db("HotelDB").collection("Review");

    app.post("/jwt", async (req, res) => {
      const user = req.body
      console.log(user);
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1h" })
      

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite:"none"
          
        })
        .send({ success: true });
    });


    app.post("/logout", async (req, res) => {
      const user = req.body
      console.log(user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });

    })
    

    app.get("/features",async(req,res) => {
        const cursor =  featuresCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get("/offer",async(req,res) => {
        const cursor =  offerCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get("/rooms",async(req,res) => {

      const sortObj = {};

      const sortField = req.query.sortField
      const sortOrder = req.query.sortOrder

      if(sortField && sortOrder) {
        sortObj[sortField] = sortOrder
      }


        const cursor =  roomCollection.find().sort(sortObj);
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get("/details/:id",async(req,res) => {
       const id = req.params.id
       const query = {_id : new ObjectId(id)};
       const result= await roomCollection.findOne(query);
       res.send(result);
    });

    app.post("/bookings",async(req,res) => {
      const data = req.body
      const result = await bookCollection.insertOne(data);
      res.send(result);
    });

    app.get("/bookings",verifyToken ,async(req,res)=>{

      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden" })
      }
      
        let query = {}
        if(req.query?.email){
          query = {email : req.query.email}
        }
        const cursor = bookCollection.find(query)
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get("/bookings/update/:id",async(req,res) => {
      const id= req.params.id
      const query ={_id : new ObjectId(id)};
      const result = await bookCollection.findOne(query)
      res.send(result);

    });

    app.put("/bookings/update/:id",async(req,res) => {
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const data = req.body
      console.log(data);
      const updateDoc = {
        $set:{
          date : data.newDate
        }
      }
      const result = await bookCollection.updateOne(filter,updateDoc,options)
      res.send(result);
    });

    app.delete("/bookings/update/:id",async(req,res) => {
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const results= await bookCollection.deleteOne(query)
      res.send(results);
    });

    app.post("/reviews",async(req, res) => {
        const data = req.body
        const result = await reviewCollection.insertOne(data)
        res.send(result);
    });

    app.get("/reviews/:id",async(req, res)=>{
      const id = req.params.id
      const query = {room_id : id}
      console.log(id);
      const results = await reviewCollection.find(query).toArray()
      res.send(results);
    
    });
 


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`listening on ${port}`);
});