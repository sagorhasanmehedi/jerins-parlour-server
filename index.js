const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 7000;
require("dotenv").config();
const Objectid = require("mongodb").ObjectId;
var admin = require("firebase-admin");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sovrn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var serviceAccount = JSON.parse(process.env.FIREBASE_IDTOKEN);

const { auth } = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function verifyTOKEN(req, res, next) {
  if (req.headers.authorization.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decodedemail = await admin.auth().verifyIdToken(token);
      req.decodedemail = decodedemail.email;
      console.log(decodedemail);
    } catch {}
  }

  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("JerinsParlour");
    const servicescollection = database.collection("Services");
    const usercollection = database.collection("Users");
    const ordercollection = database.collection("Order");

    // get services
    app.get("/services", async (req, res) => {
      const result = await servicescollection.find({}).toArray();
      res.send(result);
    });

    // get singale services
    app.get("/singaleservice/:id", async (req, res) => {
      const result = await servicescollection.findOne({
        _id: Objectid(req.params.id),
      });
      res.send(result);
    });

    // post user data
    app.post("/user", async (req, res) => {
      const result = await usercollection.insertOne(req.body);
      console.log(result);
      res.send(result);
    });

    // put user data
    app.put("/user", async (req, res) => {
      const filter = { email: req.body.email };
      const options = { upsert: true };
      const data = req.body;
      const updateDoc = {
        $set: { data },
      };
      const result = await usercollection.updateOne(filter, updateDoc, options);
    });

    // post order
    app.post("/products", async (req, res) => {
      const result = await ordercollection.insertOne(req.body.data);
      res.send(result);
    });

    // get user order
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const result = await ordercollection.find({ email }).toArray();
      res.send(result);
    });

    // get admin order
    app.get("/adminorder", async (req, res) => {
      const result = await ordercollection.find({}).toArray();
      res.send(result);
    });

    // post admin roll
    app.put("/admin/roll", verifyTOKEN, async (req, res) => {
      console.log(req.body);
      if (req.decodedemail) {
        const chakingemail = await usercollection.findOne({
          email: req.decodedemail,
        });
        if (chakingemail.roll === "ADMIN") {
          const filter = { email: req.query.email };
          const updateDoc = {
            $set: {
              roll: req.query.roll,
            },
          };
          const result = await usercollection.updateOne(filter, updateDoc);
          res.send(result);
        }
      } else {
        res.status(401).json({ message: "not verify admin" });
      }
    });

    // chakin is admin
    app.get("/admin/isadmin", async (req, res) => {
      const email = req.query.email;
      const result = await usercollection.findOne({ email });
      let isadmin = false;
      if (result?.roll === "ADMIN") {
        isadmin = true;
      }
      res.send(isadmin);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("jerins parlour runing");
});

app.listen(port, () => {
  console.log("Jerins parlur runing in port :", port);
});

// heroki project name : secret-journey-43006
