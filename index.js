require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const featuresCollection = client.db("HotelDB").collection("Features");
    const offerCollection = client.db("HotelDB").collection("Offer");
    const roomCollection = client.db("HotelDB").collection("Rooms");

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